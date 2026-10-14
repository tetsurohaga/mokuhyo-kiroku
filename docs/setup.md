# 初期セットアップ

Firebase / Google Cloud プロジェクトを新規に用意し、ローカルで動かせる状態にするまでの手順。

## 1. Google Cloud / Firebase プロジェクトを作る

1. [Firebase コンソール](https://console.firebase.google.com/) で新規プロジェクトを作成する
   （Firebase プロジェクトを作ると、同名の Google Cloud プロジェクトが自動的に作られる）
2. **Build > Firestore Database** から Firestore を作成する
   - モード: **本番環境モード**（ルールはこのリポジトリの `firestore.rules` で上書きする）
   - ロケーション: `asia-northeast1`（東京）など、近いリージョンを選ぶ
3. **Build > Authentication** を開き、**Sign-in method** で **Google** を有効にする
4. **プロジェクトの設定 > 全般 > マイアプリ** で **ウェブアプリ（`</>`）** を追加し、
   表示される `firebaseConfig` の値を控える

## 2. 環境変数を設定する

```bash
cp .env.local.example .env.local
# .env.local を開いて、上で控えた firebaseConfig の値を貼り付ける
```

`NEXT_PUBLIC_` で始まる変数はブラウザのバンドルに埋め込まれる（＝公開される）が、
これらは秘密情報ではない。実際のアクセス制御は Firestore Security Rules が担う。

この `.env.local` はコンテナビルド時にもそのまま使われる。仕組みは
[deployment.md の「環境変数がイメージに入る仕組み」](./deployment.md#環境変数がイメージに入る仕組み) を参照。

## 3. ローカルで起動する

```bash
npm install
npm run dev
# http://localhost:3000
```

## 4. Security Rules を反映する

```bash
npm install -g firebase-tools     # 未インストールの場合
firebase login
firebase use --add                # 上で作ったプロジェクトを選択
firebase deploy --only firestore:rules
```

ルールの内容は「認証済みかつ `users/{uid}` が自分の uid と一致する場合のみ読み書き可、それ以外は全拒否」。
さらに自分1アカウントだけに限定したい場合は、`firestore.rules` 内のコメントに書いた
「uid を直接埋め込む」書き方に差し替える。
