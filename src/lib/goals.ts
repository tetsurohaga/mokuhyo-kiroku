/**
 * 目標（Goal）の Firestore アクセス処理
 * -------------------------------------------------------------
 * 画面コンポーネントから Firestore の細かい API を直接触らずに済むよう、
 * この1ファイルに目標まわりの読み書きをまとめている。
 * （凝った抽象化はせず、Firestore の呼び出しを素直に関数化しただけの層）
 */
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Goal, GoalStatus } from "./types";

/**
 * ある利用者の goals コレクションへの参照を返す。
 * パスは `users/{uid}/goals`。全データを uid 配下に閉じ込めることで、
 * Security Rules を `request.auth.uid == uid` の一行で書ける（設計書 6.2）。
 */
function goalsCollection(uid: string) {
  return collection(db, "users", uid, "goals");
}

/** 単一の目標ドキュメントへの参照 */
function goalDoc(uid: string, goalId: string) {
  return doc(db, "users", uid, "goals", goalId);
}

/**
 * Firestore のドキュメントスナップショットを、アプリで使う Goal 型に変換する。
 * Firestore はドキュメントIDを data() に含めないため、ここで id を合成している。
 */
function toGoal(id: string, data: Record<string, unknown>): Goal {
  return {
    id,
    title: (data.title as string) ?? "",
    description: (data.description as string) ?? "",
    status: (data.status as GoalStatus) ?? "in_progress",
    category: (data.category as string) ?? "blog",
    createdAt: (data.createdAt as Goal["createdAt"]) ?? null,
    updatedAt: (data.updatedAt as Goal["updatedAt"]) ?? null,
    completedAt: (data.completedAt as Goal["completedAt"]) ?? null,
  };
}

/**
 * 目標一覧を「購読」する。
 *
 * onSnapshot は一度きりの取得（getDocs）と違い、Firestore 側の変更を
 * リアルタイムに受け取り続ける API。追加・更新のたびに手動で再取得する
 * コードを書かずに済むので、画面の状態が常にDBと一致する。
 *
 * 戻り値は購読解除用の関数。React の useEffect のクリーンアップで呼ぶこと。
 *
 * なお、ステータス（対応中／完了）での絞り込みは Firestore の where 句ではなく
 * 画面側のメモリ上で行っている。where + orderBy の組み合わせは複合インデックスが
 * 必要になるが、個人利用の小規模データではその手間に見合わないため。
 */
export function subscribeGoals(
  uid: string,
  onData: (goals: Goal[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  // 更新日時の新しい順に並べる（単一フィールドの並び替えは自動インデックスで動く）
  const q = query(goalsCollection(uid), orderBy("updatedAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((d) => toGoal(d.id, d.data())));
    },
    onError,
  );
}

/**
 * 目標を1件だけ購読する（目標詳細画面で使用）。
 * 存在しない場合（削除された等）は null を渡す。
 */
export function subscribeGoal(
  uid: string,
  goalId: string,
  onData: (goal: Goal | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    goalDoc(uid, goalId),
    (snapshot) => {
      onData(snapshot.exists() ? toGoal(snapshot.id, snapshot.data()) : null);
    },
    onError,
  );
}

/** 目標を1件取得する（編集画面の初期値取得など、購読が不要な場面用） */
export async function fetchGoal(uid: string, goalId: string): Promise<Goal | null> {
  const snapshot = await getDoc(goalDoc(uid, goalId));
  return snapshot.exists() ? toGoal(snapshot.id, snapshot.data()) : null;
}

/**
 * 目標を新規作成する。
 * createdAt / updatedAt には serverTimestamp() を渡す。これは
 * 「サーバー側の時刻を入れてください」という指示のプレースホルダで、
 * 端末ごとの時計のズレの影響を受けない。
 */
export async function createGoal(
  uid: string,
  input: { title: string; description: string },
): Promise<string> {
  const docRef = await addDoc(goalsCollection(uid), {
    title: input.title,
    description: input.description,
    status: "in_progress" satisfies GoalStatus,
    category: "blog", // Phase 1 では UI から変更しない既定値（設計書 6.1）
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    completedAt: null,
  });
  return docRef.id;
}

/** 目標のタイトル・説明を更新する */
export async function updateGoal(
  uid: string,
  goalId: string,
  input: { title: string; description: string },
): Promise<void> {
  await updateDoc(goalDoc(uid, goalId), {
    title: input.title,
    description: input.description,
    updatedAt: serverTimestamp(),
  });
}

/**
 * ステータスを切り替える（対応中 ⇄ 完了）。
 * 完了にしたときだけ completedAt を記録し、巻き戻したら null に戻す。
 */
export async function updateGoalStatus(
  uid: string,
  goalId: string,
  status: GoalStatus,
): Promise<void> {
  await updateDoc(goalDoc(uid, goalId), {
    status,
    completedAt: status === "completed" ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  });
}

/**
 * 目標を削除する。
 *
 * 注意: Firestore ではドキュメントを消してもサブコレクション（logs）は
 * 自動削除されない（親を消しても子は孤児として残る）。そのため、
 * ぶら下がっているログをまとめて消してから目標本体を削除している。
 *
 * writeBatch は複数の書き込みを1回の原子的な操作としてまとめる API。
 * 1バッチあたり500操作の上限があるが、個人利用の規模では十分なため
 * ここでは分割処理は行っていない。
 */
export async function deleteGoal(uid: string, goalId: string): Promise<void> {
  const logsSnapshot = await getDocs(collection(db, "users", uid, "goals", goalId, "logs"));

  const batch = writeBatch(db);
  logsSnapshot.docs.forEach((logDoc) => batch.delete(logDoc.ref));
  batch.delete(goalDoc(uid, goalId));
  await batch.commit();
}
