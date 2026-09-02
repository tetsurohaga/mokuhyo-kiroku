/**
 * Firebase クライアントSDK の初期化
 * -------------------------------------------------------------
 * 本アプリは「ブラウザから直接 Firestore を読み書きし、
 * アクセス制御は Firestore Security Rules で行う」方式を採用している
 * （設計書 9-2）。そのためサーバー側の Admin SDK は使わず、
 * ここで初期化したクライアントSDKのインスタンスを全画面で共有する。
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/**
 * Firebase の接続情報。
 * `NEXT_PUBLIC_` 接頭辞のついた環境変数は Next.js がビルド時にクライアント
 * バンドルへ埋め込むため、ブラウザから参照できる。
 * （これらの値は秘密情報ではない。実際のアクセス制御は Security Rules 側で行う）
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * 設定漏れは Firebase 側の分かりにくいエラー（auth/invalid-api-key 等）になるため、
 * 先に自前でチェックして原因が分かるメッセージを出す。
 * ビルド時にも評価されるので、環境変数の渡し忘れにその場で気づける。
 */
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    "Firebase の環境変数が設定されていません。.env.local.example を .env.local にコピーし、" +
      "Firebase コンソールの firebaseConfig の値を設定してください。" +
      "（docker build も同じ .env.local を読むため、リポジトリ直下に置いてあれば追加の引数は不要です）",
  );
}

/**
 * Next.js の開発サーバーは HMR（ホットリロード）でモジュールを再評価するため、
 * 素朴に initializeApp() を呼ぶと「既に初期化済み」エラーになることがある。
 * getApps() で既存インスタンスの有無を確認する、というのが定番の書き方。
 */
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

/** 認証（Firebase Authentication）のインスタンス */
export const auth: Auth = getAuth(app);

/** Firestore（Native mode）のインスタンス */
export const db: Firestore = getFirestore(app);

/**
 * Google ログイン用のプロバイダ。
 * 設計書 9-1 のとおり、本アプリの認証方式は Google 認証のみ。
 */
export const googleProvider = new GoogleAuthProvider();
