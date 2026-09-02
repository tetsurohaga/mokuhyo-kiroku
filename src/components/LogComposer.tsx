"use client";

/**
 * ログ入力欄（設計書 3.3-2）
 * -------------------------------------------------------------
 * 「隙間時間にサッと1〜2行書く」のが主用途なので、目標詳細画面を開いたら
 * すぐ目に入る位置に置き、日付は今日を既定値として入れておく。
 * 過去分を後から書きたいときのために日付は変更できるようにしている。
 */

import { useState, type FormEvent } from "react";
import { todayString } from "@/lib/date";

type Props = {
  /** 保存処理。呼び出し側（詳細画面）で Firestore へ書き込む */
  onSubmit: (values: { content: string; date: string }) => Promise<void>;
};

export function LogComposer({ onSubmit }: Props) {
  const [content, setContent] = useState("");
  // 既定値は今日。todayString() は端末のローカル日付を "YYYY-MM-DD" で返す。
  const [date, setDate] = useState(todayString());
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedContent = content.trim();
    if (!trimmedContent) return; // 空のログは登録しない（エラー表示までは出さない）

    setErrorMessage(null);
    setSubmitting(true);
    try {
      await onSubmit({ content: trimmedContent, date });
      // 保存できたら本文だけ空にする。日付は連続入力しやすいよう保持する。
      setContent("");
    } catch {
      setErrorMessage("記録に失敗しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-mint-200 bg-white p-3 shadow-sm"
    >
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="今日やったことを1〜2行で"
        rows={2}
        maxLength={2000}
        className="w-full resize-y rounded-xl bg-mint-50 px-3 py-2.5 outline-none placeholder:text-ink-400 focus:ring-2 focus:ring-mint-200"
      />

      <div className="mt-2 flex items-center gap-2">
        {/* input[type=date] はスマホでOS標準の日付ピッカーが開く */}
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          aria-label="記録する日付"
          className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink-600 outline-none focus:border-mint-400"
        />

        <button
          type="submit"
          // 本文が空、または送信中は押せないようにする
          disabled={submitting || !content.trim()}
          className="shrink-0 rounded-xl bg-mint-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-mint-600 active:bg-mint-600 disabled:opacity-40"
        >
          {submitting ? "記録中..." : "記録する"}
        </button>
      </div>

      {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
    </form>
  );
}
