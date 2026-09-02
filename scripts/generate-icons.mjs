/**
 * assets/app-icon.svg から各プラットフォーム向けのアイコン PNG を生成する。
 * -------------------------------------------------------------
 * 実行: node scripts/generate-icons.mjs
 *
 * 生成物はリポジトリにコミットしてあるので、通常のビルドやデプロイでは
 * このスクリプトを走らせる必要はない。デザインを変えたときだけ再実行する。
 *
 * sharp は Next.js が画像最適化用に持っている依存をそのまま借りている
 * （package.json の直接の依存には入れていない）。
 */
import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";

const source = readFileSync(new URL("../assets/app-icon.svg", import.meta.url));

const targets = [
  // Next.js の App Router のファイル規約。置くだけで <link rel="icon"> /
  // <link rel="apple-touch-icon"> が自動で出力される。
  // apple-touch-icon は iOS の「ホーム画面に追加」で使われる 180x180。
  ["src/app/icon.png", 512],
  ["src/app/apple-icon.png", 180],
  // Web App Manifest から参照する Android 向け（src/app/manifest.ts）
  ["public/icons/icon-192.png", 192],
  ["public/icons/icon-512.png", 512],
];

mkdirSync("public/icons", { recursive: true });

for (const [path, size] of targets) {
  await sharp(source, { density: 512 })
    .resize(size, size)
    // iOS は透過部分を黒く塗りつぶすため、アルファを残さず不透明にする
    .flatten({ background: "#2e6f4d" })
    .png({ compressionLevel: 9 })
    .toFile(path);
  console.log(`${path} (${size}x${size})`);
}
