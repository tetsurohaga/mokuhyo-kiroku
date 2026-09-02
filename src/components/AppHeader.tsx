"use client";

/**
 * 画面上部の共通ヘッダー
 * -------------------------------------------------------------
 * 左に戻るリンク（または アプリ名）、右にログアウトを置いただけの簡素な構成。
 * sticky で上部に固定し、スマホでスクロールしても操作が届く位置に保つ。
 */

import Link from "next/link";
import { useAuth } from "./AuthProvider";

type Props = {
  title: string;
  /** 指定するとタイトル左に戻るリンクを表示する */
  backHref?: string;
};

export function AppHeader({ title, backHref }: Props) {
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-mint-50/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-4">
        {backHref && (
          // next/link はクライアント側でのページ遷移（プリフェッチ付き）を行う
          <Link
            href={backHref}
            aria-label="戻る"
            className="-ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-mint-700 hover:bg-mint-100"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              ←
            </span>
          </Link>
        )}

        <h1 className="min-w-0 flex-1 truncate font-bold text-ink-900">{title}</h1>

        <button
          type="button"
          onClick={() => void signOut()}
          className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-mint-100"
        >
          ログアウト
        </button>
      </div>
    </header>
  );
}
