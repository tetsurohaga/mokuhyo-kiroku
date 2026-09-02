/**
 * 日次ログ（Log）の Firestore アクセス処理
 * -------------------------------------------------------------
 * ログは目標のサブコレクション `users/{uid}/goals/{goalId}/logs` に保存する
 * （設計書 6.1）。目標単位でまとめて取得・削除しやすいのが利点。
 */
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Log } from "./types";

/** ある目標にぶら下がる logs コレクションへの参照 */
function logsCollection(uid: string, goalId: string) {
  return collection(db, "users", uid, "goals", goalId, "logs");
}

/** 単一のログドキュメントへの参照 */
function logDoc(uid: string, goalId: string, logId: string) {
  return doc(db, "users", uid, "goals", goalId, "logs", logId);
}

/** スナップショットを Log 型に変換する */
function toLog(id: string, data: Record<string, unknown>): Log {
  return {
    id,
    content: (data.content as string) ?? "",
    date: (data.date as string) ?? "",
    createdAt: (data.createdAt as Log["createdAt"]) ?? null,
    updatedAt: (data.updatedAt as Log["updatedAt"]) ?? null,
  };
}

/**
 * ある目標のログ一覧をリアルタイム購読する（日付の新しい順）。
 *
 * Firestore の orderBy を2つ以上重ねる（date, createdAt）と複合インデックスの
 * 作成が必要になるため、クエリでは date のみで並べ、同じ日付内の並び順は
 * 取得後にメモリ上で createdAt を見て整えている。
 * 1日に複数件のログを許可する仕様（設計書 9-5）なので、この2段階目が要る。
 */
export function subscribeLogs(
  uid: string,
  goalId: string,
  onData: (logs: Log[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const q = query(logsCollection(uid, goalId), orderBy("date", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const logs = snapshot.docs.map((d) => toLog(d.id, d.data()));

      // 同じ日付のログは、作成が新しいものを上に表示する
      logs.sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        // serverTimestamp() はサーバー確定前だと null になりうるので 0 で代替する
        const aTime = a.createdAt?.toMillis() ?? 0;
        const bTime = b.createdAt?.toMillis() ?? 0;
        return bTime - aTime;
      });

      onData(logs);
    },
    onError,
  );
}

/** ログを新規作成する */
export async function createLog(
  uid: string,
  goalId: string,
  input: { content: string; date: string },
): Promise<void> {
  await addDoc(logsCollection(uid, goalId), {
    content: input.content,
    date: input.date,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/** ログの本文・日付を更新する */
export async function updateLog(
  uid: string,
  goalId: string,
  logId: string,
  input: { content: string; date: string },
): Promise<void> {
  await updateDoc(logDoc(uid, goalId, logId), {
    content: input.content,
    date: input.date,
    updatedAt: serverTimestamp(),
  });
}

/** ログを削除する */
export async function deleteLog(uid: string, goalId: string, logId: string): Promise<void> {
  await deleteDoc(logDoc(uid, goalId, logId));
}
