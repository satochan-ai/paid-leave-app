/**
 * app.js - アプリ全体の初期化 + 画面描画
 *
 * 全ページに読み込まれる共通スクリプト。
 * 初期データ投入・共通イベント設定・ページ別描画を担当する。
 */

// ─────────────────────────────────────────
// 共通初期化
// ─────────────────────────────────────────

function initializeApp() {
  initializeSeedData();
  bindLogoutButtons();
  updateHeaderUserName();
}

function bindLogoutButtons() {
  document.querySelectorAll('[data-action="logout"]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  });
}

function updateHeaderUserName() {
  const el = document.getElementById('headerUserName');
  if (!el) return;
  const user = getCurrentUser();
  if (user) el.textContent = user.name;
}

function handleLogout() {
  logout();
}

// ─────────────────────────────────────────
// ログイン画面
// ─────────────────────────────────────────

function initLoginPage() {
  if (isLoggedIn()) {
    redirectByRole();
    return;
  }
  const form = document.getElementById('loginForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');
    const result = login(email, password);
    if (result.success) {
      redirectByRole();
    } else {
      errorEl.textContent = result.message;
      errorEl.style.display = 'block';
    }
  });
}

// ─────────────────────────────────────────
// ユーティリティ（描画共通）
// ─────────────────────────────────────────

function getStatusLabel(status) {
  const map = { active: '在籍', leave: '休職中', retired: '退職' };
  return map[status] || status;
}

function getStatusBadgeClass(status) {
  const map = { active: 'badge-active', leave: 'badge-leave', retired: 'badge-retired' };
  return map[status] || '';
}

/** 指定日が今日から days 日以内かどうかを判定する */
function isWithinDays(dateString, days) {
  if (!dateString) return false;
  const today = new Date(getToday());
  const target = new Date(dateString);
  const diff = (target - today) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= days;
}

/** XSS対策：文字列をエスケープする */
function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─────────────────────────────────────────
// 管理者ダッシュボード
// ─────────────────────────────────────────

function renderAdminDashboard() {
  const today = getToday();
  const employees = getAllEmployees();

  const total = employees.length;
  const active = employees.filter((e) => e.status === 'active').length;
  const leave = employees.filter((e) => e.status === 'leave').length;
  const retired = employees.filter((e) => e.status === 'retired').length;

  // 全社員の有給残日数合計 & 失効予定カウント
  let totalRemaining = 0;
  let expiringCount = 0;
  const expiringList = [];

  employees.forEach((emp) => {
    generateLeaveGrantsIfNeeded(emp.id, today);
    const summary = calculateLeaveSummary(emp.id, today);
    totalRemaining += summary.activeRemainingDays;
    if (
      summary.nearestExpireDate &&
      isWithinDays(summary.nearestExpireDate, 30) &&
      summary.nearestExpireDays > 0
    ) {
      expiringCount++;
      expiringList.push({ employee: emp, summary });
    }
  });

  // KPIカード描画
  const statsContainer = document.getElementById('statsContainer');
  if (statsContainer) {
    statsContainer.innerHTML = [
      { label: '社員数', value: total, unit: '名', cls: '' },
      { label: '在籍社員数', value: active, unit: '名', cls: '' },
      { label: '休職中社員数', value: leave, unit: '名', cls: 'warning' },
      { label: '退職者数', value: retired, unit: '名', cls: '' },
      { label: '有給残日数合計', value: totalRemaining, unit: '日', cls: '' },
      { label: '失効予定（30日以内）', value: expiringCount, unit: '名', cls: expiringCount > 0 ? 'danger' : '' },
    ]
      .map(
        (c) => `
      <div class="stat-card ${c.cls}">
        <div class="card-title">${esc(c.label)}</div>
        <div class="card-value">${c.value}<span class="card-unit">${esc(c.unit)}</span></div>
      </div>`
      )
      .join('');
  }

  // 失効予定テーブル
  const tbody = document.getElementById('expiringTableBody');
  if (tbody) {
    if (expiringList.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-row">失効予定の有給はありません</td></tr>';
    } else {
      tbody.innerHTML = expiringList
        .map(
          ({ employee, summary }) => `
        <tr>
          <td>${esc(employee.name)}</td>
          <td>${esc(summary.nearestExpireDate)}</td>
          <td><strong>${summary.nearestExpireDays}</strong> 日</td>
          <td><a href="employee-detail.html?id=${esc(employee.id)}" class="btn btn-outline btn-sm">詳細</a></td>
        </tr>`
        )
        .join('');
    }
  }
}

// ─────────────────────────────────────────
// 社員一覧
// ─────────────────────────────────────────

function renderEmployeeListPage() {
  const today = getToday();

  // 初回描画
  _renderEmployeeTable(getAllEmployees(), today);

  // 検索・フィルター
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const searchBtn = document.getElementById('searchBtn');

  function doSearch() {
    const keyword = searchInput ? searchInput.value : '';
    const status = statusFilter ? statusFilter.value : '';
    const filtered = searchEmployees(keyword, status === 'all' ? '' : status);
    _renderEmployeeTable(filtered, today);
  }

  if (searchBtn) searchBtn.addEventListener('click', doSearch);
  if (searchInput) searchInput.addEventListener('input', doSearch);
  if (statusFilter) statusFilter.addEventListener('change', doSearch);
}

function _renderEmployeeTable(employees, today) {
  const tbody = document.getElementById('employeeTableBody');
  if (!tbody) return;

  if (employees.length === 0) {
    tbody.innerHTML = '<tr><td colspan="12" class="empty-row">社員が見つかりません</td></tr>';
    return;
  }

  tbody.innerHTML = employees
    .map((emp) => {
      generateLeaveGrantsIfNeeded(emp.id, today);
      const s = calculateLeaveSummary(emp.id, today);
      const remainingClass = s.activeRemainingDays <= 5 ? 'text-danger' : s.activeRemainingDays <= 10 ? 'text-warning' : '';
      return `
      <tr>
        <td><strong>${esc(emp.name)}</strong></td>
        <td class="text-muted">${esc(emp.email)}</td>
        <td>${esc(emp.hireDate)}</td>
        <td><span class="badge ${esc(getStatusBadgeClass(emp.status))}">${esc(getStatusLabel(emp.status))}</span></td>
        <td>${s.totalGrantedDays} 日</td>
        <td>${s.totalUsedDays} 日</td>
        <td><span class="remaining-days ${remainingClass}">${s.activeRemainingDays} 日</span></td>
        <td>${esc(s.nextGrantDate || '—')}</td>
        <td>${s.nextGrantDays != null ? s.nextGrantDays + ' 日' : '—'}</td>
        <td>${s.nearestExpireDate ? esc(s.nearestExpireDate) : '—'}</td>
        <td>${s.nearestExpireDays > 0 ? s.nearestExpireDays + ' 日' : '—'}</td>
        <td class="action-cell">
          <a href="employee-detail.html?id=${esc(emp.id)}" class="btn btn-outline btn-sm">詳細</a>
          <a href="employee-form.html?id=${esc(emp.id)}" class="btn btn-outline btn-sm">編集</a>
          <button class="btn btn-danger btn-sm" onclick="handleDeleteEmployee('${esc(emp.id)}')">退職扱い</button>
        </td>
      </tr>`;
    })
    .join('');
}

function handleDeleteEmployee(id) {
  if (!confirm('この社員を退職扱いにしますか？')) return;
  const result = deleteEmployee(id);
  if (result.success) {
    const today = getToday();
    const keyword = document.getElementById('searchInput') ? document.getElementById('searchInput').value : '';
    const status = document.getElementById('statusFilter') ? document.getElementById('statusFilter').value : '';
    const filtered = searchEmployees(keyword, status === 'all' ? '' : status);
    _renderEmployeeTable(filtered, today);
  } else {
    alert(result.message || '退職扱いに失敗しました。');
  }
}

// ─────────────────────────────────────────
// 社員詳細
// ─────────────────────────────────────────

function renderEmployeeDetailPage() {
  const empId = getQueryParam('id');
  const today = getToday();

  if (!empId) {
    _showDetailError('社員情報が見つかりません。');
    return;
  }

  const employee = getEmployeeById(empId);
  if (!employee) {
    _showDetailError('社員情報が見つかりません。');
    return;
  }

  // 付与を最新化
  generateLeaveGrantsIfNeeded(empId, today);

  // ページタイトル
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = employee.name + ' の詳細';

  // 操作ボタンのリンクを設定
  const editBtn = document.getElementById('editBtn');
  const leaveBtn = document.getElementById('leaveRegisterBtn');
  const backBtn = document.getElementById('backBtn');
  if (editBtn) editBtn.href = `employee-form.html?id=${empId}`;
  if (leaveBtn) leaveBtn.href = `leave-usage-form.html?employeeId=${empId}`;
  if (backBtn) backBtn.href = 'employees.html';

  renderEmployeeBasicInfo(employee);
  renderEmployeeLeaveSummary(empId, today);
  renderLeaveGrantTable(empId, today);
  renderLeaveUsageTable(empId);
}

function _showDetailError(message) {
  // 専用エラーエリアに表示し、既存のDOM構造は破壊しない
  let errEl = document.getElementById('detailError');
  if (!errEl) {
    errEl = document.createElement('div');
    errEl.id = 'detailError';
    const content = document.getElementById('detailContent');
    if (content) content.prepend(errEl);
  }
  errEl.className = 'alert alert-error';
  errEl.textContent = message;
}

function renderEmployeeBasicInfo(employee) {
  const el = document.getElementById('employeeInfo');
  if (!el) return;
  const fields = [
    { label: '社員名', value: employee.name },
    { label: 'メールアドレス', value: employee.email },
    { label: '入社日', value: employee.hireDate },
    { label: '退職日', value: employee.retirementDate || '—' },
    { label: 'ステータス', value: `<span class="badge ${getStatusBadgeClass(employee.status)}">${getStatusLabel(employee.status)}</span>` },
    { label: '備考', value: employee.note || '—' },
  ];
  el.innerHTML = fields
    .map(
      (f) => `
    <div class="info-item">
      <label>${esc(f.label)}</label>
      <p>${f.value.includes('<span') ? f.value : esc(f.value)}</p>
    </div>`
    )
    .join('');
}

function renderEmployeeLeaveSummary(empId, today) {
  const el = document.getElementById('leaveSummary');
  if (!el) return;
  const s = calculateLeaveSummary(empId, today || getToday());
  const cards = [
    { label: '総付与日数', value: s.totalGrantedDays, unit: '日' },
    { label: '総取得日数', value: s.totalUsedDays, unit: '日' },
    { label: '有給残日数', value: s.activeRemainingDays, unit: '日', highlight: true },
    { label: '失効済み残日数', value: s.expiredRemainingDays, unit: '日' },
    { label: '次回付与日', value: s.nextGrantDate || '—', unit: '' },
    { label: '次回付与日数', value: s.nextGrantDays != null ? s.nextGrantDays : '—', unit: s.nextGrantDays != null ? '日' : '' },
    { label: '直近失効日', value: s.nearestExpireDate || '—', unit: '' },
    { label: '直近失効日数', value: s.nearestExpireDays > 0 ? s.nearestExpireDays : '—', unit: s.nearestExpireDays > 0 ? '日' : '' },
  ];
  el.innerHTML = cards
    .map(
      (c) => `
    <div class="card ${c.highlight ? 'card-highlight' : ''}">
      <div class="card-title">${esc(c.label)}</div>
      <div class="card-value">${esc(String(c.value))}<span class="card-unit">${esc(c.unit)}</span></div>
    </div>`
    )
    .join('');
}

function renderLeaveGrantTable(empId, today) {
  const tbody = document.getElementById('grantHistoryBody');
  if (!tbody) return;
  const today2 = today || getToday();
  const grants = getLeaveGrantHistory(empId);
  if (grants.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-row">付与履歴はありません</td></tr>';
    return;
  }
  tbody.innerHTML = grants
    .map((g) => {
      const expired = isExpired(g.expireDate, today2);
      return `
      <tr class="${expired ? 'row-expired' : ''}">
        <td>${esc(g.grantDate)}</td>
        <td>${g.grantedDays} 日</td>
        <td>${g.usedDays} 日</td>
        <td>${g.remainingDays} 日</td>
        <td>${esc(g.expireDate)}</td>
        <td><span class="badge ${expired ? 'badge-retired' : 'badge-active'}">${expired ? '失効済み' : '未失効'}</span></td>
      </tr>`;
    })
    .join('');
}

function renderLeaveUsageTable(empId) {
  const tbody = document.getElementById('usageHistoryBody');
  if (!tbody) return;
  const usages = getLeaveUsageHistory(empId);
  if (usages.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-row">取得履歴はありません</td></tr>';
    return;
  }
  tbody.innerHTML = usages
    .map(
      (u) => `
    <tr>
      <td>${esc(u.usageDate)}</td>
      <td>${u.usedDays} 日</td>
      <td>${esc(u.note || '—')}</td>
      <td>${esc(u.createdAt)}</td>
    </tr>`
    )
    .join('');
}

// ─────────────────────────────────────────
// フォーム共通ユーティリティ
// ─────────────────────────────────────────

/** フィールドエラーを描画する */
function renderFieldErrors(errors) {
  // まず全クリア
  clearFieldErrors();
  Object.keys(errors).forEach((field) => {
    const input = document.getElementById(field) || document.querySelector(`[name="${field}"]`);
    if (input) input.classList.add('is-invalid');
    const errEl = document.getElementById(field + 'Error');
    if (errEl) {
      errEl.textContent = errors[field];
      errEl.style.display = 'block';
    }
  });
}

/** フィールドエラーを全クリアする */
function clearFieldErrors() {
  document.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  document.querySelectorAll('.field-error').forEach((el) => {
    el.textContent = '';
    el.style.display = 'none';
  });
  document.querySelectorAll('[id$="Error"]').forEach((el) => {
    if (el.classList.contains('invalid-feedback') || el.classList.contains('field-error')) {
      el.textContent = '';
      el.style.display = 'none';
    }
  });
}

/** フォーム上部にアラートを表示する */
function showFormAlert(message, type) {
  type = type || 'error';
  let el = document.getElementById('formAlert');
  if (!el) {
    el = document.createElement('div');
    el.id = 'formAlert';
    const form = document.querySelector('form');
    if (form) form.prepend(el);
  }
  el.className = `alert alert-${type}`;
  el.textContent = message;
  el.style.display = 'block';
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/** フォームアラートをクリアする */
function clearFormAlert() {
  const el = document.getElementById('formAlert');
  if (el) {
    el.textContent = '';
    el.style.display = 'none';
  }
}

// ─────────────────────────────────────────
// 社員追加・編集フォーム
// ─────────────────────────────────────────

function renderEmployeeFormPage() {
  const empId = getQueryParam('id');
  const isEdit = !!empId;

  // タイトル切り替え
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = isEdit ? '社員編集' : '社員追加';

  // キャンセルリンクの設定
  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) {
    cancelBtn.href = isEdit ? `employee-detail.html?id=${empId}` : 'employees.html';
  }

  // 編集モード：初期値を埋める
  if (isEdit) {
    const employee = getEmployeeById(empId);
    if (!employee) {
      showFormAlert('社員情報が見つかりません。', 'error');
      return;
    }
    // 紐づくユーザーを取得
    const user = getUsers().find((u) => u.employeeId === empId) || {};
    setEmployeeFormValues(employee, user);
  }

  // フォームsubmitイベント（二重登録防止）
  const form = document.getElementById('employeeForm');
  if (form && !form.dataset.bound) {
    form.dataset.bound = '1';
    form.addEventListener('submit', (e) => handleEmployeeFormSubmit(e, empId));
  }
}

/** フォームに初期値をセットする */
function setEmployeeFormValues(employee, user) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = val || '';
  };
  set('name', employee.name);
  set('email', employee.email);
  set('password', user.password || '');
  set('role', user.role || 'employee');
  set('hireDate', employee.hireDate);
  set('retirementDate', employee.retirementDate || '');
  set('status', employee.status || 'active');
  set('note', employee.note || '');
}

/** フォームの入力値をオブジェクトで返す */
function getEmployeeFormData() {
  const val = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  };
  return {
    name: val('name'),
    email: val('email'),
    password: document.getElementById('password') ? document.getElementById('password').value : '',
    role: val('role'),
    hireDate: val('hireDate'),
    retirementDate: val('retirementDate'),
    status: val('status'),
    note: val('note'),
  };
}

/** 社員フォームのsubmitハンドラ */
function handleEmployeeFormSubmit(e, empId) {
  e.preventDefault();
  clearFieldErrors();
  clearFormAlert();

  const isEdit = !!empId;
  const data = getEmployeeFormData();

  // バリデーション
  const validation = validateEmployeeForm(data, {
    mode: isEdit ? 'edit' : 'create',
    employeeId: empId || null,
  });

  if (!validation.valid) {
    renderFieldErrors(validation.errors);
    showFormAlert('入力内容を確認してください。', 'error');
    return;
  }

  let result;
  if (isEdit) {
    result = updateEmployee(empId, data);
  } else {
    result = createEmployee(data);
  }

  if (!result.success) {
    showFormAlert(result.message || '保存に失敗しました。', 'error');
    return;
  }

  const savedId = isEdit ? empId : result.employee.id;
  location.href = `employee-detail.html?id=${savedId}`;
}

// ─────────────────────────────────────────
// 有給取得登録フォーム
// ─────────────────────────────────────────

function renderLeaveUsageFormPage() {
  const empId = getQueryParam('employeeId');
  const today = getToday();

  // 戻る・キャンセルリンクの設定
  const backBtn = document.getElementById('backBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  if (backBtn) backBtn.href = empId ? `employee-detail.html?id=${empId}` : 'employees.html';
  if (cancelBtn) cancelBtn.href = empId ? `employee-detail.html?id=${empId}` : 'employees.html';

  if (!empId) {
    showFormAlert('社員情報が見つかりません。', 'error');
    return;
  }

  const employee = getEmployeeById(empId);
  if (!employee) {
    showFormAlert('社員情報が見つかりません。', 'error');
    return;
  }

  // 付与を最新化
  generateLeaveGrantsIfNeeded(empId, today);
  const summary = calculateLeaveSummary(empId, today);

  // 対象社員情報を描画
  const infoEl = document.getElementById('targetEmployeeInfo');
  if (infoEl) {
    infoEl.innerHTML = `
      <div class="target-info-grid">
        <div class="info-item"><label>社員名</label><p>${esc(employee.name)}</p></div>
        <div class="info-item"><label>メールアドレス</label><p>${esc(employee.email)}</p></div>
        <div class="info-item"><label>入社日</label><p>${esc(employee.hireDate)}</p></div>
        <div class="info-item">
          <label>現在の有給残日数</label>
          <p class="remaining-highlight">${summary.activeRemainingDays} 日</p>
        </div>
        <div class="info-item"><label>直近失効日</label><p>${esc(summary.nearestExpireDate || '—')}</p></div>
        <div class="info-item"><label>直近失効日数</label><p>${summary.nearestExpireDays > 0 ? summary.nearestExpireDays + ' 日' : '—'}</p></div>
      </div>`;
  }

  // 取得日の初期値を今日にする
  const usageDateEl = document.getElementById('usageDate');
  if (usageDateEl && !usageDateEl.value) usageDateEl.value = today;

  // フォームsubmit（二重登録防止）
  const form = document.getElementById('leaveUsageForm');
  if (form && !form.dataset.bound) {
    form.dataset.bound = '1';
    form.addEventListener('submit', (e) => handleLeaveUsageFormSubmit(e, empId));
  }
}

/** 有給取得フォームの入力値を返す */
function getLeaveUsageFormData(empId) {
  return {
    employeeId: empId,
    usageDate: document.getElementById('usageDate') ? document.getElementById('usageDate').value : '',
    usedDays: document.getElementById('usedDays') ? document.getElementById('usedDays').value : '',
    note: document.getElementById('note') ? document.getElementById('note').value.trim() : '',
  };
}

/** 有給取得フォームのsubmitハンドラ */
function handleLeaveUsageFormSubmit(e, empId) {
  e.preventDefault();
  clearFieldErrors();
  clearFormAlert();

  const data = getLeaveUsageFormData(empId);

  // バリデーション
  const validation = validateLeaveUsageForm(data);
  if (!validation.valid) {
    renderFieldErrors(validation.errors);
    showFormAlert('入力内容を確認してください。', 'error');
    return;
  }

  const result = registerLeaveUsage(
    empId,
    data.usageDate,
    toNumber(data.usedDays),
    data.note
  );

  if (!result.success) {
    showFormAlert(result.message || '登録に失敗しました。', 'error');
    return;
  }

  location.href = `employee-detail.html?id=${empId}`;
}

// ─────────────────────────────────────────
// window 公開
// ─────────────────────────────────────────

window.initializeApp = initializeApp;
window.renderEmployeeFormPage = renderEmployeeFormPage;
window.renderLeaveUsageFormPage = renderLeaveUsageFormPage;
window.handleLogout = handleLogout;
window.initLoginPage = initLoginPage;
window.renderAdminDashboard = renderAdminDashboard;
window.renderEmployeeListPage = renderEmployeeListPage;
window.renderEmployeeDetailPage = renderEmployeeDetailPage;
window.renderEmployeeBasicInfo = renderEmployeeBasicInfo;
window.renderEmployeeLeaveSummary = renderEmployeeLeaveSummary;
window.renderLeaveGrantTable = renderLeaveGrantTable;
window.renderLeaveUsageTable = renderLeaveUsageTable;
window.handleDeleteEmployee = handleDeleteEmployee;
window.getStatusLabel = getStatusLabel;
window.getStatusBadgeClass = getStatusBadgeClass;
window.isWithinDays = isWithinDays;

document.addEventListener('DOMContentLoaded', initializeApp);
