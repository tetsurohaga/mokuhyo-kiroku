# Cloud Run へのデプロイ

通常は `main` への push で GitHub Actions が自動デプロイする。
初回の動作確認やトラブル時には手動デプロイも使える。

## 手動デプロイ（初回の動作確認向け）

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

## 環境変数がイメージに入る仕組み

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

## GitHub Actions による自動デプロイ

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
