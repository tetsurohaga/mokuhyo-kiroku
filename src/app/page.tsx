"use client";

/**
 * ホーム画面（目標一覧）— 設計書 3.3-1
 * -------------------------------------------------------------
 * ・対応中の目標をカード形式で表示
 * ・タブで「完了」済みの目標に切り替え
 * ・右下の FAB から新規作成へ
 *
 * データはブラウザから直接 Firestore を購読して取得している（設計書 9-2）。
 * そのためこのページ全体をクライアントコンポーネントにしている。
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/components/AuthProvider";
import { subscribeGoals } from "@/lib/goals";
import { formatTimestampShort } from "@/lib/date";
import type { Goal, GoalStatus } from "@/lib/types";

export default function HomePage() {
  // AuthGate を通過した後なので user は必ず存在するが、型上は null 許容のまま扱う
  const { user } = useAuth();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  /** 表示中のタブ。対応中を既定にする（設計書 3.1: 対応中を優先表示） */
  const [tab, setTab] = useState<GoalStatus>("in_progress");

  useEffect(() => {
    if (!user) return;

    // Firestore の変更を購読開始。返ってきた解除関数をクリーンアップで呼ぶことで、
    // 画面を離れたあとも通信し続ける（リスナーが残る）のを防ぐ。
    const unsubscribe = subscribeGoals(
      user.uid,
      (nextGoals) => {
        setGoals(nextGoals);
        setLoading(false);
      },
      () => {
        setErrorMessage("目標の読み込みに失敗しました。");
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user]);

  // ステータスでの絞り込みは取得後にメモリ上で行う（goals.ts のコメント参照）
  const inProgressGoals = goals.filter((goal) => goal.status === "in_progress");
  const completedGoals = goals.filter((goal) => goal.status === "completed");
  const visibleGoals = tab === "in_progress" ? inProgressGoals : completedGoals;

  return (
    <div className="min-h-dvh">
      <AppHeader title="目標きろく" />

      {/* max-w-2xl + mx-auto で、スマホでは全幅・PCでは中央寄せの読みやすい幅にする */}
      <main className="mx-auto max-w-2xl px-4 pt-4 pb-28">
        {/* ---- タブ切り替え ---- */}
        <div className="flex gap-1 rounded-xl bg-mint-100 p-1">
          <TabButton
            label={`対応中 (${inProgressGoals.length})`}
            active={tab === "in_progress"}
            onClick={() => setTab("in_progress")}
          />
          <TabButton
            label={`完了 (${completedGoals.length})`}
            active={tab === "completed"}
            onClick={() => setTab("completed")}
          />
        </div>

        {/* ---- 一覧本体 ---- */}
        <div className="mt-4">
          {loading && <p className="py-10 text-center text-sm text-ink-400">読み込み中...</p>}

          {errorMessage && (
            <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{errorMessage}</p>
          )}

          {!loading && !errorMessage && visibleGoals.length === 0 && (
            <p className="py-12 text-center text-sm leading-relaxed text-ink-400">
              {tab === "in_progress" ? (
                <>
                  まだ目標がありません。
                  <br />
                  右下の＋ボタンから追加してみましょう。
                </>
              ) : (
                "完了した目標はまだありません。"
              )}
            </p>
          )}

          <ul className="flex flex-col gap-3">
            {visibleGoals.map((goal) => (
              <li key={goal.id}>
                <GoalCard goal={goal} />
              </li>
            ))}
          </ul>
        </div>
      </main>

      {/* ---- FAB（新規目標作成）: 画面右下に固定 ---- */}
      <Link
        href="/goals/new"
        aria-label="新しい目標を作成"
        className="fixed right-5 bottom-6 flex h-14 w-14 items-center justify-center rounded-full bg-mint-500 text-3xl leading-none text-white shadow-lg transition-colors hover:bg-mint-600 active:bg-mint-600"
        style={{ bottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <span aria-hidden="true" className="-mt-1">
          +
        </span>
      </Link>
    </div>
  );
}

/** タブ1つ分のボタン */
function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
        active ? "bg-white text-mint-700 shadow-sm" : "text-ink-600"
      }`}
    >
      {label}
    </button>
  );
}

/** 目標1件分のカード。タップで詳細画面へ遷移する。 */
function GoalCard({ goal }: { goal: Goal }) {
  return (
    <Link
      href={`/goals/${goal.id}`}
      className="block rounded-2xl border border-line bg-white p-4 transition-colors hover:border-mint-300 active:border-mint-300"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-ink-900">{goal.title}</h2>

          {goal.description && (
            // line-clamp-2 で説明文は2行までに省略する
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-600">
              {goal.description}
            </p>
          )}

          <p className="mt-2 text-xs text-ink-400">
            最終更新: {formatTimestampShort(goal.updatedAt) || "—"}
          </p>
        </div>

        {goal.status === "completed" && (
          <span className="shrink-0 rounded-full bg-mint-100 px-2.5 py-1 text-xs font-medium text-mint-700">
            完了
          </span>
        )}
      </div>
    </Link>
  );
}
