/**
 * ルートレイアウト（App Router）
 * -------------------------------------------------------------
 * app/layout.tsx は全ページを包む唯一の必須ファイル。
 * "use client" を書いていないのでこれは Server Component であり、
 * metadata の定義など、サーバー側で完結する処理をここに置ける。
 *
 * 一方 Firebase の認証状態はブラウザ側でしか扱えないため、
 * クライアントコンポーネントである <AuthProvider> を children の外側に
 * 差し込む構成にしている（Server Component が Client Component を
 * 子として描画する、App Router の標準的な組み合わせ方）。
 */

import type { Metadata, Viewport } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { AuthGate } from "@/components/AuthGate";

/**
 * next/font はビルド時にフォントを取得してセルフホストする仕組み。
 * 外部CDNへのリクエストが発生せず、表示時のレイアウトずれも抑えられる。
 * 丸ゴシックを選び、パステル緑テーマの柔らかい印象に合わせている。
 *
 * preload: false について
 * -------------------------------------------------------------
 * M PLUS Rounded 1c は日本語フォントで、グリフ数が多いため
 * unicode-range ごとに約120個のファイルへ分割配信される。
 * ウェイト3種と掛け合わせると1フォントで 300〜400 ファイルになる。
 *
 * next/font の既定（preload: true）では、それら全部に対して
 * <link rel="preload"> がHTMLへ出力される。結果、ページを1回開くだけで
 * 240件もの woff2 GET が飛び、Cloud Run のログが埋まっていた。
 *
 * preload を切ると先読みlinkが出なくなり、ブラウザは
 * 「実際に画面へ描画した文字が含まれる unicode-range」のファイルだけを
 * 遅延取得する。表示中の日本語は数十文字なので、取得は十数件で収まる。
 * 引き換えにフォント適用が僅かに遅れるが、display: "swap" により
 * その間はフォールバックのゴシックで文字が読める状態を保てる。
 */
const appFont = M_PLUS_Rounded_1c({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
  // globals.css の --font-app-sans から参照するための CSS 変数名
  variable: "--font-app-sans",
});

/**
 * アイコンについて
 * -------------------------------------------------------------
 * App Router では app/ 直下に置いたファイル名がそのまま意味を持つ。
 *   app/icon.png       … <link rel="icon">（ブラウザのタブ）
 *   app/apple-icon.png … <link rel="apple-touch-icon">（iOSの「ホーム画面に追加」）
 *   app/manifest.ts    … <link rel="manifest">（Androidの「ホーム画面に追加」）
 * どれも Next.js が自動で <head> に差し込むため、ここでの指定は不要。
 * 画像の実体は assets/app-icon.svg から scripts/generate-icons.mjs で生成している。
 */
export const metadata: Metadata = {
  title: "目標きろく",
  description: "目標に向けた日々の作業を、ひとことずつ記録するアプリ",
  // iOS でホーム画面に追加したとき、アイコンの下に表示される名前。
  // 指定しないとページの <title> が使われ、長いと途中で省略される。
  appleWebApp: {
    title: "目標きろく",
  },
};

/**
 * viewport は metadata とは別枠でエクスポートする（Next.js 14 以降の仕様）。
 * themeColor はスマホのブラウザUI（アドレスバー等）の色に反映される。
 */
export const viewport: Viewport = {
  themeColor: "#e3f6ea",
  // ユーザーによる拡大は妨げない（アクセシビリティ上、禁止しないほうがよい）
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={appFont.variable}>
      <body className="font-sans antialiased">
        <AuthProvider>
          {/* ログイン済みのときだけ children（各ページ）を描画する */}
          <AuthGate>{children}</AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
