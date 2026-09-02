"use client";

/**
 * 目標の作成／編集フォーム（設計書 3.3-3）
 * -------------------------------------------------------------
 * 新規作成画面と編集画面はどちらも「タイトル（必須）＋説明（任意）」の
 * 同じ入力項目なので、フォーム部分だけをこのコンポーネントに切り出し、
 * 保存時の処理（onSubmit）を呼び出し側から渡す形にしている。
 */

import { useState, type FormEvent } from "react";

type Props = {
  initialTitle?: string;
  initialDescription?: string;
  submitLabel: string;
  /** 保存処理。呼び出し側で Firestore への書き込みと画面遷移を行う */
  onSubmit: (values: { title: string; description: string }) => Promise<void>;
};

export function GoalForm({
  initialTitle = "",
  initialDescription = "",
  submitLabel,
  onSubmit,
}: Props) {
  // React の「制御コンポーネント」パターン。入力値を state で持ち、value に流し込む。
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // form の既定動作（ページ全体のリロード）を止め、JS側で処理する
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage("タイトルを入力してください。");
      return;
    }

    setErrorMessage(null);
    setSubmitting(true);
    try {
      await onSubmit({ title: trimmedTitle, description: description.trim() });
    } catch {
      setErrorMessage("保存に失敗しました。通信状況を確認して再度お試しください。");
      // 失敗時は入力内容を残したまま再操作できるよう、ここでボタンを戻す。
      // （成功時は画面遷移するので submitting を戻す必要はない）
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="goal-title" className="mb-1.5 block text-sm font-medium text-ink-600">
          タイトル<span className="ml-1 text-mint-600">*</span>
        </label>
        <input
          id="goal-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="例: 月1本ブログ記事を書く"
          // autoFocus は新規作成時にすぐ入力を始められるようにするため
          autoFocus
          maxLength={100}
          className="w-full rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-200"
        />
      </div>

      <div>
        <label htmlFor="goal-description" className="mb-1.5 block text-sm font-medium text-ink-600">
          説明（任意）
        </label>
        <textarea
          id="goal-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="達成条件やメモなど"
          rows={4}
          maxLength={1000}
          className="w-full resize-y rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-200"
        />
      </div>

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-mint-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-mint-600 active:bg-mint-600 disabled:opacity-60"
      >
        {submitting ? "保存中..." : submitLabel}
      </button>
    </form>
  );
}
