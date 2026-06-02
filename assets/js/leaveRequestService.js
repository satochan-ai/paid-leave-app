/**
 * leaveRequestService.js - 有給申請・承認・却下処理
 *
 * 有給申請（leaveRequests）のCRUDおよびビジネスロジックを担当する。
 * 申請時は残日数を変更しない。承認時のみ有給取得履歴へ反映する。
 */

/**
 * 有給申請を作成する（社員が申請）
 * @param {string} employeeId
 * @param {string} usageDate  - YYYY-MM-DD
 * @param {number|string} usedDays
 * @param {string} reason
 * @returns {{ success: boolean, request?: object, message?: string, errors?: object }}
 */
function createLeaveRequest(employeeId, usageDate, usedDays, reason) {
  const data = { employeeId, usageDate, usedDays, reason };
  const validation = validateLeaveRequestForm(data);
  if (!validation.valid) {
    return {
      success: false,
      message: Object.values(validation.errors).join(' / '),
      errors: validation.errors,
    };
  }

  const now = new Date().toISOString();
  const request = {
    id: generateId('request'),
    employeeId,
    requestDate: getToday(),
    usageDate,
    usedDays: toNumber(usedDays),
    reason: reason || '',
    status: 'pending',
    approvedBy: '',
    approvedAt: '',
    rejectedBy: '',
    rejectedAt: '',
    rejectReason: '',
    cancelledBy: '',
    cancelledAt: '',
    createdAt: now,
    updatedAt: now,
  };

  const requests = getLeaveRequests();
  requests.push(request);
  saveLeaveRequests(requests);

  return { success: true, request };
}

/**
 * 特定社員の申請一覧を返す（申請日降順）
 * @param {string} employeeId
 * @returns {Array}
 */
function getLeaveRequestsByEmployeeId(employeeId) {
  return getLeaveRequests()
    .filter((r) => r.employeeId === employeeId)
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
}

/**
 * 全申請を返す（申請日降順）
 * @returns {Array}
 */
function getAllLeaveRequests() {
  return getLeaveRequests().sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
}

/**
 * IDで申請を返す
 * @param {string} requestId
 * @returns {object|null}
 */
function getLeaveRequestById(requestId) {
  return getLeaveRequests().find((r) => r.id === requestId) || null;
}

/**
 * 申請を承認し、有給取得履歴へ反映する（管理者が実行）
 * @param {string} requestId
 * @returns {{ success: boolean, request?: object, message?: string }}
 */
function approveLeaveRequest(requestId) {
  const requests = getLeaveRequests();
  const idx = requests.findIndex((r) => r.id === requestId);
  if (idx === -1) {
    return { success: false, message: '申請が見つかりません。' };
  }

  const request = requests[idx];
  if (request.status !== 'pending') {
    return { success: false, message: 'この申請はすでに処理済みです。' };
  }

  // 承認時に有給取得履歴へ反映
  const result = registerLeaveUsage(
    request.employeeId,
    request.usageDate,
    request.usedDays,
    request.reason || '有給申請（承認）'
  );

  if (!result.success) {
    return { success: false, message: result.message || '有給取得登録に失敗しました。' };
  }

  // 申請ステータスを承認済みに更新
  const approver = getCurrentUser();
  const now = new Date().toISOString();
  requests[idx] = {
    ...request,
    status: 'approved',
    approvedBy: approver ? approver.id : '',
    approvedAt: now,
    updatedAt: now,
  };
  saveLeaveRequests(requests);

  return { success: true, request: requests[idx] };
}

/**
 * 申請を却下する（管理者が実行）
 * @param {string} requestId
 * @param {string} rejectReason
 * @returns {{ success: boolean, request?: object, message?: string }}
 */
function rejectLeaveRequest(requestId, rejectReason) {
  const requests = getLeaveRequests();
  const idx = requests.findIndex((r) => r.id === requestId);
  if (idx === -1) {
    return { success: false, message: '申請が見つかりません。' };
  }

  const request = requests[idx];
  if (request.status !== 'pending') {
    return { success: false, message: 'この申請はすでに処理済みです。' };
  }

  const rejecter = getCurrentUser();
  const now = new Date().toISOString();
  requests[idx] = {
    ...request,
    status: 'rejected',
    rejectReason: rejectReason || '',
    rejectedBy: rejecter ? rejecter.id : '',
    rejectedAt: now,
    updatedAt: now,
  };
  saveLeaveRequests(requests);

  return { success: true, request: requests[idx] };
}

/**
 * 申請を取り消す（社員本人または管理者が実行）
 * 取消できるのは pending の申請のみ。取消時は残日数を変更しない。
 * @param {string} requestId
 * @returns {{ success: boolean, request?: object, message?: string }}
 */
function cancelLeaveRequest(requestId) {
  const requests = getLeaveRequests();
  const idx = requests.findIndex((r) => r.id === requestId);
  if (idx === -1) {
    return { success: false, message: '申請が見つかりません。' };
  }

  const request = requests[idx];
  if (request.status !== 'pending') {
    return { success: false, message: '申請中の申請のみ取り消せます。' };
  }

  // 権限チェック：社員は自分の申請のみ取消可能
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.role === 'employee') {
    if (currentUser.employeeId !== request.employeeId) {
      return { success: false, message: '他の社員の申請は取り消せません。' };
    }
  }

  const now = new Date().toISOString();
  requests[idx] = {
    ...request,
    status: 'cancelled',
    cancelledBy: currentUser ? currentUser.id : '',
    cancelledAt: now,
    updatedAt: now,
  };
  saveLeaveRequests(requests);

  return { success: true, request: requests[idx] };
}

/**
 * 申請ステータスのラベルを返す
 * @param {string} status
 * @returns {string}
 */
function getLeaveRequestStatusLabel(status) {
  const map = {
    pending:   '申請中',
    approved:  '承認済み',
    rejected:  '却下',
    cancelled: '取消',
  };
  return map[status] || status;
}

/**
 * 申請ステータスのバッジCSSクラスを返す
 * @param {string} status
 * @returns {string}
 */
function getLeaveRequestStatusBadgeClass(status) {
  const map = {
    pending:   'badge-pending',
    approved:  'badge-approved',
    rejected:  'badge-rejected',
    cancelled: 'badge-cancelled',
  };
  return map[status] || '';
}

/**
 * 未承認申請数（pending）を返す
 * @returns {number}
 */
function getPendingLeaveRequestCount() {
  return getLeaveRequests().filter((r) => r.status === 'pending').length;
}

// ─────────────────────────────────────────
// window公開
// ─────────────────────────────────────────
window.createLeaveRequest             = createLeaveRequest;
window.getLeaveRequestsByEmployeeId   = getLeaveRequestsByEmployeeId;
window.getAllLeaveRequests             = getAllLeaveRequests;
window.getLeaveRequestById            = getLeaveRequestById;
window.approveLeaveRequest            = approveLeaveRequest;
window.rejectLeaveRequest             = rejectLeaveRequest;
window.cancelLeaveRequest             = cancelLeaveRequest;
window.getLeaveRequestStatusLabel     = getLeaveRequestStatusLabel;
window.getLeaveRequestStatusBadgeClass= getLeaveRequestStatusBadgeClass;
window.getPendingLeaveRequestCount    = getPendingLeaveRequestCount;
