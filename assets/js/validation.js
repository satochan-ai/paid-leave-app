/**
 * validation.js - 入力バリデーション
 *
 * フォームの入力値チェックを担当する。
 * { valid: boolean, errors: { field: message } } を返す。
 */

/**
 * ログインフォームのバリデーション
 * @param {string} email
 * @param {string} password
 * @returns {{ valid: boolean, errors: object }}
 */
function validateLoginForm(email, password) {
  const errors = {};

  if (!email || !email.trim()) {
    errors.email = 'メールアドレスを入力してください。';
  }
  if (!password || !password.trim()) {
    errors.password = 'パスワードを入力してください。';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * 社員追加・編集フォームのバリデーション
 * @param {object} data - フォーム入力値
 * @param {{ mode: "create"|"edit", employeeId?: string }} options
 * @returns {{ valid: boolean, errors: object }}
 */
function validateEmployeeForm(data, options = { mode: 'create' }) {
  const errors = {};
  const mode = options.mode || 'create';
  const selfId = options.employeeId || null;

  if (!data.name || !data.name.trim()) {
    errors.name = '社員名を入力してください。';
  }
  if (!data.email || !data.email.trim()) {
    errors.email = 'メールアドレスを入力してください。';
  }
  if (mode === 'create' && (!data.password || !data.password.trim())) {
    errors.password = 'パスワードを入力してください。';
  }
  if (!data.hireDate) {
    errors.hireDate = '入社日を入力してください。';
  }

  // メールアドレス重複チェック（編集時は自分自身を除外）
  if (data.email && data.email.trim()) {
    const users = getUsers();
    const duplicate = users.find((u) => {
      if (u.email !== data.email.trim()) return false;
      if (selfId && u.employeeId === selfId) return false;
      return true;
    });
    if (duplicate) {
      errors.email = 'このメールアドレスはすでに使用されています。';
    }
  }

  // 退職日が入社日より前チェック
  if (data.retirementDate && data.hireDate && data.retirementDate < data.hireDate) {
    errors.retirementDate = '退職日は入社日以降の日付を入力してください。';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * 有給取得登録フォームのバリデーション
 * @param {object} data - { employeeId, usageDate, usedDays }
 * @returns {{ valid: boolean, errors: object }}
 */
function validateLeaveUsageForm(data) {
  const errors = {};

  if (!data.employeeId) {
    errors.employeeId = '対象社員を指定してください。';
  }
  if (!data.usageDate) {
    errors.usageDate = '取得日を入力してください。';
  }

  const days = toNumber(data.usedDays);
  if (data.usedDays === undefined || data.usedDays === null || data.usedDays === '') {
    errors.usedDays = '取得日数を入力してください。';
  } else if (days <= 0) {
    errors.usedDays = '取得日数は0より大きい値を入力してください。';
  } else if ((days * 10) % 5 !== 0) {
    // 0.5単位チェック（0.5, 1, 1.5, ... ）
    errors.usedDays = '取得日数は0.5単位で入力してください。';
  }

  // 退職済み社員チェック
  if (data.employeeId) {
    const employee = getEmployees().find((e) => e.id === data.employeeId);
    if (employee && employee.status === 'retired') {
      errors.employeeId = '退職済み社員には有給を登録できません。';
    }
  }

  // 残日数チェック（取得日を基準日として計算）
  if (
    data.employeeId &&
    data.usageDate &&
    days > 0 &&
    !errors.employeeId &&
    !errors.usedDays
  ) {
    const summary = calculateLeaveSummary(data.employeeId, data.usageDate);
    if (summary.activeRemainingDays < days) {
      errors.usedDays = `有給残日数が不足しています。（残 ${summary.activeRemainingDays} 日）`;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// --- window公開 ---
window.validateLoginForm = validateLoginForm;
window.validateEmployeeForm = validateEmployeeForm;
window.validateLeaveUsageForm = validateLeaveUsageForm;
