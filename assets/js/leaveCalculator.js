/**
 * leaveCalculator.js - 有給計算ロジック
 *
 * 付与日・付与日数・次回付与日・失効日・有給サマリーの計算を担当する。
 * 通常付与・比例付与の両方に対応している。
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

// ─────────────────────────────────────────
// 付与日数テーブル
// ─────────────────────────────────────────

/** 通常付与日数テーブル（1〜7回目以降） */
const NORMAL_GRANT_DAYS = [10, 11, 12, 14, 16, 18, 20];

/** 後方互換エイリアス */
const LEGAL_GRANT_DAYS = NORMAL_GRANT_DAYS;

/** 比例付与日数テーブル（週所定労働日数 → 付与回次別日数） */
const PROPORTIONAL_GRANT_DAYS_BY_WEEKLY_DAYS = {
  4: [7,  8,  9, 10, 12, 13, 15],
  3: [5,  6,  6,  8,  9, 10, 11],
  2: [3,  4,  4,  5,  6,  6,  7],
  1: [1,  2,  2,  2,  3,  3,  3],
};

// ─────────────────────────────────────────
// 勤務条件ヘルパー
// ─────────────────────────────────────────

/**
 * 社員の勤務条件デフォルト値を補完して返す
 * 勤務条件未設定（既存社員等）はすべて通常付与として扱う
 * @param {object|null} employee
 * @returns {{ workType: string, weeklyWorkDays: number, weeklyWorkHours: number, annualWorkDays: number }}
 */
function getDefaultWorkCondition(employee) {
  return {
    workType:      (employee && employee.workType)              || 'normal',
    weeklyWorkDays: (employee && employee.weeklyWorkDays != null) ? Number(employee.weeklyWorkDays) : 5,
    weeklyWorkHours:(employee && employee.weeklyWorkHours != null)? Number(employee.weeklyWorkHours): 40,
    annualWorkDays: (employee && employee.annualWorkDays != null) ? Number(employee.annualWorkDays) : 260,
  };
}

/**
 * 付与区分ラベルを返す
 * @param {string} workType
 * @returns {string}
 */
function getWorkTypeLabel(workType) {
  const map = { normal: '通常付与', proportional: '比例付与', custom: '個別設定' };
  return map[workType] || '通常付与';
}

/**
 * 通常付与対象かどうかを判定する
 * 以下のいずれかに該当する場合は通常付与：
 *   - workType === "normal"
 *   - 週所定労働時間 >= 30
 *   - 週所定労働日数 >= 5
 *   - 年間所定労働日数 >= 217
 * @param {object|null} employee
 * @returns {boolean}
 */
function isNormalGrantTarget(employee) {
  const cond = getDefaultWorkCondition(employee);
  if (cond.workType === 'normal')        return true;
  if (cond.weeklyWorkHours >= 30)        return true;
  if (cond.weeklyWorkDays  >= 5)         return true;
  if (cond.annualWorkDays  >= 217)       return true;
  return false;
}

/**
 * 比例付与テーブルで使う週所定労働日数相当を返す
 * 判定優先順位：年間所定労働日数（48〜216の範囲） → 週所定労働日数
 * @param {object|null} employee
 * @returns {number|null} 1〜4、または null（通常付与扱い）
 */
function getProportionalWeeklyDays(employee) {
  const cond = getDefaultWorkCondition(employee);
  const annual = cond.annualWorkDays;

  // 年間所定労働日数が比例付与対象範囲にあれば優先
  if (annual >= 169 && annual <= 216) return 4;
  if (annual >= 121 && annual <= 168) return 3;
  if (annual >= 73  && annual <= 120) return 2;
  if (annual >= 48  && annual <= 72)  return 1;

  // 週所定労働日数による判定
  const weekly = cond.weeklyWorkDays;
  if (weekly === 4) return 4;
  if (weekly === 3) return 3;
  if (weekly === 2) return 2;
  if (weekly === 1) return 1;

  return null;
}

// ─────────────────────────────────────────
// 付与日数計算
// ─────────────────────────────────────────

/**
 * 通常付与日数を返す
 * @param {number} grantCount - 付与回次（1始まり）
 * @returns {number}
 */
function calculateNormalGrantDays(grantCount) {
  if (grantCount <= 0) return 0;
  const index = Math.min(grantCount - 1, NORMAL_GRANT_DAYS.length - 1);
  return NORMAL_GRANT_DAYS[index];
}

/**
 * 比例付与日数を返す
 * @param {number} grantCount  - 付与回次（1始まり）
 * @param {number} weeklyDays  - 週所定労働日数相当（1〜4）
 * @returns {number}
 */
function calculateProportionalGrantDays(grantCount, weeklyDays) {
  if (grantCount <= 0) return 0;
  const table = PROPORTIONAL_GRANT_DAYS_BY_WEEKLY_DAYS[weeklyDays];
  if (!table) return calculateNormalGrantDays(grantCount);
  const index = Math.min(grantCount - 1, table.length - 1);
  return table[index];
}

/**
 * 付与回次に応じた付与日数を返す
 * employee を省略した場合は通常付与で計算する（後方互換）
 * @param {string}      hireDate  - YYYY-MM-DD
 * @param {string}      grantDate - YYYY-MM-DD
 * @param {object|null} employee  - 勤務条件を持つ社員オブジェクト（省略可）
 * @returns {number}
 */
function calculateGrantDays(hireDate, grantDate, employee) {
  const grantCount = getGrantCount(hireDate, grantDate);
  if (grantCount <= 0) return 0;

  // employee 未指定 → 通常付与
  if (!employee) return calculateNormalGrantDays(grantCount);

  // 通常付与対象 → 通常付与
  if (isNormalGrantTarget(employee)) return calculateNormalGrantDays(grantCount);

  // 比例付与対象
  const weeklyDays = getProportionalWeeklyDays(employee);
  if (weeklyDays === null) {
    // テーブルで判定できない場合は通常付与にフォールバック
    return calculateNormalGrantDays(grantCount);
  }
  return calculateProportionalGrantDays(grantCount, weeklyDays);
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

  // 取得履歴合計
  const totalUsedDays = usages.reduce((s, u) => s + u.usedDays, 0);

  // 付与履歴上の残日数合計（失効含む）
  const totalRemainingDays = grants.reduce((s, g) => s + g.remainingDays, 0);

  // 未失効分の残日数合計
  const activeGrants = grants.filter((g) => !isExpired(g.expireDate, today));
  const activeRemainingDays = activeGrants.reduce((s, g) => s + g.remainingDays, 0);

  // 失効済み残日数
  const expiredGrants = grants.filter((g) => isExpired(g.expireDate, today));
  const expiredRemainingDays = expiredGrants.reduce((s, g) => s + g.remainingDays, 0);

  // 社員情報（入社日・勤務条件）
  const employee = getEmployees().find((e) => e.id === employeeId);
  let nextGrantDate = null;
  let nextGrantDays = null;
  if (employee && employee.hireDate) {
    nextGrantDate = calculateNextGrantDate(employee.hireDate, today);
    // 次回付与日数も勤務条件を考慮して計算
    nextGrantDays = calculateGrantDays(employee.hireDate, nextGrantDate, employee);
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

// ─────────────────────────────────────────
// window公開
// ─────────────────────────────────────────
window.calculateFirstGrantDate       = calculateFirstGrantDate;
window.getGrantCount                 = getGrantCount;
window.getDefaultWorkCondition       = getDefaultWorkCondition;
window.getWorkTypeLabel              = getWorkTypeLabel;
window.isNormalGrantTarget           = isNormalGrantTarget;
window.getProportionalWeeklyDays     = getProportionalWeeklyDays;
window.calculateNormalGrantDays      = calculateNormalGrantDays;
window.calculateProportionalGrantDays= calculateProportionalGrantDays;
window.calculateGrantDays            = calculateGrantDays;
window.calculateNextGrantDate        = calculateNextGrantDate;
window.calculateExpireDate           = calculateExpireDate;
window.isExpired                     = isExpired;
window.calculateLeaveSummary         = calculateLeaveSummary;
