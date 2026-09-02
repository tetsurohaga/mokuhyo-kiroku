"use client";

/**
 * 認証状態を全画面で共有するための Provider
 * -------------------------------------------------------------
 * Firebase Authentication のログイン状態は非同期に確定するため、
 * 「まだ判定中」「未ログイン」「ログイン済み」の3状態を React Context に載せて
 * 配下のコンポーネントから使えるようにしている。
 *
 * ファイル冒頭の "use client" は Next.js App Router のディレクティブ。
 * これがあるモジュールはクライアント（ブラウザ）側で実行され、
 * useState / useEffect などのフックや、ブラウザ限定の Firebase SDK を扱える。
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

type AuthContextValue = {
  /** ログイン中のユーザー。未ログインなら null */
  user: User | null;
  /** 認証状態の初期判定が終わったかどうか（false の間はローディング表示） */
  ready: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    /**
     * onAuthStateChanged はログイン状態の変化を監視する購読API。
     * ページを開いた直後に「前回のログインが保持されているか」を判定して
     * 一度呼ばれ、その後もログイン／ログアウトのたびに呼ばれる。
     * 戻り値は購読解除関数なので、アンマウント時に呼んで後片付けする。
     */
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setReady(true);
    });

    return unsubscribe;
  }, []);

  /**
   * Google アカウントでログインする（設計書 9-1: Google認証のみ）。
   * signInWithPopup はポップアップウィンドウで Google の同意画面を開く方式。
   * 成功すると上の onAuthStateChanged が発火して user が更新される。
   */
  async function signInWithGoogle() {
    await signInWithPopup(auth, googleProvider);
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, ready, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 認証状態を取り出すためのフック。
 * Provider の外側で呼ばれた場合は設定漏れなので、その場で気づけるよう例外にする。
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth は <AuthProvider> の内側で使用してください");
  }
  return context;
}
