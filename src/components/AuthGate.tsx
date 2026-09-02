"use client";

/**
 * 認証ゲート
 * -------------------------------------------------------------
 * 「認証判定中はローディング」「未ログインならログイン画面」
 * 「ログイン済みなら本来の画面」という出し分けをここに1か所だけ書き、
 * 各ページはログイン済み前提のコードに集中できるようにする。
 */

import { useState, type ReactNode } from "react";
import { useAuth } from "./AuthProvider";

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();

  // 認証状態の初期判定中。ここで一瞬ログイン画面がちらつくのを防ぐ。
  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-ink-400">読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}

/** 未ログイン時に表示するログイン画面 */
function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSignIn() {
    setErrorMessage(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      const code = (error as { code?: string }).code;

      // ポップアップを閉じただけのケースはエラー扱いにせず、静かに戻す
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        return;
      }

      // 原因ごとに文面を出し分ける。
      // 以前はすべて「時間をおいて再度お試しください」に丸めていたため、
      // 設定漏れ（時間をおいても直らない類）が起きても気づけなかった。
      setErrorMessage(messageForAuthErrorCode(code));

      // 画面には出し切れない詳細を追えるよう、コンソールには原文を残す
      console.error("Google ログインに失敗しました", error);
    } finally {
      setSubmitting(false);
    }
  }

  return renderLoginScreen({ handleSignIn, submitting, errorMessage });
}

/**
 * Firebase Authentication のエラーコードを、利用者向けの日本語文へ変換する。
 * 分からないコードは末尾に付けて出す（問い合わせ時の手がかりになる）。
 */
function messageForAuthErrorCode(code: string | undefined): string {
  switch (code) {
    case "auth/unauthorized-domain":
      // Firebase コンソール > Authentication > Settings > 承認済みドメイン に
      // アクセス元のドメイン（Cloud Run の *.run.app など）を追加すると解消する。
      return "このドメインからのログインが Firebase 側で許可されていません。承認済みドメインの設定を確認してください。";
    case "auth/popup-blocked":
      return "ブラウザにログイン用のポップアップがブロックされました。ポップアップを許可して再度お試しください。";
    case "auth/network-request-failed":
      return "ネットワークに接続できませんでした。通信環境を確認して再度お試しください。";
    case "auth/operation-not-allowed":
      // Firebase コンソール > Authentication > Sign-in method で Google を有効化する
      return "Google ログインが有効化されていません。Firebase の認証設定を確認してください。";
    case "auth/invalid-api-key":
    case "auth/api-key-not-valid":
      return "Firebase の API キーが正しくありません。環境変数の設定を確認してください。";
    default:
      return `ログインに失敗しました。時間をおいて再度お試しください。${code ? `(${code})` : ""}`;
  }
}

/** ログイン画面の見た目。処理と表示を分けて、上の関数を読みやすくしている。 */
function renderLoginScreen({
  handleSignIn,
  submitting,
  errorMessage,
}: {
  handleSignIn: () => void;
  submitting: boolean;
  errorMessage: string | null;
}) {

  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-100 text-2xl">
          🌱
        </div>
        <h1 className="text-xl font-bold text-ink-900">目標きろく</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          目標に向けて今日やったことを、
          <br />
          ひとことだけ残していくアプリです。
        </p>

        <button
          type="button"
          onClick={handleSignIn}
          disabled={submitting}
          className="mt-7 w-full rounded-xl bg-mint-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-mint-600 active:bg-mint-600 disabled:opacity-60"
        >
          {submitting ? "ログイン中..." : "Google でログイン"}
        </button>

        {errorMessage && <p className="mt-4 text-sm text-red-600">{errorMessage}</p>}
      </div>
    </div>
  );
}
