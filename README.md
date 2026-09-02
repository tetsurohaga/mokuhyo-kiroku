# 目標きろく

一つのやや大きな目標に対して、日々やったことを短時間・自由形式で記録していく個人用アプリ。
（要件定義・設計書 v0.3 の **Phase 1: MVP** 相当）

- **フロントエンド**: Next.js 16 (App Router) + React 19 + TypeScript
- **スタイル**: Tailwind CSS v4（パステル調の明るい緑をベースカラーに設定）
- **データベース**: Cloud Firestore（Native mode）— ブラウザから直接読み書き
- **認証**: Firebase Authentication（Google ログインのみ）
- **実行環境**: Cloud Run（コンテナ、ゼロスケール）

---

## 実装済みの機能（Phase 1）

| 区分 | 内容 |
|---|---|
| 認証 | Google アカウントでのログイン／ログアウト。未ログイン時はログイン画面のみ表示 |
| 目標 | 一覧（対応中／完了のタブ切替）、作成、編集、削除、ステータス切替（対応中 ⇄ 完了） |
| ログ | 目標詳細画面での作成（日付＋自由記述）、日付降順の一覧、その場での編集、削除。1日に複数件の登録可 |
| UI | モバイルファースト。PC では中央寄せの読みやすい幅（max-w-2xl）に収まる |

Phase 2 以降（PWA 化、目標カードへの直近ログプレビュー、入力欄の固定表示、カレンダービュー等）は未実装。

---

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

### アイコンを変更したいとき

`assets/app-icon.svg` を編集してから、次を実行して PNG を再生成する（生成物はコミットする）。

```bash
node scripts/generate-icons.mjs
```

なお iOS はホーム画面のアイコンを強くキャッシュするため、デプロイ後も既存のアイコンは
自動では変わらない。ホーム画面から一度削除し、Safari で開き直してから追加し直す必要がある。

---

## セットアップ手順

### 1. Google Cloud / Firebase プロジェクトを作る

1. [Firebase コンソール](https://console.firebase.google.com/) で新規プロジェクトを作成する
   （Firebase プロジェクトを作ると、同名の Google Cloud プロジェクトが自動的に作られる）
2. **Build > Firestore Database** から Firestore を作成する
   - モード: **本番環境モード**（ルールはこのリポジトリの `firestore.rules` で上書きする）
   - ロケーション: `asia-northeast1`（東京）など、近いリージョンを選ぶ
3. **Build > Authentication** を開き、**Sign-in method** で **Google** を有効にする
4. **プロジェクトの設定 > 全般 > マイアプリ** で **ウェブアプリ（`</>`）** を追加し、
   表示される `firebaseConfig` の値を控える

### 2. 環境変数を設定する

```bash
cp .env.local.example .env.local
# .env.local を開いて、上で控えた firebaseConfig の値を貼り付ける
```

`NEXT_PUBLIC_` で始まる変数はブラウザのバンドルに埋め込まれる（＝公開される）が、
これらは秘密情報ではない。実際のアクセス制御は Firestore Security Rules が担う。

### 3. ローカルで起動する

```bash
npm install
npm run dev
# http://localhost:3000
```

### 4. Security Rules を反映する

```bash
npm install -g firebase-tools     # 未インストールの場合
firebase login
firebase use --add                # 上で作ったプロジェクトを選択
firebase deploy --only firestore:rules
```

ルールの内容は「認証済みかつ `users/{uid}` が自分の uid と一致する場合のみ読み書き可、それ以外は全拒否」。
さらに自分1アカウントだけに限定したい場合は、`firestore.rules` 内のコメントに書いた
「uid を直接埋め込む」書き方に差し替える。

---

## Cloud Run へのデプロイ

### 手動デプロイ（初回の動作確認向け）

```bash
PROJECT_ID=<あなたのプロジェクトID>
REGION=asia-northeast1
REPO=app
SERVICE=goal-log

# Artifact Registry のリポジトリを一度だけ作る
gcloud artifacts repositories create $REPO \
  --repository-format=docker --location=$REGION --project=$PROJECT_ID

gcloud auth configure-docker $REGION-docker.pkg.dev

# ビルドに必要な NEXT_PUBLIC_* は .env.local から読まれるので、引数の指定は不要
IMAGE=$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/$SERVICE:manual
docker build -t $IMAGE .
docker push $IMAGE

gcloud run deploy $SERVICE --image $IMAGE --region $REGION \
  --allow-unauthenticated --min-instances 0 --max-instances 2 --project $PROJECT_ID
```

デプロイ後、**Firebase コンソール > Authentication > Settings > 承認済みドメイン** に
Cloud Run の URL のホスト名（`xxxx-an.a.run.app`）を追加する。
これを忘れると Google ログインのポップアップが弾かれる。

> `--allow-unauthenticated` は「URL に誰でもアクセスできる」設定で、これは
> ログイン画面が表示できるようにするために必要。目標やログのデータ自体は
> Firebase 認証と Security Rules で保護されており、本人以外は読めない。

### 環境変数がイメージに入る仕組み

`NEXT_PUBLIC_*` は「ビルド時」にクライアントのJSバンドルへ文字列として埋め込まれる。
実行時に Cloud Run 側で環境変数を設定しても反映されないので、ビルドの時点で値が要る。

そこで本リポジトリでは、**ローカル開発で使っている `.env.local` をそのまま
ビルドコンテキストに含めて `next build` に読ませる**方式にしている。
`docker build` に `--build-arg` を並べる必要はなく、コマンドは `docker build -t $IMAGE .` だけでよい。

- `.dockerignore` で `.env.local` を除外していないのはこのため
- `.env.local` が置かれるのは `builder` ステージのみ。最終イメージ（`runner`）へは
  `.next` の出力しかコピーしないので、push されるイメージにこのファイルは含まれない
- これらの値はもともとバンドル経由でブラウザに配られる公開情報。
  逆に言えば、**サーバー用の秘密情報を `.env.local` に置いてはいけない**
- `.env.local` が無い状態でビルドすると、`src/lib/firebase.ts` のチェックにより
  「Firebase の環境変数が設定されていません」というメッセージで失敗する

### GitHub Actions による自動デプロイ

`.github/workflows/deploy.yml` が `main` への push で動く。
リポジトリの **Settings > Secrets and variables > Actions** に以下を登録する。

**Variables**

| 名前 | 例 |
|---|---|
| `GCP_PROJECT_ID` | `my-goal-log` |
| `GCP_REGION` | `asia-northeast1` |
| `CLOUD_RUN_SERVICE` | `goal-log` |
| `ARTIFACT_REPOSITORY` | `app` |

**Secrets**

| 名前 | 内容 |
|---|---|
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Workload Identity プロバイダのリソース名 |
| `GCP_SERVICE_ACCOUNT` | デプロイ用サービスアカウントのメールアドレス |
| `NEXT_PUBLIC_FIREBASE_*`（6 個） | `.env.local` と同じ値 |

`.env.local` は Git 管理外なので CI のチェックアウト先には存在しない。
そのためワークフローでは、ビルド前に上記 Secrets から同じ内容の `.env.local` を
書き出してからイメージをビルドしている（ローカルと同じ仕組みに揃えるため）。

デプロイ用サービスアカウントには、Cloud Run 管理者・Artifact Registry 書き込み・
サービスアカウントユーザーの権限が必要。

---

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

補足として、実装上いくつか意図的にシンプルさを優先した箇所がある（コード内にもコメントあり）。

- ステータスでの絞り込みは Firestore の `where` ではなく取得後にメモリ上で行っている。
  `where` + `orderBy` は複合インデックスが必要になるが、個人利用の規模では割に合わないため。
- ログの並び替えも `orderBy("date")` のみとし、同一日付内の順序は取得後に `createdAt` で整えている。
- 目標を削除するときは、サブコレクションの `logs` を先にまとめて削除している。
  Firestore は親ドキュメントを消しても子コレクションを自動削除しないため。

---

## よく使うコマンド

```bash
npm run dev      # 開発サーバー
npm run build    # 本番ビルド（環境変数が必要）
npm run lint     # ESLint
npx tsc --noEmit # 型チェック
```
