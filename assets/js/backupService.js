/**
 * backupService.js - バックアップ / 復元サービス
 *
 * localStorageの paidLeave_ 系データをJSONでバックアップ・復元する。
 * 管理者専用機能。各関数冒頭で isAdmin() を確認する。
 */

const BACKUP_VERSION = '1.0.0';
const BACKUP_APP_NAME = 'paid-leave-app';

// バックアップ対象キー（currentUser は除外）
const BACKUP_TARGET_KEYS = [
  'paidLeave_users',
  'paidLeave_employees',
  'paidLeave_leaveGrants',
  'paidLeave_leaveUsages',
  'paidLeave_leaveOfAbsences',
  'paidLeave_leaveRequests',
];

/**
 * バックアップファイル名用の日時文字列を返す（YYYYMMDD_HHMMSS）
 * @returns {string}
 */
function formatBackupDateTime() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    '_' +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

/**
 * バックアップ用JSONオブジェクトを作成する
 * @returns {object}
 */
function getBackupData() {
  return {
    appName: BACKUP_APP_NAME,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      users: getUsers(),
      employees: getEmployees(),
      leaveGrants: getLeaveGrants(),
      leaveUsages: getLeaveUsages(),
      leaveOfAbsences: getLeaveOfAbsences(),
      leaveRequests: getLeaveRequests(),
    },
  };
}

/**
 * バックアップデータをJSONファイルとしてダウンロードする
 */
function downloadBackupJson() {
  if (!isAdmin()) {
    alert('バックアップは管理者のみ利用できます。');
    return;
  }

  const backupData = getBackupData();
  const jsonContent = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `paid_leave_backup_${formatBackupDateTime()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * バックアップファイルの形式を検証する
 * @param {any} data
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateBackupData(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    errors.push('バックアップファイルの形式が正しくありません。');
    return { valid: false, errors };
  }

  if (data.appName !== BACKUP_APP_NAME) {
    errors.push('バックアップファイルの形式が正しくありません。');
  }

  if (!data.data || typeof data.data !== 'object') {
    errors.push('バックアップファイルの形式が正しくありません。');
    return { valid: false, errors };
  }

  // leaveRequests は古いバックアップには含まれない場合があるため必須チェックから除外
  const requiredArrays = ['users', 'employees', 'leaveGrants', 'leaveUsages', 'leaveOfAbsences'];
  requiredArrays.forEach((key) => {
    if (!Array.isArray(data.data[key])) {
      errors.push('バックアップファイルの形式が正しくありません。');
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * バックアップJSONからlocalStorageへデータを復元する
 * @param {object} data - パース済みJSONオブジェクト
 * @returns {{ success: boolean, message?: string }}
 */
function restoreBackupData(data) {
  if (!isAdmin()) {
    alert('復元は管理者のみ利用できます。');
    return { success: false, message: '権限がありません。' };
  }

  const validation = validateBackupData(data);
  if (!validation.valid) {
    return { success: false, message: validation.errors[0] || '復元に失敗しました。' };
  }

  if (!confirm('バックアップデータを復元します。現在のデータは上書きされます。よろしいですか？')) {
    return { success: false, message: 'キャンセルされました。' };
  }

  try {
    saveUsers(data.data.users);
    saveEmployees(data.data.employees);
    saveLeaveGrants(data.data.leaveGrants);
    saveLeaveUsages(data.data.leaveUsages);
    saveLeaveOfAbsences(data.data.leaveOfAbsences);
    // 古いバックアップには leaveRequests が存在しない場合があるため空配列でフォールバック
    saveLeaveRequests(Array.isArray(data.data.leaveRequests) ? data.data.leaveRequests : []);

    // currentUser を削除してログイン画面へ戻す
    removeCurrentUserFromStorage();

    // /pages/admin/ 配下からの復元を考慮（GitHub Pages対応）
    const path = location.pathname;
    const prefix = (path.includes('/pages/admin/') || path.includes('/pages/employee/')) ? '../../' : '';
    location.href = prefix + 'index.html';

    return { success: true };
  } catch (e) {
    return { success: false, message: '復元に失敗しました。' };
  }
}

/**
 * ファイル選択されたJSONを読み込み、復元処理へ渡す
 * @param {File} file
 */
function handleBackupFileImport(file) {
  if (!file) {
    showBackupMessage('復元するJSONファイルを選択してください。', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const parsed = JSON.parse(e.target.result);
      const result = restoreBackupData(parsed);
      if (!result.success && result.message && result.message !== 'キャンセルされました。') {
        showBackupMessage(result.message, 'error');
      }
    } catch (_) {
      showBackupMessage('JSONファイルの読み込みに失敗しました。', 'error');
    }
  };
  reader.onerror = function () {
    showBackupMessage('JSONファイルの読み込みに失敗しました。', 'error');
  };
  reader.readAsText(file, 'UTF-8');
}

// ─────────────────────────────────────────
// window公開
// ─────────────────────────────────────────

window.formatBackupDateTime = formatBackupDateTime;
window.getBackupData = getBackupData;
window.downloadBackupJson = downloadBackupJson;
window.validateBackupData = validateBackupData;
window.restoreBackupData = restoreBackupData;
window.handleBackupFileImport = handleBackupFileImport;
