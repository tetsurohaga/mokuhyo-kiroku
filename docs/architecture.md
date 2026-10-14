# アーキテクチャと設計メモ

## 全体構成

- ブラウザ上の Next.js アプリが Firebase SDK で **Firestore を直接読み書き**する（独自の API サーバーは持たない）
- 認証は Firebase Authentication（Google ログインのみ）
- データの保護は Firestore Security Rules（`firestore.rules`）が担う
- Cloud Run はアプリ（Next.js）の配信だけを担当し、ゼロスケールで動く

## ディレクトリ構成

```
src/
  app/                          … App Router のページ（ディレクトリ構造がそのまま URL）
    layout.tsx                  … 全ページ共通のレイアウト。認証 Provider をここで差し込む
    page.tsx                    … "/"                     ホーム（目標一覧）
    goals/new/page.tsx          … "/goals/new"             目標の新規作成
    goals/[goalId]/page.tsx     … "/goals/{id}"            目標詳細（ログの入力・一覧）
    goals/[goalId]/edit/page.tsx… "/goals/{id}/edit"       目標の編集
    globals.css                 … Tailwind の読み込みとカラーテーマ定義
    icon.png                    … ブラウザのタブに出るアイコン（favicon）
    apple-icon.png              … iOS で「ホーム画面に追加」したときのアイコン（180x180）
    manifest.ts                 … Web App Manifest。Android の「ホーム画面に追加」用
  components/                   … 画面をまたいで使う UI 部品
    AuthProvider.tsx            … 認証状態を React Context で配布
    AuthGate.tsx                … 未ログインならログイン画面を出す出し分け
    AppHeader.tsx               … 上部の共通ヘッダー
    GoalForm.tsx                … 目標の作成／編集で共用するフォーム
    LogComposer.tsx             … ログの入力欄
    LogItem.tsx                 … ログ一覧の1行（表示／インライン編集／削除）
  lib/                          … Firestore アクセスと小さなユーティリティ
    firebase.ts                 … Firebase SDK の初期化
    types.ts                    … Goal / Log の型定義
    goals.ts                    … 目標の CRUD
    logs.ts                     … ログの CRUD
    date.ts                     … 日付文字列の生成・整形

public/icons/                   … manifest から参照する Android 向けアイコン
assets/app-icon.svg             … アイコンのマスターデザイン（この1枚から全サイズを生成）
scripts/generate-icons.mjs      … 上記 SVG から各サイズの PNG を書き出すスクリプト
firestore.rules                 … Firestore Security Rules
Dockerfile                      … Cloud Run 用のコンテナ定義
.github/workflows/deploy.yml    … main への push で Cloud Run へ自動デプロイ
```

## データモデル（Firestore）

```
users/{uid}/goals/{goalId}
  title       : string
  description : string
  status      : "in_progress" | "completed"
  category    : string          … 将来のジャンル分け用。Phase 1 では "blog" 固定
  createdAt   : timestamp
  updatedAt   : timestamp
  completedAt : timestamp | null

users/{uid}/goals/{goalId}/logs/{logId}
  content     : string
  date        : string          … "YYYY-MM-DD"
  createdAt   : timestamp
  updatedAt   : timestamp
```

## 意図的にシンプルにしている箇所

コード内にもコメントあり。

- ステータスでの絞り込みは Firestore の `where` ではなく取得後にメモリ上で行っている。
  `where` + `orderBy` は複合インデックスが必要になるが、個人利用の規模では割に合わないため。
- ログの並び替えも `orderBy("date")` のみとし、同一日付内の順序は取得後に `createdAt` で整えている。
- 目標を削除するときは、サブコレクションの `logs` を先にまとめて削除している。
  Firestore は親ドキュメントを消しても子コレクションを自動削除しないため。
