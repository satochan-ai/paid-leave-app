/**
 * auth.js - 認証処理
 *
 * ログイン・ログアウト・ログイン状態確認・権限チェックを担当する。
 * localStorageを使った簡易認証。本番利用時はバックエンド認証に置き換える。
 */

/**
 * ログイン処理
 * @param {string} email
 * @param {string} password
 * @returns {{ success: boolean, user?: object, message?: string }}
 */
function login(email, password) {
  const users = getUsers();
  const user = users.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return { success: false, message: 'メールアドレスまたはパスワードが違います。' };
  }

  saveCurrentUserToStorage(user);
  return { success: true, user };
}

/**
 * ログアウト処理
 */
function logout() {
  removeCurrentUserFromStorage();

  // /pages/admin/ または /pages/employee/ 配下からのログアウトかを判定する
  const path = location.pathname;
  const prefix = (path.includes('/pages/admin/') || path.includes('/pages/employee/')) ? '../../' : '';
  location.href = `${prefix}index.html`;
}

/**
 * ログイン中のユーザー情報を返す
 * @returns {object|null}
 */
function getCurrentUser() {
  return getCurrentUserFromStorage();
}

/**
 * ログイン中かどうかを返す
 * @returns {boolean}
 */
function isLoggedIn() {
  return getCurrentUser() !== null;
}

/**
 * 管理者かどうかを返す
 * @returns {boolean}
 */
function isAdmin() {
  const user = getCurrentUser();
  return user !== null && user.role === 'admin';
}

/**
 * 社員（一般ユーザー）かどうかを返す
 * @returns {boolean}
 */
function isEmployee() {
  const user = getCurrentUser();
  return user !== null && user.role === 'employee';
}
