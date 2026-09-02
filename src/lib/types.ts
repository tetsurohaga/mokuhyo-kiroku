/**
 * アプリ内で扱うデータ型の定義
 * -------------------------------------------------------------
 * 設計書 6.1 の Firestore コレクション構成に対応する。
 *
 *   users/{uid}/goals/{goalId}
 *   users/{uid}/goals/{goalId}/logs/{logId}
 */
import type { Timestamp } from "firebase/firestore";

/** 目標のステータス。設計書 3.1 のとおり2値のみ。 */
export type GoalStatus = "in_progress" | "completed";

/**
 * 目標（Goal）
 * Firestore のドキュメントに `id`（ドキュメントID）を足したもの。
 * Firestore 本体はドキュメントIDをフィールドとして持たないので、
 * 読み出し時にアプリ側で詰め直している（後述の goals.ts を参照）。
 */
export type Goal = {
  id: string;
  title: string;
  /** 説明文（任意）。未入力なら空文字を保存する。 */
  description: string;
  status: GoalStatus;
  /**
   * 将来のジャンル分け用フィールド（設計書 6.1）。
   * Phase 1 では UI から編集せず、既定値 "blog" を入れておく。
   */
  category: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  /** 完了にした日時。対応中に巻き戻したら null に戻す。 */
  completedAt: Timestamp | null;
};

/**
 * 日次ログ（Log）
 * 目標のサブコレクションに保存される、自由記述のメモ。
 */
export type Log = {
  id: string;
  /** 自由記述の本文 */
  content: string;
  /** ログの対象日。"YYYY-MM-DD" 形式の文字列で保持する（設計書 6.1） */
  date: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};
