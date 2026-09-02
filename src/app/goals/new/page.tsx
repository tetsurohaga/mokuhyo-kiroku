"use client";

/**
 * 目標の新規作成画面（設計書 3.3-3）
 * -------------------------------------------------------------
 * App Router では app 配下のディレクトリ構造がそのまま URL になる。
 * このファイルは app/goals/new/page.tsx なので `/goals/new` に対応する。
 */

import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { GoalForm } from "@/components/GoalForm";
import { useAuth } from "@/components/AuthProvider";
import { createGoal } from "@/lib/goals";

export default function NewGoalPage() {
  const { user } = useAuth();
  // useRouter はクライアント側でのページ遷移に使うフック（next/navigation 版）
  const router = useRouter();

  async function handleSubmit(values: { title: string; description: string }) {
    if (!user) return;

    const goalId = await createGoal(user.uid, values);
    // 作成後はそのまま詳細画面へ。すぐログを書き始められる導線にする。
    // replace を使うと履歴が置き換わり、戻るボタンで作成画面に戻らない。
    router.replace(`/goals/${goalId}`);
  }

  return (
    <div className="min-h-dvh">
      <AppHeader title="新しい目標" backHref="/" />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <GoalForm submitLabel="作成する" onSubmit={handleSubmit} />
      </main>
    </div>
  );
}
