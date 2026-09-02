"use client";

/**
 * 目標詳細画面（設計書 3.3-2）
 * -------------------------------------------------------------
 * ・目標のタイトル／説明／ステータス表示
 * ・ステータス切り替え（対応中 ⇄ 完了）、編集、削除
 * ・ログの入力欄と、日付降順のログ一覧
 *
 * 目標本体とログ一覧の2つを Firestore から購読するため、
 * useEffect も2つに分けている（それぞれ独立に解除できる形）。
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/components/AuthProvider";
import { LogComposer } from "@/components/LogComposer";
import { LogItem } from "@/components/LogItem";
import { subscribeGoal, updateGoalStatus, deleteGoal } from "@/lib/goals";
import { subscribeLogs, createLog, updateLog, deleteLog } from "@/lib/logs";
import type { Goal, Log } from "@/lib/types";

export default function GoalDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { goalId } = useParams<{ goalId: string }>();

  const [goal, setGoal] = useState<Goal | null>(null);
  const [goalLoading, setGoalLoading] = useState(true);
  const [logs, setLogs] = useState<Log[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ---- 目標本体の購読 ----
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeGoal(
      user.uid,
      goalId,
      (nextGoal) => {
        setGoal(nextGoal);
        setGoalLoading(false);
      },
      () => {
        setErrorMessage("目標の読み込みに失敗しました。");
        setGoalLoading(false);
      },
    );

    return unsubscribe;
  }, [user, goalId]);

  // ---- ログ一覧の購読 ----
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeLogs(
      user.uid,
      goalId,
      (nextLogs) => {
        setLogs(nextLogs);
        setLogsLoading(false);
      },
      () => {
        setErrorMessage("記録の読み込みに失敗しました。");
        setLogsLoading(false);
      },
    );

    return unsubscribe;
  }, [user, goalId]);

  /** 対応中 ⇄ 完了 を切り替える（設計書 3.1: 巻き戻しも可） */
  async function handleToggleStatus() {
    if (!user || !goal) return;

    const nextStatus = goal.status === "completed" ? "in_progress" : "completed";
    await updateGoalStatus(user.uid, goalId, nextStatus);
    // 画面の表示は onSnapshot 経由で自動更新されるので、ここでは何もしない
  }

  /** 目標を削除する。ぶら下がるログもまとめて消える（goals.ts 参照） */
  async function handleDeleteGoal() {
    if (!user) return;
    if (!window.confirm("この目標と、記録したログをすべて削除しますか？")) return;

    await deleteGoal(user.uid, goalId);
    router.replace("/");
  }

  // AuthGate を通過している前提なので実際には起こらないが、
  // 以降のコードで user が null でないことを型として確定させるためのガード。
  if (!user) return null;

  // ---- 読み込み中・見つからない場合の表示 ----
  if (goalLoading) {
    return (
      <div className="min-h-dvh">
        <AppHeader title="読み込み中" backHref="/" />
        <p className="py-16 text-center text-sm text-ink-400">読み込み中...</p>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="min-h-dvh">
        <AppHeader title="目標" backHref="/" />
        <p className="py-16 text-center text-sm text-ink-400">
          {errorMessage ?? "目標が見つかりませんでした。"}
        </p>
      </div>
    );
  }

  const isCompleted = goal.status === "completed";

  return (
    <div className="min-h-dvh">
      <AppHeader title={goal.title} backHref="/" />

      <main className="mx-auto max-w-2xl px-4 pt-4 pb-10">
        {/* ---- 目標の概要と操作 ---- */}
        <section className="rounded-2xl border border-line bg-white p-4">
          <div className="flex items-start gap-3">
            <h2 className="min-w-0 flex-1 text-lg font-bold text-ink-900">{goal.title}</h2>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                isCompleted ? "bg-mint-100 text-mint-700" : "bg-mint-50 text-mint-600"
              }`}
            >
              {isCompleted ? "完了" : "対応中"}
            </span>
          </div>

          {goal.description && (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-600">
              {goal.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleToggleStatus()}
              className="rounded-xl bg-mint-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-mint-600"
            >
              {isCompleted ? "対応中に戻す" : "完了にする"}
            </button>

            <Link
              href={`/goals/${goal.id}/edit`}
              className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink-600 hover:border-mint-300"
            >
              編集
            </Link>

            <button
              type="button"
              onClick={() => void handleDeleteGoal()}
              className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink-400 hover:border-red-200 hover:text-red-600"
            >
              削除
            </button>
          </div>
        </section>

        {/* ---- ログ入力欄。すぐ書けるよう一覧より上に置く ---- */}
        <section className="mt-5">
          <LogComposer
            onSubmit={(values) => createLog(user.uid, goalId, values)}
          />
        </section>

        {/* ---- ログ一覧（日付の新しい順） ---- */}
        <section className="mt-5">
          <h3 className="mb-2 px-1 text-sm font-bold text-ink-600">記録 ({logs.length})</h3>

          {logsLoading && <p className="py-8 text-center text-sm text-ink-400">読み込み中...</p>}

          {!logsLoading && logs.length === 0 && (
            <p className="py-8 text-center text-sm text-ink-400">まだ記録がありません。</p>
          )}

          <ul className="flex flex-col gap-3">
            {logs.map((log) => (
              <li key={log.id}>
                <LogItem
                  log={log}
                  onUpdate={(values) => updateLog(user.uid, goalId, log.id, values)}
                  onDelete={() => deleteLog(user.uid, goalId, log.id)}
                />
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
