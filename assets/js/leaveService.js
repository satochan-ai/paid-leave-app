/**
 * leaveService.js - 有給データ操作
 *
 * 有給付与履歴・取得履歴のCRUDおよびビジネスロジックを担当する。
 * leaveCalculator.js の計算関数と storage.js の読み書き関数を組み合わせて使う。
 */

/**
 * 社員の有給付与履歴を返す（付与日昇順）
 * @param {string} employeeId
 * @returns {Array<object>}
 */
function getLeaveGrantHistory(employeeId) {
  return getLeaveGrants()
    .filter((g) => g.employeeId === employeeId)
    .sort((a, b) => (a.grantDate < b.grantDate ? -1 : 1));
}

/**
 * 社員の有給取得履歴を返す（取得日降順）
 * @param {string} employeeId
 * @returns {Array<object>}
 */
function getLeaveUsageHistory(employeeId) {
  return getLeaveUsages()
    .filter((u) => u.employeeId === employeeId)
    .sort((a, b) => (a.usageDate > b.usageDate ? -1 : 1));
}

/**
 * 入社日から現在日までに発生しているべき有給付与を自動生成する
 * @param {string} employeeId
 * @param {string} currentDate - YYYY-MM-DD（省略時は今日）
 * @returns {Array<object>} 新規作成した付与履歴
 */
function generateLeaveGrantsIfNeeded(employeeId, currentDate) {
  const today = currentDate || getToday();
  const employee = getEmployeeById(employeeId);
  if (!employee) return [];

  // 退職済みには付与しない
  if (employee.status === 'retired') return [];

  const firstGrantDate = calculateFirstGrantDate(employee.hireDate);

  // 初回付与日がまだ来ていない場合は何もしない
  if (firstGrantDate > today) return [];

  // 既存の付与履歴（grantDateをSetで保持）
  const existing = getLeaveGrants().filter((g) => g.employeeId === employeeId);
  const existingDates = new Set(existing.map((g) => g.grantDate));

  // 初回から1年ずつ today 以前の付与日を列挙
  const dueDates = [];
  let d = new Date(firstGrantDate);
  const todayDate = new Date(today);
  while (d <= todayDate) {
    const ds = formatDate(d);
    if (!existingDates.has(ds)) {
      dueDates.push(ds);
    }
    d = addYears(d, 1);
  }

  if (dueDates.length === 0) return [];

  const now = getToday();
  const allGrants = getLeaveGrants();
  const newGrants = [];

  dueDates.forEach((grantDate) => {
    const grantedDays = calculateGrantDays(employee.hireDate, grantDate);
    const expireDate = calculateExpireDate(grantDate);
    const grant = {
      id: generateId('grant'),
      employeeId,
      grantDate,
      grantedDays,
      usedDays: 0,
      remainingDays: grantedDays,
      expireDate,
      createdAt: now,
    };
    allGrants.push(grant);
    newGrants.push(grant);
  });

  saveLeaveGrants(allGrants);
  return newGrants;
}

/**
 * 有給を古い付与分から消化する
 * @param {string} employeeId
 * @param {number} usedDays
 * @param {string} currentDate - YYYY-MM-DD（失効判定の基準日）
 * @returns {{ success: boolean, consumedDetails?: Array, message?: string }}
 */
function consumeLeave(employeeId, usedDays, currentDate) {
  const today = currentDate || getToday();
  const allGrants = getLeaveGrants();

  // 未失効かつ残日数ありの付与履歴を古い順に取得
  const targets = allGrants
    .filter(
      (g) =>
        g.employeeId === employeeId &&
        !isExpired(g.expireDate, today) &&
        g.remainingDays > 0
    )
    .sort((a, b) => (a.grantDate < b.grantDate ? -1 : 1));

  const totalRemaining = targets.reduce((s, g) => s + g.remainingDays, 0);
  if (totalRemaining < usedDays) {
    return { success: false, message: '有給残日数が不足しています。' };
  }

  let remaining = usedDays;
  const consumedDetails = [];

  for (const grant of targets) {
    if (remaining <= 0) break;
    const take = Math.min(grant.remainingDays, remaining);
    grant.remainingDays = Math.round((grant.remainingDays - take) * 10) / 10;
    grant.usedDays = Math.round((grant.usedDays + take) * 10) / 10;
    remaining = Math.round((remaining - take) * 10) / 10;
    consumedDetails.push({ grantId: grant.id, usedDays: take });
  }

  saveLeaveGrants(allGrants);
  return { success: true, consumedDetails };
}

/**
 * 有給取得履歴を登録する
 * @param {string} employeeId
 * @param {string} usageDate  - YYYY-MM-DD
 * @param {number} usedDays   - 0.5 または 1 以上の整数
 * @param {string} note
 * @returns {{ success: boolean, usage?: object, message?: string }}
 */
function registerLeaveUsage(employeeId, usageDate, usedDays, note) {
  // 入力値を検証
  const validation = validateLeaveUsageForm({ employeeId, usageDate, usedDays });
  if (!validation.valid) {
    return { success: false, message: Object.values(validation.errors).join(' / ') };
  }

  // 付与不足分を自動生成してから消化（取得日を基準日とする）
  generateLeaveGrantsIfNeeded(employeeId, usageDate);

  // 古い付与分から消化
  const consumeResult = consumeLeave(employeeId, toNumber(usedDays), usageDate);
  if (!consumeResult.success) {
    return { success: false, message: consumeResult.message };
  }

  const createdBy = getCurrentUser() ? getCurrentUser().id : 'system';
  const usage = {
    id: generateId('usage'),
    employeeId,
    usageDate,
    usedDays: toNumber(usedDays),
    note: note || '',
    createdBy,
    createdAt: getToday(),
  };

  const usages = getLeaveUsages();
  usages.push(usage);
  saveLeaveUsages(usages);

  return { success: true, usage };
}

// --- window公開 ---
window.getLeaveGrantHistory = getLeaveGrantHistory;
window.getLeaveUsageHistory = getLeaveUsageHistory;
window.generateLeaveGrantsIfNeeded = generateLeaveGrantsIfNeeded;
window.consumeLeave = consumeLeave;
window.registerLeaveUsage = registerLeaveUsage;
