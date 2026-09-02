"use client";

/**
 * ログ一覧の1行分（表示 / インライン編集 / 削除）
 * -------------------------------------------------------------
 * 編集専用の画面へ遷移させると操作数が増えるため、その場で
 * 表示モードと編集モードを切り替える形にしている。
 */

import { useState } from "react";
import { formatDateLabel } from "@/lib/date";
import type { Log } from "@/lib/types";

type Props = {
  log: Log;
  onUpdate: (values: { content: string; date: string }) => Promise<void>;
  onDelete: () => Promise<void>;
};

export function LogItem({ log, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(log.content);
  const [date, setDate] = useState(log.date);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    setBusy(true);
    try {
      await onUpdate({ content: trimmedContent, date });
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  function handleCancel() {
    // 編集を破棄して、元のログの値に戻す
    setContent(log.content);
    setDate(log.date);
    setEditing(false);
  }

  async function handleDelete() {
    // 個人利用の小さなアプリなので、確認は標準の confirm で簡潔に済ませる
    if (!window.confirm("この記録を削除しますか？")) return;

    setBusy(true);
    try {
      await onDelete();
    } finally {
      setBusy(false);
    }
  }

  // ---- 編集モード ----
  if (editing) {
    return (
      <div className="rounded-2xl border border-mint-300 bg-white p-3">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={3}
          maxLength={2000}
          className="w-full resize-y rounded-xl bg-mint-50 px-3 py-2.5 outline-none focus:ring-2 focus:ring-mint-200"
        />
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          aria-label="記録の日付"
          className="mt-2 w-full rounded-xl border border-line px-3 py-2 text-sm text-ink-600 outline-none focus:border-mint-400"
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={busy || !content.trim()}
            className="flex-1 rounded-xl bg-mint-500 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            保存
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={busy}
            className="flex-1 rounded-xl border border-line py-2 text-sm font-medium text-ink-600"
          >
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  // ---- 表示モード ----
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-xs font-medium text-mint-700">{formatDateLabel(log.date)}</p>

      {/* whitespace-pre-wrap で、入力時の改行をそのまま表示する */}
      <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-900">
        {log.content}
      </p>

      <div className="mt-2.5 flex gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs font-medium text-ink-400 hover:text-mint-700"
        >
          編集
        </button>
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={busy}
          className="text-xs font-medium text-ink-400 hover:text-red-600"
        >
          削除
        </button>
      </div>
    </div>
  );
}
