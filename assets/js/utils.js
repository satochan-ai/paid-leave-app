/**
 * utils.js - 共通ユーティリティ関数
 *
 * 日付操作・ID生成・文字列変換など汎用処理を担当する。
 */

/**
 * 一意なIDを生成する
 * @param {string} prefix - 例: "emp", "usr", "grant"
 * @returns {string} - 例: "emp_1710000000000_xxxxx"
 */
function generateId(prefix) {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 7);
  return `${prefix}_${ts}_${rand}`;
}

/**
 * 日付をYYYY-MM-DD形式の文字列に変換する
 * @param {Date|string} date
 * @returns {string}
 */
function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 日付にN月加算する
 * 月末処理：加算後の月に同日が存在しない場合は末日に丸める
 * @param {Date|string} date
 * @param {number} months
 * @returns {Date}
 */
function addMonths(date, months) {
  const d = date instanceof Date ? new Date(date) : new Date(date);
  const targetMonth = d.getMonth() + months;
  const result = new Date(d.getFullYear(), targetMonth, d.getDate());
  // 月をまたいでしまった場合（例：1/31 + 1ヶ月 → 3/3）は末日に戻す
  if (result.getMonth() !== ((targetMonth % 12) + 12) % 12) {
    result.setDate(0);
  }
  return result;
}

/**
 * 日付にN年加算する
 * @param {Date|string} date
 * @param {number} years
 * @returns {Date}
 */
function addYears(date, years) {
  const d = date instanceof Date ? new Date(date) : new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

/**
 * 今日の日付をYYYY-MM-DD形式で返す
 * @returns {string}
 */
function getToday() {
  return formatDate(new Date());
}

/**
 * 値を数値に変換する（変換失敗時は0を返す）
 * @param {any} value
 * @returns {number}
 */
function toNumber(value) {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

/**
 * URLクエリパラメータを取得する
 * @param {string} name - パラメータ名
 * @returns {string|null}
 */
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}
