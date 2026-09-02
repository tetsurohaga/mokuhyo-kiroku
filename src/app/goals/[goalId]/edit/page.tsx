"use client";

/**
 * 目標の編集画面（設計書 3.3-3）
 * -------------------------------------------------------------
 * URL は `/goals/{goalId}/edit`。角括弧付きのディレクトリ名 [goalId] は
 * App Router の「動的セグメント」で、URL の一部を値として受け取れる。
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { GoalForm } from "@/components/GoalForm";
import { useAuth } from "@/components/AuthProvider";
import { fetchGoal, updateGoal } from "@/lib/goals";
import type { Goal } from "@/lib/types";

export default function EditGoalPage() {
  const { user } = useAuth();
  const router = useRouter();
  // useParams で動的セグメント [goalId] の値を取り出す
  const { goalId } = useParams<{ goalId: string }>();

  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // 編集画面は初期値さえ取れればよいので、購読ではなく1回だけ取得する
    fetchGoal(user.uid, goalId)
      .then((fetched) => setGoal(fetched))
      .finally(() => setLoading(false));
  }, [user, goalId]);

  async function handleSubmit(values: { title: string; description: string }) {
    if (!user) return;

    await updateGoal(user.uid, goalId, values);
    router.replace(`/goals/${goalId}`);
  }

  return (
    <div className="min-h-dvh">
      <AppHeader title="目標を編集" backHref={`/goals/${goalId}`} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        {loading && <p className="py-10 text-center text-sm text-ink-400">読み込み中...</p>}

        {!loading && !goal && (
          <p className="py-10 text-center text-sm text-ink-400">目標が見つかりませんでした。</p>
        )}

        {goal && (
          <GoalForm
            initialTitle={goal.title}
            initialDescription={goal.description}
            submitLabel="保存する"
            onSubmit={handleSubmit}
          />
        )}
      </main>
    </div>
  );
}
