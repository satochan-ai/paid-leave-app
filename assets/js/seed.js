/**
 * seed.js - 初期データ投入
 *
 * アプリ初回起動時にlocalStorageへサンプルデータを投入する。
 * すでにデータが存在する場合は何もしない。
 *
 * 初期ログイン情報:
 *   管理者: admin@example.com / admin123
 *   社員（通常付与）: yamada@example.com / password123
 *   社員（比例付与）: sato@example.com   / password123
 */

/**
 * 初期データをlocalStorageに投入する（初回のみ）
 */
function initializeSeedData() {
  // paidLeave_users が存在する場合は何もしない
  if (getUsers().length > 0) return;

  const now = getToday();

  // --- ユーザー ---
  saveUsers([
    {
      id: 'user_admin_001',
      employeeId: null,
      name: '管理者',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
    },
    {
      id: 'user_emp_001',
      employeeId: 'emp_001',
      name: '山田 太郎',
      email: 'yamada@example.com',
      password: 'password123',
      role: 'employee',
    },
    {
      id: 'user_emp_002',
      employeeId: 'emp_002',
      name: '佐藤 花子',
      email: 'sato@example.com',
      password: 'password123',
      role: 'employee',
    },
  ]);

  // --- 社員マスタ ---
  saveEmployees([
    {
      id: 'emp_001',
      name: '山田 太郎',
      email: 'yamada@example.com',
      hireDate: '2024-04-01',
      retirementDate: '',
      status: 'active',
      workType: 'normal',
      weeklyWorkDays: 5,
      weeklyWorkHours: 40,
      annualWorkDays: 260,
      note: 'サンプル社員（通常付与）',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'emp_002',
      name: '佐藤 花子',
      email: 'sato@example.com',
      hireDate: '2024-04-01',
      retirementDate: '',
      status: 'active',
      workType: 'proportional',
      weeklyWorkDays: 3,
      weeklyWorkHours: 24,
      annualWorkDays: 156,
      note: '比例付与サンプル社員（週3日・24時間）',
      createdAt: now,
      updatedAt: now,
    },
  ]);

  // --- 有給付与履歴 ---
  saveLeaveGrants([
    {
      id: 'grant_001',
      employeeId: 'emp_001',
      grantDate: '2024-10-01',
      grantedDays: 10,
      usedDays: 2,
      remainingDays: 8,
      expireDate: '2026-10-01',
      createdAt: now,
    },
    {
      id: 'grant_002',
      employeeId: 'emp_001',
      grantDate: '2025-10-01',
      grantedDays: 11,
      usedDays: 0,
      remainingDays: 11,
      expireDate: '2027-10-01',
      createdAt: now,
    },
    {
      id: 'grant_003',
      employeeId: 'emp_002',
      grantDate: '2024-10-01',
      grantedDays: 5,
      usedDays: 1,
      remainingDays: 4,
      expireDate: '2026-10-01',
      createdAt: now,
    },
    {
      id: 'grant_004',
      employeeId: 'emp_002',
      grantDate: '2025-10-01',
      grantedDays: 6,
      usedDays: 0,
      remainingDays: 6,
      expireDate: '2027-10-01',
      createdAt: now,
    },
  ]);

  // --- 有給取得履歴 ---
  saveLeaveUsages([
    {
      id: 'usage_001',
      employeeId: 'emp_001',
      usageDate: '2025-12-10',
      usedDays: 1,
      note: '私用',
      createdBy: 'user_admin_001',
      createdAt: now,
    },
    {
      id: 'usage_002',
      employeeId: 'emp_001',
      usageDate: '2026-02-15',
      usedDays: 1,
      note: '私用',
      createdBy: 'user_admin_001',
      createdAt: now,
    },
    {
      id: 'usage_003',
      employeeId: 'emp_002',
      usageDate: '2026-01-20',
      usedDays: 1,
      note: '私用',
      createdBy: 'user_admin_001',
      createdAt: now,
    },
  ]);

  // --- 休職期間（初期は空） ---
  saveLeaveOfAbsences([]);

  // --- 有給申請（初期は空） ---
  saveLeaveRequests([]);
}
