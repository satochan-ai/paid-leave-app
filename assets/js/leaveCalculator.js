/**
 * leaveCalculator.js - 有給計算ロジック
 *
 * 付与日・付与日数・次回付与日・失効日・有給サマリーの計算を担当する。
 * 純粋な計算ロジックのみを持ち、localStorage操作は行わない。
 */

/**
 * 初回付与日を計算する（入社日 + 6か月）
 * @param {string} hireDate - YYYY-MM-DD
 * @returns {string} - YYYY-MM-DD
 */
function calculateFirstGrantDate(hireDate) {
  return formatDate(addMonths(hireDate, 6));
}

/**
 * 対象の付与日が何回目の付与かを返す
 * @param {string} hireDate  - YYYY-MM-DD
 * @param {string} grantDate - YYYY-MM-DD
 * @returns {number} - 1始まり
 */
function getGrantCount(hireDate, grantDate) {
  const firstGrant = new Date(calculateFirstGrantDate(hireDate));
  const target = new Date(grantDate);
  // 差分をミリ秒→年換算（365.25日/年）
  const diffYears = (target - firstGrant) / (365.25 * 24 * 60 * 60 * 1000);
  return Math.round(diffYears) + 1;
}

// 法定付与日数テーブル（付与回次 1〜7回目以降）
const LEGAL_GRANT_DAYS = [10, 11, 12, 14, 16, 18, 20];

/**
 * 付与回次に応じた付与日数を計算する（法定付与日数）
 * @param {string} hireDate  - YYYY-MM-DD
 * @param {string} grantDate - YYYY-MM-DD
 * @returns {number} - 付与日数（10〜20）
 */
function calculateGrantDays(hireDate, grantDate) {
  const grantCount = getGrantCount(hireDate, grantDate);
  if (grantCount <= 0) return 0;
  const index = Math.min(grantCount - 1, LEGAL_GRANT_DAYS.length - 1);
  return LEGAL_GRANT_DAYS[index];
}

/**
 * 次回付与日を計算する
 * @param {string} hireDate    - YYYY-MM-DD
 * @param {string} currentDate - YYYY-MM-DD
 * @returns {string} - YYYY-MM-DD
 */
function calculateNextGrantDate(hireDate, currentDate) {
  const firstGrant = new Date(calculateFirstGrantDate(hireDate));
  const current = new Date(currentDate);

  if (firstGrant > current) {
    return formatDate(firstGrant);
  }

  // 初回付与日から何年経過したか
  const diffYears = (current - firstGrant) / (365.25 * 24 * 60 * 60 * 1000);
  // 次回付与は「経過年数の切り捨て + 1」年後
  const nextN = Math.floor(diffYears) + 1;
  const nextDate = addYears(firstGrant, nextN);
  return formatDate(nextDate);
}

/**
 * 失効日を計算する（付与日 + 2年）
 * @param {string} grantDate - YYYY-MM-DD
 * @returns {string} - YYYY-MM-DD
 */
function calculateExpireDate(grantDate) {
  return formatDate(addYears(grantDate, 2));
}

/**
 * 付与履歴が失効済みか判定する
 * @param {string} expireDate  - YYYY-MM-DD
 * @param {string} currentDate - YYYY-MM-DD
 * @returns {boolean}
 */
function isExpired(expireDate, currentDate) {
  return expireDate < currentDate;
}

/**
 * 社員の有給サマリーを計算する
 * @param {string} employeeId
 * @param {string} currentDate - YYYY-MM-DD（省略時は今日）
 * @returns {object}
 */
function calculateLeaveSummary(employeeId, currentDate) {
  const today = currentDate || getToday();
  const grants = getLeaveGrants().filter((g) => g.employeeId === employeeId);
  const usages = getLeaveUsages().filter((u) => u.employeeId === employeeId);

  // 全付与日数合計
  const totalGrantedDays = grants.reduce((s, g) => s + g.grantedDays, 0);

  // 取得履歴合計（leaveUsagesから集計）
  const totalUsedDays = usages.reduce((s, u) => s + u.usedDays, 0);

  // 付与履歴上の残日数合計（失効含む）
  const totalRemainingDays = grants.reduce((s, g) => s + g.remainingDays, 0);

  // 未失効分の残日数合計
  const activeGrants = grants.filter((g) => !isExpired(g.expireDate, today));
  const activeRemainingDays = activeGrants.reduce((s, g) => s + g.remainingDays, 0);

  // 失効済み残日数
  const expiredGrants = grants.filter((g) => isExpired(g.expireDate, today));
  const expiredRemainingDays = expiredGrants.reduce((s, g) => s + g.remainingDays, 0);

  // 社員情報（入社日）
  const employee = getEmployees().find((e) => e.id === employeeId);
  let nextGrantDate = null;
  let nextGrantDays = null;
  if (employee && employee.hireDate) {
    nextGrantDate = calculateNextGrantDate(employee.hireDate, today);
    nextGrantDays = calculateGrantDays(employee.hireDate, nextGrantDate);
  }

  // 最も近い失効日（未失効かつ残日数あり）
  const expiringGrants = activeGrants
    .filter((g) => g.remainingDays > 0)
    .sort((a, b) => (a.expireDate < b.expireDate ? -1 : 1));

  const nearestExpireDate = expiringGrants.length > 0 ? expiringGrants[0].expireDate : null;
  const nearestExpireDays = nearestExpireDate
    ? expiringGrants
        .filter((g) => g.expireDate === nearestExpireDate)
        .reduce((s, g) => s + g.remainingDays, 0)
    : 0;

  return {
    employeeId,
    totalGrantedDays,
    totalUsedDays,
    totalRemainingDays,
    activeRemainingDays,
    expiredRemainingDays,
    nextGrantDate,
    nextGrantDays,
    nearestExpireDate,
    nearestExpireDays,
  };
}

// --- window公開 ---
window.calculateFirstGrantDate = calculateFirstGrantDate;
window.getGrantCount = getGrantCount;
window.calculateGrantDays = calculateGrantDays;
window.calculateNextGrantDate = calculateNextGrantDate;
window.calculateExpireDate = calculateExpireDate;
window.isExpired = isExpired;
window.calculateLeaveSummary = calculateLeaveSummary;
