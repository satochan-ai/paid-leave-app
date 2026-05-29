/**
 * routerGuard.js - アクセス制御
 *
 * 各ページの先頭で呼び出し、権限のないユーザーをリダイレクトする。
 * 各HTMLファイルの <script> ブロックで適切な関数を呼び出す。
 */

/** パス深さからルートへの相対パスプレフィックスを返すヘルパー */
function _getRootPrefix() {
  // pathname を '/' で分割して空文字を除いたセグメント数から深さを判定
  // 例: /pages/admin/dashboard.html → depth=3 → '../../'
  const segments = location.pathname.split('/').filter(Boolean);
  const depth = segments.length;
  if (depth >= 3) return '../../';
  if (depth >= 2) return '../';
  return '';
}

/**
 * ログイン必須チェック
 * 未ログインの場合は index.html へリダイレクトする
 */
function requireLogin() {
  if (!isLoggedIn()) {
    location.href = _getRootPrefix() + 'index.html';
  }
}

/**
 * 管理者権限必須チェック
 * 管理者でない場合は権限に応じたページへリダイレクトする
 */
function requireAdmin() {
  if (!isLoggedIn()) {
    location.href = _getRootPrefix() + 'index.html';
    return;
  }
  if (!isAdmin()) {
    location.href = _getRootPrefix() + 'pages/employee/mypage.html';
  }
}

/**
 * ロールに応じたページへリダイレクトする
 * ログイン済みユーザーが index.html にアクセスした場合に使う
 */
function redirectByRole() {
  const prefix = _getRootPrefix();
  if (isAdmin()) {
    location.href = prefix + 'pages/admin/dashboard.html';
  } else if (isEmployee()) {
    location.href = prefix + 'pages/employee/mypage.html';
  }
}

/**
 * 社員が他の社員のデータにアクセスしていないか確認する
 * 自分のemployeeId以外のデータにアクセスしようとした場合はリダイレクト
 * @param {string} employeeId - アクセスしようとしている社員ID
 */
function preventEmployeeAccessOtherData(employeeId) {
  if (isAdmin()) return;
  const user = getCurrentUser();
  if (!user || user.employeeId !== employeeId) {
    location.href = _getRootPrefix() + 'pages/employee/mypage.html';
  }
}
