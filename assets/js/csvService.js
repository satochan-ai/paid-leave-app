/**
 * csvService.js - CSV出力サービス
 *
 * BOM付きUTF-8 / CRLF / RFC 4180準拠のCSV出力を担当する。
 * 管理者専用機能。各関数冒頭で isAdmin() を確認する。
 */

// ─────────────────────────────────────────
// ユーティリティ
// ─────────────────────────────────────────

/**
 * CSV用に値をエスケープする
 * @param {*} value
 * @returns {string}
 */
function escapeCsvValue(value) {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  const escaped = stringValue.replace(/"/g, '""');
  if (
    escaped.includes(',') ||
    escaped.includes('"') ||
    escaped.includes('\n') ||
    escaped.includes('\r')
  ) {
    return `"${escaped}"`;
  }
  return escaped;
}

/**
 * ヘッダー配列と行配列からCSV文字列を生成する
 * @param {string[]} headers
 * @param {any[][]} rows
 * @returns {string}
 */
function arrayToCsv(headers, rows) {
  const lines = [];
  lines.push(headers.map(escapeCsvValue).join(','));
  rows.forEach((row) => {
    lines.push(row.map(escapeCsvValue).join(','));
  });
  return lines.join('\r\n');
}

/**
 * CSVファイルをダウンロードする（BOM付きUTF-8）
 * @param {string} filename
 * @param {string[]} headers
 * @param {any[][]} rows
 */
function downloadCsv(filename, headers, rows) {
  const bom = '﻿';
  const csvContent = arrayToCsv(headers, rows);
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * ファイル名用の日時文字列を返す（YYYYMMDD_HHMMSS）
 * @returns {string}
 */
function formatCsvDateTime() {
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
 * ステータスを日本語表示に変換する
 * @param {string} status
 * @returns {string}
 */
function _statusLabel(status) {
  const map = { active: '在籍', leave: '休職中', retired: '退職' };
  return map[status] || status;
}

/**
 * ファイル名に使えない文字を _ に置換する
 * @param {string} name
 * @returns {string}
 */
function _sanitizeFilename(name) {
  return String(name).replace(/[\\/:*?"<>|]/g, '_');
}

// ─────────────────────────────────────────
// CSV出力1：社員一覧CSV
// ─────────────────────────────────────────

/**
 * 全社員の基本情報をCSV出力する
 */
function exportEmployeesCsv() {
  if (!isAdmin()) {
    alert('CSV出力は管理者のみ利用できます。');
    return;
  }

  const headers = [
    '社員ID', '社員名', 'メールアドレス', '入社日', '退職日',
    'ステータス', '付与区分', '週所定労働日数', '週所定労働時間', '年間所定労働日数',
    '備考', '作成日時', '更新日時',
  ];

  const employees = getAllEmployees();
  const rows = employees.map((emp) => {
    const cond = getDefaultWorkCondition(emp);
    return [
      emp.id,
      emp.name,
      emp.email,
      emp.hireDate,
      emp.retirementDate || '',
      _statusLabel(emp.status),
      getWorkTypeLabel(cond.workType),
      cond.weeklyWorkDays,
      cond.weeklyWorkHours,
      cond.annualWorkDays,
      emp.note || '',
      emp.createdAt || '',
      emp.updatedAt || '',
    ];
  });

  downloadCsv(`employees_${formatCsvDateTime()}.csv`, headers, rows);
}

// ─────────────────────────────────────────
// CSV出力2：有給残日数一覧CSV
// ─────────────────────────────────────────

/**
 * 全社員の有給サマリーをCSV出力する
 */
function exportLeaveSummaryCsv() {
  if (!isAdmin()) {
    alert('CSV出力は管理者のみ利用できます。');
    return;
  }

  const headers = [
    '社員ID', '社員名', 'メールアドレス', 'ステータス', '入社日',
    '付与区分', '週所定労働日数', '週所定労働時間', '年間所定労働日数',
    '総付与日数', '総取得日数', '有効残日数', '失効済み残日数',
    '次回付与日', '次回付与日数', '直近失効日', '直近失効日数',
  ];

  const today = getToday();
  const employees = getAllEmployees();

  const rows = employees.map((emp) => {
    generateLeaveGrantsIfNeeded(emp.id, today);
    const s = calculateLeaveSummary(emp.id, today);
    const cond = getDefaultWorkCondition(emp);
    return [
      emp.id,
      emp.name,
      emp.email,
      _statusLabel(emp.status),
      emp.hireDate,
      getWorkTypeLabel(cond.workType),
      cond.weeklyWorkDays,
      cond.weeklyWorkHours,
      cond.annualWorkDays,
      s.totalGrantedDays,
      s.totalUsedDays,
      s.activeRemainingDays,
      s.expiredRemainingDays,
      s.nextGrantDate || '',
      s.nextGrantDays != null ? s.nextGrantDays : '',
      s.nearestExpireDate || '',
      s.nearestExpireDays > 0 ? s.nearestExpireDays : '',
    ];
  });

  downloadCsv(`leave_summary_${formatCsvDateTime()}.csv`, headers, rows);
}

// ─────────────────────────────────────────
// CSV出力3：有給取得履歴CSV
// ─────────────────────────────────────────

/**
 * 全社員の有給取得履歴をCSV出力する
 */
function exportLeaveUsagesCsv() {
  if (!isAdmin()) {
    alert('CSV出力は管理者のみ利用できます。');
    return;
  }

  const headers = [
    '取得ID', '社員ID', '社員名', 'メールアドレス',
    '取得日', '取得日数', '備考', '登録者ID', '登録日時',
  ];

  const usages = getLeaveUsages().sort((a, b) => {
    if (a.usageDate !== b.usageDate) {
      return a.usageDate > b.usageDate ? -1 : 1;
    }
    const empA = getEmployeeById(a.employeeId);
    const empB = getEmployeeById(b.employeeId);
    const nameA = empA ? empA.name : '';
    const nameB = empB ? empB.name : '';
    return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
  });

  const rows = usages.map((u) => {
    const emp = getEmployeeById(u.employeeId);
    return [
      u.id,
      u.employeeId,
      emp ? emp.name : '',
      emp ? emp.email : '',
      u.usageDate,
      u.usedDays,
      u.note || '',
      u.createdBy || '',
      u.createdAt || '',
    ];
  });

  downloadCsv(`leave_usages_${formatCsvDateTime()}.csv`, headers, rows);
}

// ─────────────────────────────────────────
// CSV出力4：社員別詳細CSV
// ─────────────────────────────────────────

/**
 * 特定社員の基本情報・有給サマリー・付与履歴・取得履歴をCSV出力する
 * @param {string} employeeId
 */
function exportEmployeeDetailCsv(employeeId) {
  if (!isAdmin()) {
    alert('CSV出力は管理者のみ利用できます。');
    return;
  }

  const employee = getEmployeeById(employeeId);
  if (!employee) {
    alert('社員情報が見つかりません。');
    return;
  }

  const today = getToday();
  generateLeaveGrantsIfNeeded(employeeId, today);
  const s = calculateLeaveSummary(employeeId, today);
  const grants = getLeaveGrantHistory(employeeId);
  const usages = getLeaveUsageHistory(employeeId);

  const lines = [];

  const cond = getDefaultWorkCondition(employee);

  // 基本情報
  const basicRows = [
    ['基本情報', '社員ID', employee.id],
    ['基本情報', '社員名', employee.name],
    ['基本情報', 'メールアドレス', employee.email],
    ['基本情報', '入社日', employee.hireDate],
    ['基本情報', '退職日', employee.retirementDate || ''],
    ['基本情報', 'ステータス', _statusLabel(employee.status)],
    ['基本情報', '付与区分', getWorkTypeLabel(cond.workType)],
    ['基本情報', '週所定労働日数', cond.weeklyWorkDays],
    ['基本情報', '週所定労働時間', cond.weeklyWorkHours],
    ['基本情報', '年間所定労働日数', cond.annualWorkDays],
    ['基本情報', '備考', employee.note || ''],
  ];
  lines.push(['セクション', '項目', '値'].map(escapeCsvValue).join(','));
  basicRows.forEach((r) => lines.push(r.map(escapeCsvValue).join(',')));

  // 空行
  lines.push('');

  // 有給サマリー
  const summaryRows = [
    ['有給サマリー', '総付与日数', s.totalGrantedDays],
    ['有給サマリー', '総取得日数', s.totalUsedDays],
    ['有給サマリー', '有効残日数', s.activeRemainingDays],
    ['有給サマリー', '失効済み残日数', s.expiredRemainingDays],
    ['有給サマリー', '次回付与日', s.nextGrantDate || ''],
    ['有給サマリー', '次回付与日数', s.nextGrantDays != null ? s.nextGrantDays : ''],
    ['有給サマリー', '直近失効日', s.nearestExpireDate || ''],
    ['有給サマリー', '直近失効日数', s.nearestExpireDays > 0 ? s.nearestExpireDays : ''],
  ];
  summaryRows.forEach((r) => lines.push(r.map(escapeCsvValue).join(',')));

  // 空行
  lines.push('');

  // 付与履歴ヘッダー
  lines.push(
    ['付与履歴', '付与日', '付与日数', '使用済み日数', '残日数', '失効日', '状態']
      .map(escapeCsvValue).join(',')
  );
  grants.forEach((g) => {
    const expired = isExpired(g.expireDate, today);
    lines.push(
      ['付与履歴', g.grantDate, g.grantedDays, g.usedDays, g.remainingDays, g.expireDate, expired ? '失効済み' : '未失効']
        .map(escapeCsvValue).join(',')
    );
  });

  // 空行
  lines.push('');

  // 取得履歴ヘッダー
  lines.push(
    ['取得履歴', '取得日', '取得日数', '備考', '登録日時']
      .map(escapeCsvValue).join(',')
  );
  usages.forEach((u) => {
    lines.push(
      ['取得履歴', u.usageDate, u.usedDays, u.note || '', u.createdAt || '']
        .map(escapeCsvValue).join(',')
    );
  });

  const csvContent = lines.join('\r\n');
  const bom = '﻿';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `employee_detail_${_sanitizeFilename(employee.name)}_${formatCsvDateTime()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────
// CSV出力5：有給申請履歴CSV
// ─────────────────────────────────────────

/**
 * 有給申請履歴をCSV出力する（管理者専用）
 * 並び順：申請日降順 → 取得希望日降順 → 社員名昇順
 */
function exportLeaveRequestsCsv() {
  if (!isAdmin()) {
    alert('CSV出力は管理者のみ利用できます。');
    return;
  }

  const headers = [
    '申請ID', '社員ID', '社員名', 'メールアドレス',
    '申請日', '取得希望日', '取得日数', '申請理由', 'ステータス',
    '承認者ID', '承認日時', '却下者ID', '却下日時', '却下理由',
    '作成日時', '更新日時',
  ];

  const requests = getLeaveRequests().sort((a, b) => {
    // 申請日降順
    if (a.requestDate !== b.requestDate) return a.requestDate > b.requestDate ? -1 : 1;
    // 取得希望日降順
    if (a.usageDate !== b.usageDate) return a.usageDate > b.usageDate ? -1 : 1;
    // 社員名昇順
    const empA = getEmployeeById(a.employeeId);
    const empB = getEmployeeById(b.employeeId);
    const nameA = empA ? empA.name : '';
    const nameB = empB ? empB.name : '';
    return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
  });

  const rows = requests.map((r) => {
    const emp = getEmployeeById(r.employeeId);
    // ステータスラベル（leaveRequestService.js が読まれていれば使用、なければフォールバック）
    const statusLabel = typeof getLeaveRequestStatusLabel === 'function'
      ? getLeaveRequestStatusLabel(r.status)
      : r.status;
    return [
      r.id,
      r.employeeId,
      emp ? emp.name : '不明',
      emp ? emp.email : '',
      r.requestDate   || '',
      r.usageDate     || '',
      r.usedDays,
      r.reason        || '',
      statusLabel,
      r.approvedBy    || '',
      r.approvedAt    || '',
      r.rejectedBy    || '',
      r.rejectedAt    || '',
      r.rejectReason  || '',
      r.createdAt     || '',
      r.updatedAt     || '',
    ];
  });

  downloadCsv(`leave_requests_${formatCsvDateTime()}.csv`, headers, rows);
}

// ─────────────────────────────────────────
// window公開
// ─────────────────────────────────────────

window.escapeCsvValue = escapeCsvValue;
window.arrayToCsv = arrayToCsv;
window.downloadCsv = downloadCsv;
window.formatCsvDateTime = formatCsvDateTime;
window.exportEmployeesCsv = exportEmployeesCsv;
window.exportLeaveSummaryCsv = exportLeaveSummaryCsv;
window.exportLeaveUsagesCsv = exportLeaveUsagesCsv;
window.exportEmployeeDetailCsv = exportEmployeeDetailCsv;
window.exportLeaveRequestsCsv = exportLeaveRequestsCsv;
