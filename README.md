# 目標きろく

一つのやや大きな目標に対して、日々やったことを短時間・自由形式で記録していく個人用アプリ。
現在は要件定義・設計書 v0.3 の **Phase 1: MVP** まで実装済み。

## できること

- Google アカウントでログイン（未ログイン時はログイン画面のみ）
- 目標の作成・編集・削除、ステータス切替（対応中 ⇄ 完了）
- 目標ごとに日付＋自由記述のログを記録（1日に複数件可、その場で編集・削除）
- モバイルファースト。PC では中央寄せの読みやすい幅で表示

PWA 化やカレンダービューなど Phase 2 以降の機能は未実装。

## 技術スタック

| 区分 | 採用技術 |
|---|---|
| フロントエンド | Next.js 16 (App Router) + React 19 + TypeScript |
| スタイル | Tailwind CSS v4 |
| データベース | Cloud Firestore — ブラウザから直接読み書き |
| 認証 | Firebase Authentication（Google ログインのみ） |
| 実行環境 | Cloud Run（ゼロスケール）。`main` への push で自動デプロイ |

## ローカルで動かす

```bash
cp .env.local.example .env.local   # Firebase の設定値を貼り付ける
npm install
npm run dev                        # http://localhost:3000
```

Firebase プロジェクトをまだ用意していない場合は、先に [docs/setup.md](docs/setup.md) を参照。

## よく使うコマンド

```bash
npm run dev      # 開発サーバー
npm run build    # 本番ビルド（.env.local が必要）
npm run lint     # ESLint
npx tsc --noEmit # 型チェック
```

## 押さえておきたいこと

- **`.env.local` に秘密情報を置かない。** `NEXT_PUBLIC_*` はビルド時にブラウザのバンドルへ埋め込まれる公開値で、
  このファイルはコンテナビルドにもそのまま使われる。データの保護は Firestore Security Rules が担う。
- **データの置き場所は `users/{uid}/goals/{goalId}/logs/{logId}`。** 本人の uid 配下しか読み書きできない。
- **Cloud Run の URL が変わったら**、Firebase の承認済みドメインへの追加が必要（忘れると Google ログインが失敗する）。

## ドキュメント

詳細は `docs/` 配下にまとめている。

| ドキュメント | 内容 |
|---|---|
| [setup.md](docs/setup.md) | Firebase プロジェクト作成、環境変数、Security Rules の反映 |
| [deployment.md](docs/deployment.md) | Cloud Run への手動デプロイ、環境変数の埋め込みの仕組み、GitHub Actions の設定 |
| [architecture.md](docs/architecture.md) | 全体構成、ディレクトリ構成、データモデル、設計上の割り切り |
| [icons.md](docs/icons.md) | アプリアイコンの変更手順 |
