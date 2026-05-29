# データ設計書

---

## localStorageキー一覧

| キー | 説明 |
|------|------|
| `paidLeave_users` | ログインユーザー情報の配列 |
| `paidLeave_employees` | 社員マスタの配列 |
| `paidLeave_leaveGrants` | 有給付与履歴の配列 |
| `paidLeave_leaveUsages` | 有給取得履歴の配列 |
| `paidLeave_leaveOfAbsences` | 休職期間の配列 |
| `paidLeave_currentUser` | ログイン中ユーザー（オブジェクト） |

---

## データ構造

### users（ログインユーザー情報）

```json
{
  "id": "usr_abc123",
  "employeeId": "emp_xyz456",
  "name": "山田 太郎",
  "email": "yamada@example.com",
  "password": "password123",
  "role": "employee"
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| id | string | ユーザーID（"usr_" + ランダム文字列） |
| employeeId | string \| null | 社員マスタのID。管理者はnull |
| name | string | 表示名 |
| email | string | ログインに使うメールアドレス（一意） |
| password | string | パスワード（プレーンテキスト。プロトタイプ用途） |
| role | "admin" \| "employee" | 権限 |

---

### employees（社員マスタ）

```json
{
  "id": "emp_xyz456",
  "name": "山田 太郎",
  "email": "yamada@example.com",
  "hireDate": "2022-04-01",
  "retirementDate": null,
  "status": "active",
  "note": "",
  "createdAt": "2022-04-01",
  "updatedAt": "2022-04-01"
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| id | string | 社員ID（"emp_" + ランダム文字列） |
| name | string | 社員名 |
| email | string | メールアドレス |
| hireDate | string | 入社日（YYYY-MM-DD） |
| retirementDate | string \| null | 退職日（YYYY-MM-DD）。未退職はnull |
| status | "active" \| "leave" \| "retired" | 在籍ステータス |
| note | string | 備考 |
| createdAt | string | 作成日（YYYY-MM-DD） |
| updatedAt | string | 更新日（YYYY-MM-DD） |

---

### leaveGrants（有給付与履歴）

```json
{
  "id": "grant_001",
  "employeeId": "emp_xyz456",
  "grantDate": "2022-10-01",
  "grantedDays": 10,
  "usedDays": 3,
  "remainingDays": 7,
  "expireDate": "2024-10-01",
  "createdAt": "2022-10-01"
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| id | string | 付与ID（"grant_" + ランダム文字列） |
| employeeId | string | 対象社員ID |
| grantDate | string | 付与日（YYYY-MM-DD） |
| grantedDays | number | 付与日数 |
| usedDays | number | このロットから消化済みの日数 |
| remainingDays | number | このロットの残日数（= grantedDays - usedDays） |
| expireDate | string | 失効日（YYYY-MM-DD、= grantDate + 2年） |
| createdAt | string | レコード作成日（YYYY-MM-DD） |

---

### leaveUsages（有給取得履歴）

```json
{
  "id": "usage_001",
  "employeeId": "emp_xyz456",
  "usageDate": "2023-08-10",
  "usedDays": 1,
  "note": "夏季休暇",
  "createdBy": "usr_admin",
  "createdAt": "2023-08-10"
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| id | string | 取得ID（"usage_" + ランダム文字列） |
| employeeId | string | 対象社員ID |
| usageDate | string | 取得日（YYYY-MM-DD） |
| usedDays | number | 取得日数（0.5 or 整数） |
| note | string | 備考 |
| createdBy | string | 登録者のユーザーID |
| createdAt | string | 登録日（YYYY-MM-DD） |

---

### leaveOfAbsences（休職期間）

```json
{
  "id": "absence_001",
  "employeeId": "emp_xyz456",
  "startDate": "2023-06-01",
  "endDate": "2023-08-31",
  "note": "産前産後休業"
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| id | string | 休職ID（"absence_" + ランダム文字列） |
| employeeId | string | 対象社員ID |
| startDate | string | 休職開始日（YYYY-MM-DD） |
| endDate | string \| null | 休職終了日（YYYY-MM-DD）。復帰未定はnull |
| note | string | 事由・備考 |

---

## データの関連

```
users (1) ──── (0..1) employees
                    │
                    ├── (多) leaveGrants
                    ├── (多) leaveUsages
                    └── (多) leaveOfAbsences
```

- `users.employeeId` → `employees.id`（管理者はnull）
- `leaveGrants.employeeId` → `employees.id`
- `leaveUsages.employeeId` → `employees.id`
- `leaveOfAbsences.employeeId` → `employees.id`

---

## ステータス定義

### employees.status
| 値 | 表示 | 説明 |
|----|------|------|
| `active` | 在籍 | 通常勤務中 |
| `leave` | 休職 | 休職・育休中など |
| `retired` | 退職 | 退職済み（有給取得登録不可） |

### users.role
| 値 | 説明 |
|----|------|
| `admin` | 全社員の情報を管理できる |
| `employee` | 自分の情報のみ閲覧できる |
