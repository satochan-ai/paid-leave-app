/**
 * employeeService.js - 社員データ操作
 *
 * 社員マスタのCRUD・検索を担当する。
 */

/**
 * 全社員を返す
 * @returns {Array<object>}
 */
function getAllEmployees() {
  return getEmployees();
}

/**
 * IDで社員を返す
 * @param {string} id
 * @returns {object|null}
 */
function getEmployeeById(id) {
  return getEmployees().find((e) => e.id === id) || null;
}

/**
 * 社員を新規作成する
 * @param {object} data - { name, email, password, role, hireDate, retirementDate, status, note }
 * @returns {{ success: boolean, employee?: object, message?: string }}
 */
function createEmployee(data) {
  const validation = validateEmployeeForm(data, { mode: 'create' });
  if (!validation.valid) {
    return { success: false, message: Object.values(validation.errors).join(' / ') };
  }

  const now = getToday();
  const empId = generateId('emp');

  const employee = {
    id: empId,
    name: data.name.trim(),
    email: data.email.trim(),
    hireDate: data.hireDate,
    retirementDate: data.retirementDate || '',
    status: data.status || 'active',
    note: data.note || '',
    createdAt: now,
    updatedAt: now,
  };

  const employees = getEmployees();
  employees.push(employee);
  saveEmployees(employees);

  // 対応するログインユーザーを作成
  const users = getUsers();
  const user = {
    id: generateId('user'),
    employeeId: empId,
    name: data.name.trim(),
    email: data.email.trim(),
    password: data.password,
    role: data.role || 'employee',
  };
  users.push(user);
  saveUsers(users);

  return { success: true, employee };
}

/**
 * 社員情報を更新する
 * @param {string} id
 * @param {object} data
 * @returns {{ success: boolean, employee?: object, message?: string }}
 */
function updateEmployee(id, data) {
  const employees = getEmployees();
  const idx = employees.findIndex((e) => e.id === id);
  if (idx === -1) {
    return { success: false, message: '社員が見つかりません。' };
  }

  const validation = validateEmployeeForm(data, { mode: 'edit', employeeId: id });
  if (!validation.valid) {
    return { success: false, message: Object.values(validation.errors).join(' / ') };
  }

  const now = getToday();
  const updated = {
    ...employees[idx],
    name: data.name.trim(),
    email: data.email.trim(),
    hireDate: data.hireDate,
    retirementDate: data.retirementDate || '',
    status: data.status || employees[idx].status,
    note: data.note !== undefined ? data.note : employees[idx].note,
    updatedAt: now,
  };
  employees[idx] = updated;
  saveEmployees(employees);

  // users側の name / email / password / role を同期
  const users = getUsers();
  const uIdx = users.findIndex((u) => u.employeeId === id);
  if (uIdx !== -1) {
    users[uIdx].name = updated.name;
    users[uIdx].email = updated.email;
    if (data.password) users[uIdx].password = data.password;
    if (data.role) users[uIdx].role = data.role;
    saveUsers(users);
  }

  return { success: true, employee: updated };
}

/**
 * 社員を論理削除する（status を retired に変更）
 * @param {string} id
 * @returns {{ success: boolean, message?: string }}
 */
function deleteEmployee(id) {
  const employees = getEmployees();
  const idx = employees.findIndex((e) => e.id === id);
  if (idx === -1) {
    return { success: false, message: '社員が見つかりません。' };
  }

  const now = getToday();
  employees[idx].status = 'retired';
  if (!employees[idx].retirementDate) {
    employees[idx].retirementDate = now;
  }
  employees[idx].updatedAt = now;
  saveEmployees(employees);

  return { success: true };
}

/**
 * 社員をキーワード・ステータスで検索する
 * @param {string} keyword  - 名前・メールアドレスの部分一致（省略可）
 * @param {string} status   - "active" | "leave" | "retired" | "" (全て)
 * @returns {Array<object>}
 */
function searchEmployees(keyword, status) {
  let list = getEmployees();

  if (status) {
    list = list.filter((e) => e.status === status);
  }

  if (keyword && keyword.trim()) {
    const kw = keyword.trim().toLowerCase();
    list = list.filter(
      (e) =>
        e.name.toLowerCase().includes(kw) ||
        e.email.toLowerCase().includes(kw)
    );
  }

  return list;
}

// --- window公開 ---
/**
 * employeeId に紐づくログインユーザーを返す
 * @param {string} employeeId
 * @returns {object|null}
 */
function getUserByEmployeeId(employeeId) {
  return getUsers().find((u) => u.employeeId === employeeId) || null;
}

window.getAllEmployees = getAllEmployees;
window.getEmployeeById = getEmployeeById;
window.getUserByEmployeeId = getUserByEmployeeId;
window.createEmployee = createEmployee;
window.updateEmployee = updateEmployee;
window.deleteEmployee = deleteEmployee;
window.searchEmployees = searchEmployees;
