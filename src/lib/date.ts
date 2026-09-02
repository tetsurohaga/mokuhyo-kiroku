/**
 * 日付まわりの小さなユーティリティ
 * -------------------------------------------------------------
 * ログの日付は "YYYY-MM-DD" の文字列として保存する（設計書 6.1）。
 * Date 型ではなく文字列にしておくと、タイムゾーンのズレで日付が
 * 1日前後する事故を避けられ、<input type="date"> の値ともそのまま噛み合う。
 */

/** 今日の日付を "YYYY-MM-DD" で返す（端末のローカルタイムゾーン基準） */
export function todayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  // getMonth() は 0 始まりなので +1 する。padStart で 1 桁月日をゼロ埋め。
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * "YYYY-MM-DD" を画面表示用の "2026年9月1日（月）" 形式に整形する。
 * 不正な文字列が来た場合は、そのまま返して画面を壊さないようにしている。
 */
export function formatDateLabel(dateString: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (!match) return dateString;

  const [, year, month, day] = match;
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  // new Date(y, m-1, d) はローカルタイムゾーンで生成されるため日付がずれない
  const weekday = weekdays[new Date(Number(year), Number(month) - 1, Number(day)).getDay()];

  return `${Number(year)}年${Number(month)}月${Number(day)}日（${weekday}）`;
}

/**
 * Firestore の Timestamp を "2026/9/1" のような短い表示に変換する。
 * serverTimestamp() で書き込んだ直後はサーバー確定前で null になりうるため、
 * その場合は空文字を返して画面側で出し分けなくて済むようにしている。
 */
export function formatTimestampShort(timestamp: { toDate: () => Date } | null): string {
  if (!timestamp) return "";
  const date = timestamp.toDate();
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}
