/**
 * storage.js - localStorage操作
 *
 * localStorageのキーを一元管理し、データの読み書きを担当する。
 * 将来的にバックエンドAPIへ移行する場合はこのファイルのみ修正する。
 */

const STORAGE_KEYS = {
  users: 'paidLeave_users',
  employees: 'paidLeave_employees',
  leaveGrants: 'paidLeave_leaveGrants',
  leaveUsages: 'paidLeave_leaveUsages',
  leaveOfAbsences: 'paidLeave_leaveOfAbsences',
  leaveRequests: 'paidLeave_leaveRequests',
  currentUser: 'paidLeave_currentUser',
};

// --- 汎用 ---

/**
 * localStorageからデータを取得する
 * @param {string} key
 * @param {any} defaultValue
 * @returns {any}
 */
function getData(key, defaultValue = []) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

/**
 * localStorageにデータを保存する
 * @param {string} key
 * @param {any} data
 */
function setData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * localStorageからデータを削除する
 * @param {string} key
 */
function removeData(key) {
  localStorage.removeItem(key);
}

// --- ユーザー ---

/** @returns {Array} */
function getUsers() {
  return getData(STORAGE_KEYS.users, []);
}

/** @param {Array} users */
function saveUsers(users) {
  setData(STORAGE_KEYS.users, users);
}

// --- 社員 ---

/** @returns {Array} */
function getEmployees() {
  return getData(STORAGE_KEYS.employees, []);
}

/** @param {Array} employees */
function saveEmployees(employees) {
  setData(STORAGE_KEYS.employees, employees);
}

// --- 有給付与 ---

/** @returns {Array} */
function getLeaveGrants() {
  return getData(STORAGE_KEYS.leaveGrants, []);
}

/** @param {Array} leaveGrants */
function saveLeaveGrants(leaveGrants) {
  setData(STORAGE_KEYS.leaveGrants, leaveGrants);
}

// --- 有給取得 ---

/** @returns {Array} */
function getLeaveUsages() {
  return getData(STORAGE_KEYS.leaveUsages, []);
}

/** @param {Array} leaveUsages */
function saveLeaveUsages(leaveUsages) {
  setData(STORAGE_KEYS.leaveUsages, leaveUsages);
}

// --- 有給申請 ---

/** @returns {Array} */
function getLeaveRequests() {
  return getData(STORAGE_KEYS.leaveRequests, []);
}

/** @param {Array} leaveRequests */
function saveLeaveRequests(leaveRequests) {
  setData(STORAGE_KEYS.leaveRequests, leaveRequests);
}

// --- 休職 ---

/** @returns {Array} */
function getLeaveOfAbsences() {
  return getData(STORAGE_KEYS.leaveOfAbsences, []);
}

/** @param {Array} absences */
function saveLeaveOfAbsences(absences) {
  setData(STORAGE_KEYS.leaveOfAbsences, absences);
}

// --- ログイン中ユーザー ---

/** @returns {object|null} */
function getCurrentUserFromStorage() {
  return getData(STORAGE_KEYS.currentUser, null);
}

/** @param {object} user */
function saveCurrentUserToStorage(user) {
  setData(STORAGE_KEYS.currentUser, user);
}

function removeCurrentUserFromStorage() {
  removeData(STORAGE_KEYS.currentUser);
}

// --- window公開 ---
window.getLeaveRequests = getLeaveRequests;
window.saveLeaveRequests = saveLeaveRequests;
