/**
 * Web App Manifest（/manifest.webmanifest として配信される）
 * -------------------------------------------------------------
 * Android の Chrome で「ホーム画面に追加」したときに、ここで指定した
 * アイコン・名前・テーマ色が使われる。iOS は manifest のアイコンを見ず、
 * src/app/apple-icon.png（apple-touch-icon）のほうを使う。
 *
 * display について
 * -------------------------------------------------------------
 * "standalone" にするとブラウザUIのない全画面アプリとして起動するが、
 * 現在のログインは signInWithPopup（別ウィンドウを開く方式）で実装しており、
 * 全画面モードではポップアップが開けず認証に失敗することがある。
 * そのため今は "browser"（＝今までどおりブラウザとして開く）にしている。
 * 全画面化したくなったら、先に signInWithRedirect へ切り替えること。
 */
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "目標きろく",
    short_name: "目標きろく",
    description: "目標に向けた日々の作業を、ひとことずつ記録するアプリ",
    start_url: "/",
    display: "browser",
    background_color: "#f7fbf8",
    theme_color: "#e3f6ea",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // maskable: Android が円形などに切り抜いて表示する用途。
      // 図案を中央 80% の円内に収めてあるので同じ画像を使い回せる。
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
