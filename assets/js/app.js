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
// 有給付与チェック
// ─────────────────────────────────────────

/**
 * 全社員付与チェックを実行し、ダッシュボードに結果を描画する
 */
function handleGenerateLeaveGrantsForAll() {
  if (!isAdmin()) {
    alert('有給付与チェックは管理者のみ利用できます。');
    return;
  }
  const today = getToday();
  const result = generateLeaveGrantsForAllEmployees(today);
  renderGrantCheckResult(result);

  // ダッシュボードのKPIを再描画
  renderAdminDashboard();
}

/**
 * 社員別付与チェックを実行し、結果メッセージを表示して画面を再描画する
 * @param {string} employeeId
 */
function handleGenerateLeaveGrantsForEmployee(employeeId) {
  if (!isAdmin()) {
    alert('有給付与チェックは管理者のみ利用できます。');
    return;
  }
  const today = getToday();
  const result = generateLeaveGrantsForEmployee(employeeId, today);
  renderEmployeeGrantCheckMessage(result);

  // 社員詳細のサマリー・付与履歴を再描画
  renderEmployeeLeaveSummary(employeeId, today);
  renderLeaveGrantTable(employeeId, today);
}

/**
 * 全社員付与チェック結果をダッシュボードに描画する
 * @param {{ checkedEmployeeCount: number, createdGrantCount: number, createdGrants: Array }} result
 */
function renderGrantCheckResult(result) {
  const el = document.getElementById('grantCheckResult');
  if (!el) return;

  if (result.createdGrantCount === 0) {
    el.innerHTML = `
      <div class="grant-check-message grant-none">
        チェック対象：${esc(String(result.checkedEmployeeCount))}名 ／ 新たに付与する有給はありません。
      </div>`;
    return;
  }

  const rows = result.createdGrants
    .map(
      (g) => `
    <tr>
      <td>${esc(g.employeeName)}</td>
      <td>${esc(g.grantDate)}</td>
      <td>${g.grantedDays} 日</td>
      <td>${esc(g.expireDate)}</td>
    </tr>`
    )
    .join('');

  el.innerHTML = `
    <div class="grant-check-message grant-created">
      チェック対象：${esc(String(result.checkedEmployeeCount))}名 ／ 新規付与：${result.createdGrantCount}件
    </div>
    <div class="table-wrapper" style="margin-top:12px;">
      <table class="table grant-check-table">
        <thead>
          <tr><th>社員名</th><th>付与日</th><th>付与日数</th><th>失効日</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

/**
 * 社員別付与チェック結果をアラート表示する
 * @param {{ employeeName: string, createdGrantCount: number, createdGrants: Array }} result
 */
function renderEmployeeGrantCheckMessage(result) {
  const el = document.getElementById('employeeGrantCheckMessage');
  if (!el) return;

  if (result.createdGrantCount === 0) {
    el.className = 'grant-check-message grant-none';
    el.textContent = '新たに付与する有給はありません。';
  } else {
    const lines = result.createdGrants
      .map((g) => `${g.grantDate} に ${g.grantedDays}日付与しました。`)
      .join('　');
    el.className = 'grant-check-message grant-created';
    el.textContent = lines;
  }
  el.style.display = 'block';
}

// ─────────────────────────────────────────
// バックアップ / 復元
// ─────────────────────────────────────────

/**
 * バックアップ/復元エリアのボタンをバインドする
 */
function bindBackupRestoreActions() {
  const downloadBtn = document.getElementById('backupDownloadBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function () {
      clearBackupMessage();
      downloadBackupJson();
      showBackupMessage('バックアップファイルのダウンロードを開始しました。', 'success');
    });
  }

  const restoreBtn = document.getElementById('backupRestoreBtn');
  if (restoreBtn) {
    restoreBtn.addEventListener('click', function () {
      clearBackupMessage();
      const fileInput = document.getElementById('backupFileInput');
      if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        showBackupMessage('復元するJSONファイルを選択してください。', 'error');
        return;
      }
      handleBackupFileImport(fileInput.files[0]);
    });
  }
}

/**
 * バックアップ/復元エリアにメッセージを表示する
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 */
function showBackupMessage(message, type) {
  const el = document.getElementById('backupMessage');
  if (!el) return;
  el.className = `backup-message backup-message-${type || 'info'}`;
  el.textContent = message;
  el.style.display = 'block';
}

/**
 * バックアップ/復元エリアのメッセージをクリアする
 */
function clearBackupMessage() {
  const el = document.getElementById('backupMessage');
  if (!el) return;
  el.textContent = '';
  el.style.display = 'none';
}

/**
 * デモデータを初期化する（管理者専用）
 * paidLeave_ で始まるキーをすべて削除し、seedデータを再投入してログイン画面へ戻す
 */
function resetDemoData() {
  if (!isAdmin()) return;
  if (!confirm('デモデータを初期化します。現在の登録データは削除されます。よろしいですか？')) return;

  // paidLeave_ で始まるキーをすべて削除
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('paidLeave_')) keysToRemove.push(key);
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));

  // 初期データを再投入
  initializeSeedData();

  // ログイン画面へ戻す（/pages/admin/ 配下からのリセットを考慮）
  const path = location.pathname;
  const prefix = (path.includes('/pages/admin/') || path.includes('/pages/employee/')) ? '../../' : '';
  location.href = prefix + 'index.html';
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

/** 付与区分バッジCSSクラスを返す */
function _getWorkTypeBadgeClass(workType) {
  const map = {
    normal:       'work-type-normal',
    proportional: 'work-type-proportional',
    custom:       'work-type-custom',
  };
  return map[workType] || 'work-type-normal';
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
  const pendingRequestCount = typeof getPendingLeaveRequestCount === 'function' ? getPendingLeaveRequestCount() : 0;
  const statsContainer = document.getElementById('statsContainer');
  if (statsContainer) {
    statsContainer.innerHTML = [
      { label: '社員数', value: total, unit: '名', cls: '' },
      { label: '在籍社員数', value: active, unit: '名', cls: '' },
      { label: '休職中社員数', value: leave, unit: '名', cls: 'warning' },
      { label: '退職者数', value: retired, unit: '名', cls: '' },
      { label: '有給残日数合計', value: totalRemaining, unit: '日', cls: '' },
      { label: '失効予定（30日以内）', value: expiringCount, unit: '名', cls: expiringCount > 0 ? 'danger' : '' },
      { label: '未承認申請数', value: pendingRequestCount, unit: '件', cls: pendingRequestCount > 0 ? 'warning' : '' },
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
      const cond = getDefaultWorkCondition(emp);
      const workTypeBadgeClass = _getWorkTypeBadgeClass(cond.workType);
      return `
      <tr>
        <td><strong>${esc(emp.name)}</strong></td>
        <td class="text-muted">${esc(emp.email)}</td>
        <td>${esc(emp.hireDate)}</td>
        <td><span class="badge ${esc(getStatusBadgeClass(emp.status))}">${esc(getStatusLabel(emp.status))}</span></td>
        <td><span class="badge work-type-badge ${workTypeBadgeClass}">${esc(getWorkTypeLabel(cond.workType))}</span></td>
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
  renderLoginInfoCard(empId);
  renderEmployeeLeaveSummary(empId, today);
  renderLeaveGrantTable(empId, today);
  renderLeaveUsageTable(empId);
}

/**
 * 社員詳細画面にログイン情報カードを描画する（管理者のみ）
 * @param {string} empId
 */
function renderLoginInfoCard(empId) {
  const el = document.getElementById('loginInfoCard');
  if (!el) return;
  if (!isAdmin()) { el.style.display = 'none'; return; }

  const loginUser = getUserByEmployeeId(empId);
  const roleLabel = { admin: '管理者', employee: '社員' };

  if (!loginUser) {
    el.innerHTML = `
      <div class="card login-info-card">
        <h3 class="section-title">ログイン情報（管理者確認用）</h3>
        <p class="login-info-missing">ログインユーザー情報が見つかりません。<br>社員編集画面でメールアドレス・パスワード・権限を確認してください。</p>
      </div>`;
    return;
  }

  el.innerHTML = `
    <div class="card login-info-card">
      <h3 class="section-title">ログイン情報（管理者確認用）</h3>
      <div class="login-info-row">
        <span class="login-info-label">ログインID</span>
        <span class="login-info-value">${esc(loginUser.email)}</span>
      </div>
      <div class="login-info-row">
        <span class="login-info-label">仮パスワード</span>
        <span class="login-info-value password-value">${esc(loginUser.password)}</span>
      </div>
      <div class="login-info-row">
        <span class="login-info-label">権限</span>
        <span class="login-info-value">${esc(roleLabel[loginUser.role] || loginUser.role)}</span>
      </div>
      <p class="prototype-warning">このログイン情報はlocalStorageを使ったプロトタイプ用です。本番運用ではパスワードを平文表示しないでください。</p>
    </div>`;
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
  const cond = getDefaultWorkCondition(employee);
  const workTypeBadgeClass = _getWorkTypeBadgeClass(cond.workType);
  const fields = [
    { label: '社員名', value: employee.name },
    { label: 'メールアドレス', value: employee.email },
    { label: '入社日', value: employee.hireDate },
    { label: '退職日', value: employee.retirementDate || '—' },
    { label: 'ステータス', value: `<span class="badge ${getStatusBadgeClass(employee.status)}">${getStatusLabel(employee.status)}</span>` },
    { label: '付与区分', value: `<span class="badge work-type-badge ${workTypeBadgeClass}">${esc(getWorkTypeLabel(cond.workType))}</span>` },
    { label: '週所定労働日数', value: cond.weeklyWorkDays + ' 日' },
    { label: '週所定労働時間', value: cond.weeklyWorkHours + ' 時間' },
    { label: '年間所定労働日数', value: cond.annualWorkDays + ' 日' },
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
// 社員マイページ
// ─────────────────────────────────────────

function renderMyPage() {
  const user = getCurrentUser();
  if (!user) return;

  const today = getToday();

  // 管理者が mypage にアクセスした場合は専用メッセージを表示
  if (isAdmin()) {
    const main = document.querySelector('.page-content');
    if (main) {
      main.innerHTML = `
        <div class="alert" style="background:#eff6ff; border:1px solid #93c5fd; color:#1e40af; padding:24px; border-radius:8px; margin-top:24px;">
          <strong>管理者アカウントには社員マイページ情報がありません。</strong><br>
          管理者ダッシュボードをご利用ください。
          <div style="margin-top:16px;">
            <a href="../../pages/admin/dashboard.html" class="btn btn-primary btn-sm">管理者ダッシュボードへ</a>
          </div>
        </div>`;
    }
    return;
  }

  const empId = user.employeeId || null;

  if (!empId) {
    const remEl = document.getElementById('myRemaining');
    if (remEl) remEl.textContent = '—';
    return;
  }

  const employee = getEmployeeById(empId);
  if (!employee) return;

  // 付与を最新化
  generateLeaveGrantsIfNeeded(empId, today);

  const summary = calculateLeaveSummary(empId, today);

  // プロフィールヘッダー
  const nameEl = document.getElementById('myName');
  if (nameEl) nameEl.textContent = employee.name;

  const metaEl = document.getElementById('myMeta');
  if (metaEl) {
    const cond = getDefaultWorkCondition(employee);
    metaEl.textContent =
      employee.email +
      '　入社日：' + employee.hireDate +
      '　' + getStatusLabel(employee.status) +
      '　付与区分：' + getWorkTypeLabel(cond.workType);
  }

  // 勤務条件カード
  const workCondEl = document.getElementById('myWorkCondition');
  if (workCondEl) {
    const cond = getDefaultWorkCondition(employee);
    const workTypeBadgeClass = _getWorkTypeBadgeClass(cond.workType);
    workCondEl.innerHTML = `
      <div class="info-item">
        <label>付与区分</label>
        <p><span class="badge work-type-badge ${workTypeBadgeClass}">${esc(getWorkTypeLabel(cond.workType))}</span></p>
      </div>
      <div class="info-item">
        <label>週所定労働日数</label>
        <p>${cond.weeklyWorkDays} 日</p>
      </div>
      <div class="info-item">
        <label>週所定労働時間</label>
        <p>${cond.weeklyWorkHours} 時間</p>
      </div>`;
  }

  const remEl = document.getElementById('myRemaining');
  if (remEl) remEl.textContent = summary.activeRemainingDays;

  // 有給サマリー
  const summaryEl = document.getElementById('mySummary');
  if (summaryEl) {
    const cards = [
      { label: '総付与日数', value: summary.totalGrantedDays, unit: '日' },
      { label: '総取得日数', value: summary.totalUsedDays, unit: '日' },
      { label: '次回付与日', value: summary.nextGrantDate || '—', unit: '' },
      { label: '次回付与日数', value: summary.nextGrantDays != null ? summary.nextGrantDays : '—', unit: summary.nextGrantDays != null ? '日' : '' },
      { label: '直近失効日', value: summary.nearestExpireDate || '—', unit: '' },
      { label: '直近失効日数', value: summary.nearestExpireDays > 0 ? summary.nearestExpireDays : '—', unit: summary.nearestExpireDays > 0 ? '日' : '' },
    ];
    summaryEl.innerHTML = cards
      .map(
        (c) => `
      <div class="card">
        <div class="card-title">${esc(c.label)}</div>
        <div class="card-value">${esc(String(c.value))}<span class="card-unit">${esc(c.unit)}</span></div>
      </div>`
      )
      .join('');
  }

  // 有給申請フォームと申請履歴（leaveRequestService.js が読み込まれている場合のみ）
  if (typeof renderLeaveRequestForm === 'function') {
    renderLeaveRequestForm(empId);
    renderEmployeeLeaveRequestHistory(empId);
  }

  // 付与履歴
  const grantTbody = document.getElementById('myGrantHistoryBody');
  if (grantTbody) {
    const grants = getLeaveGrantHistory(empId);
    if (grants.length === 0) {
      grantTbody.innerHTML = '<tr><td colspan="6" class="empty-row">付与履歴はありません</td></tr>';
    } else {
      grantTbody.innerHTML = grants
        .map((g) => {
          const expired = isExpired(g.expireDate, today);
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
  }

  // 取得履歴
  const usageTbody = document.getElementById('myUsageHistoryBody');
  if (usageTbody) {
    const usages = getLeaveUsageHistory(empId);
    if (usages.length === 0) {
      usageTbody.innerHTML = '<tr><td colspan="3" class="empty-row">取得履歴はありません</td></tr>';
    } else {
      usageTbody.innerHTML = usages
        .map(
          (u) => `
        <tr>
          <td>${esc(u.usageDate)}</td>
          <td>${u.usedDays} 日</td>
          <td>${esc(u.note || '—')}</td>
        </tr>`
        )
        .join('');
    }
  }
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
    el.value = val !== undefined && val !== null ? val : '';
  };
  const cond = getDefaultWorkCondition(employee);
  set('name', employee.name);
  set('email', employee.email);
  set('password', user.password || '');
  set('role', user.role || 'employee');
  set('hireDate', employee.hireDate);
  set('retirementDate', employee.retirementDate || '');
  set('status', employee.status || 'active');
  set('workType', cond.workType);
  set('weeklyWorkDays', cond.weeklyWorkDays);
  set('weeklyWorkHours', cond.weeklyWorkHours);
  set('annualWorkDays', cond.annualWorkDays);
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
    workType: val('workType') || 'normal',
    weeklyWorkDays: val('weeklyWorkDays'),
    weeklyWorkHours: val('weeklyWorkHours'),
    annualWorkDays: val('annualWorkDays'),
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
// 有給申請（社員マイページ）
// ─────────────────────────────────────────

/**
 * 有給申請フォームを #leaveRequestForm に描画し、イベントをバインドする
 * @param {string} employeeId
 */
function renderLeaveRequestForm(employeeId) {
  const el = document.getElementById('leaveRequestForm');
  if (!el) return;

  // 管理者には申請フォームを表示しない
  if (isAdmin()) {
    el.innerHTML = '';
    return;
  }

  const today = getToday();
  el.innerHTML = `
    <form id="leaveReqForm" novalidate>
      <div id="leaveReqAlert" class="alert alert-error" style="display:none;"></div>
      <div id="leaveReqSuccess" class="alert" style="display:none; background:#d1fae5; border:1px solid #6ee7b7; color:#065f46;"></div>
      <div class="form-row">
        <div class="form-group">
          <label for="leaveReqDate">取得希望日 <span class="required">*</span></label>
          <input type="date" id="leaveReqDate" class="form-control" min="${today}">
          <p class="field-error" id="leaveReqDateError"></p>
        </div>
        <div class="form-group">
          <label for="leaveReqDays">取得日数 <span class="required">*</span></label>
          <select id="leaveReqDays" class="form-control">
            <option value="">選択してください</option>
            <option value="0.5">半休（0.5日）</option>
            <option value="1">1日</option>
          </select>
          <p class="field-error" id="leaveReqDaysError"></p>
        </div>
      </div>
      <div class="form-group">
        <label for="leaveReqReason">申請理由</label>
        <textarea id="leaveReqReason" class="form-control" rows="2" placeholder="例：私用のため"></textarea>
      </div>
      <div class="form-actions" style="justify-content:flex-start;">
        <button type="submit" class="btn btn-primary btn-sm">申請する</button>
      </div>
    </form>`;

  const form = el.querySelector('#leaveReqForm');
  if (form && !form.dataset.bound) {
    form.dataset.bound = '1';
    form.addEventListener('submit', (e) => handleLeaveRequestSubmit(e, employeeId));
  }
}

/**
 * 有給申請フォームのsubmitハンドラ
 * @param {Event} event
 * @param {string} employeeId
 */
function handleLeaveRequestSubmit(event, employeeId) {
  event.preventDefault();

  const alertEl  = document.getElementById('leaveReqAlert');
  const successEl = document.getElementById('leaveReqSuccess');
  if (alertEl)   { alertEl.style.display = 'none'; alertEl.textContent = ''; }
  if (successEl) { successEl.style.display = 'none'; successEl.textContent = ''; }

  // フィールドエラークリア
  ['leaveReqDateError', 'leaveReqDaysError'].forEach((id) => {
    const e = document.getElementById(id);
    if (e) { e.textContent = ''; e.style.display = 'none'; }
  });

  const usageDate = document.getElementById('leaveReqDate') ? document.getElementById('leaveReqDate').value : '';
  const usedDays  = document.getElementById('leaveReqDays') ? document.getElementById('leaveReqDays').value : '';
  const reason    = document.getElementById('leaveReqReason') ? document.getElementById('leaveReqReason').value.trim() : '';

  const result = createLeaveRequest(employeeId, usageDate, usedDays, reason);

  if (!result.success) {
    // フィールドエラー表示
    if (result.errors) {
      const dateErr = document.getElementById('leaveReqDateError');
      if (dateErr && result.errors.usageDate) {
        dateErr.textContent = result.errors.usageDate;
        dateErr.style.display = 'block';
      }
      const daysErr = document.getElementById('leaveReqDaysError');
      if (daysErr && result.errors.usedDays) {
        daysErr.textContent = result.errors.usedDays;
        daysErr.style.display = 'block';
      }
    }
    if (alertEl) {
      alertEl.textContent = result.message || '申請に失敗しました。';
      alertEl.style.display = 'block';
    }
    return;
  }

  // 成功
  if (successEl) {
    successEl.textContent = `${result.request.usageDate} の有給申請を受け付けました。管理者の承認をお待ちください。`;
    successEl.style.display = 'block';
  }

  // フォームリセット
  const form = document.getElementById('leaveReqForm');
  if (form) {
    form.reset();
    delete form.dataset.bound;
  }

  // 申請履歴を再描画
  renderEmployeeLeaveRequestHistory(employeeId);

  // フォームを再バインド
  renderLeaveRequestForm(employeeId);
}

/**
 * 社員の申請履歴を #leaveRequestHistoryBody に描画する
 * @param {string} employeeId
 */
function renderEmployeeLeaveRequestHistory(employeeId) {
  const tbody = document.getElementById('leaveRequestHistoryBody');
  if (!tbody) return;

  const requests = getLeaveRequestsByEmployeeId(employeeId);
  if (requests.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-row">申請履歴はありません</td></tr>';
    return;
  }

  tbody.innerHTML = requests
    .map((r) => {
      // pending かつ自分の申請のみ「取消」ボタンを表示
      const canCancel = r.status === 'pending';
      const cancelBtn = canCancel
        ? `<button class="btn btn-outline btn-sm" onclick="handleCancelLeaveRequest('${esc(r.id)}')">取消</button>`
        : '—';
      return `
        <tr>
          <td>${esc(r.requestDate)}</td>
          <td>${esc(r.usageDate)}</td>
          <td>${r.usedDays} 日</td>
          <td>${esc(r.reason || '—')}</td>
          <td><span class="badge ${esc(getLeaveRequestStatusBadgeClass(r.status))}">${esc(getLeaveRequestStatusLabel(r.status))}</span></td>
          <td>${esc(r.rejectReason || '—')}</td>
          <td>${cancelBtn}</td>
        </tr>`;
    })
    .join('');
}

/**
 * 有給申請取消ハンドラ（社員マイページから呼ばれる）
 * @param {string} requestId
 */
function handleCancelLeaveRequest(requestId) {
  if (!confirm('この有給申請を取り消しますか？')) return;

  const result = cancelLeaveRequest(requestId);
  if (!result.success) {
    alert('取消に失敗しました：' + (result.message || ''));
    return;
  }

  alert('申請を取り消しました。');

  // 申請履歴を再描画（現在ログイン中の社員のIDで再描画）
  const user = getCurrentUser();
  if (user && user.employeeId) {
    renderEmployeeLeaveRequestHistory(user.employeeId);
  }
}

// ─────────────────────────────────────────
// 有給申請一覧（管理者）
// ─────────────────────────────────────────

/**
 * 管理者：有給申請一覧ページを描画する
 */
function renderLeaveRequestsPage() {
  const filter = document.getElementById('requestStatusFilter');
  const selectedStatus = filter ? filter.value : 'all';

  let requests = getAllLeaveRequests();
  if (selectedStatus !== 'all') {
    requests = requests.filter((r) => r.status === selectedStatus);
  }

  renderLeaveRequestTable(requests);

  // フィルター変更イベント（初回のみバインド）
  if (filter && !filter.dataset.bound) {
    filter.dataset.bound = '1';
    filter.addEventListener('change', () => renderLeaveRequestsPage());
  }
}

/**
 * 申請一覧テーブルを描画する
 * @param {Array} requests
 */
function renderLeaveRequestTable(requests) {
  const tbody = document.getElementById('leaveRequestTableBody');
  if (!tbody) return;

  if (requests.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-row">申請はありません</td></tr>';
    return;
  }

  tbody.innerHTML = requests
    .map((r) => {
      const emp = getEmployeeById(r.employeeId);
      const empName  = emp ? esc(emp.name)  : '—';
      const empEmail = emp ? esc(emp.email) : '—';

      const statusBadge = `<span class="badge ${esc(getLeaveRequestStatusBadgeClass(r.status))}">${esc(getLeaveRequestStatusLabel(r.status))}</span>`;
      const actionAt = r.status === 'approved'
        ? esc(r.approvedAt ? r.approvedAt.slice(0, 10) : '')
        : r.status === 'rejected'
          ? esc(r.rejectedAt ? r.rejectedAt.slice(0, 10) : '')
          : '—';

      const actionBtns = r.status === 'pending'
        ? `<div class="request-actions">
             <button class="btn btn-success btn-sm" onclick="handleApproveLeaveRequest('${esc(r.id)}')">承認</button>
             <button class="btn btn-danger btn-sm"  onclick="handleRejectLeaveRequest('${esc(r.id)}')">却下</button>
           </div>`
        : '—';

      return `
        <tr>
          <td>${esc(r.requestDate)}</td>
          <td><strong>${empName}</strong></td>
          <td class="text-muted">${empEmail}</td>
          <td>${esc(r.usageDate)}</td>
          <td>${r.usedDays} 日</td>
          <td>${esc(r.reason || '—')}</td>
          <td>${statusBadge}</td>
          <td>${actionAt}</td>
          <td>${actionBtns}</td>
        </tr>`;
    })
    .join('');
}

/**
 * 申請を承認するハンドラ
 * @param {string} requestId
 */
function handleApproveLeaveRequest(requestId) {
  if (!confirm('この申請を承認しますか？承認後に有給取得履歴へ反映されます。')) return;

  const result = approveLeaveRequest(requestId);
  if (!result.success) {
    alert('承認に失敗しました：' + (result.message || ''));
    return;
  }

  alert('承認しました。有給取得履歴へ反映されました。');
  renderLeaveRequestsPage();
  // ダッシュボードKPIも更新（同ページであれば）
  if (typeof renderAdminDashboard === 'function' && document.getElementById('statsContainer')) {
    renderAdminDashboard();
  }
}

/**
 * 申請を却下するハンドラ
 * @param {string} requestId
 */
function handleRejectLeaveRequest(requestId) {
  const rejectReason = prompt('却下理由を入力してください（任意）：', '');
  if (rejectReason === null) return; // キャンセル

  const result = rejectLeaveRequest(requestId, rejectReason);
  if (!result.success) {
    alert('却下に失敗しました：' + (result.message || ''));
    return;
  }

  alert('却下しました。');
  renderLeaveRequestsPage();
  if (typeof renderAdminDashboard === 'function' && document.getElementById('statsContainer')) {
    renderAdminDashboard();
  }
}

// ─────────────────────────────────────────
// window 公開
// ─────────────────────────────────────────

window.initializeApp = initializeApp;
window.renderMyPage = renderMyPage;
window.resetDemoData = resetDemoData;
window.bindBackupRestoreActions = bindBackupRestoreActions;
window.showBackupMessage = showBackupMessage;
window.clearBackupMessage = clearBackupMessage;
window.renderLoginInfoCard = renderLoginInfoCard;
window.handleGenerateLeaveGrantsForAll = handleGenerateLeaveGrantsForAll;
window.handleGenerateLeaveGrantsForEmployee = handleGenerateLeaveGrantsForEmployee;
window.renderGrantCheckResult = renderGrantCheckResult;
window.renderEmployeeGrantCheckMessage = renderEmployeeGrantCheckMessage;
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
window._getWorkTypeBadgeClass = _getWorkTypeBadgeClass;
window.isWithinDays = isWithinDays;
window.renderLeaveRequestForm = renderLeaveRequestForm;
window.handleLeaveRequestSubmit = handleLeaveRequestSubmit;
window.renderEmployeeLeaveRequestHistory = renderEmployeeLeaveRequestHistory;
window.renderLeaveRequestsPage = renderLeaveRequestsPage;
window.renderLeaveRequestTable = renderLeaveRequestTable;
window.handleApproveLeaveRequest = handleApproveLeaveRequest;
window.handleRejectLeaveRequest = handleRejectLeaveRequest;
window.handleCancelLeaveRequest = handleCancelLeaveRequest;

document.addEventListener('DOMContentLoaded', initializeApp);
