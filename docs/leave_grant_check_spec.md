# 有給付与チェック仕様書

## 目的

入社日と現在日をもとに、付与されているべき有給休暇が付与履歴に存在するか確認し、不足分を自動生成する。

## 対象社員

- 在籍（`status === "active"`）
- 休職中（`status === "leave"`）

## 対象外社員

- 退職（`status === "retired"`）

退職者には新規付与しない。

## 付与日

```
初回付与日 = 入社日 + 6か月
2回目以降 = 初回付与日 + 1年ごと
```

## 付与日数

| 付与回数 | 継続勤務年数 | 付与日数 |
|---:|---:|---:|
| 1回目 | 0.5年 | 10日 |
| 2回目 | 1.5年 | 11日 |
| 3回目 | 2.5年 | 12日 |
| 4回目 | 3.5年 | 14日 |
| 5回目 | 4.5年 | 16日 |
| 6回目 | 5.5年 | 18日 |
| 7回目以降 | 6.5年以上 | 20日 |

## 重複付与防止

同じ `employeeId` + `grantDate` の付与履歴が存在する場合は新規作成しない。  
同じ状態で何度実行しても、2回目以降は `createdGrantCount === 0` になる。

## 実行単位

| 単位 | 関数 | 実行場所 |
|------|------|---------|
| 全社員 | `generateLeaveGrantsForAllEmployees(currentDate)` | 管理者ダッシュボード |
| 社員別 | `generateLeaveGrantsForEmployee(employeeId, currentDate)` | 社員詳細画面 |

## 戻り値（全社員）

```json
{
  "checkedEmployeeCount": 2,
  "createdGrantCount": 3,
  "createdGrants": [
    { "employeeId": "...", "employeeName": "山田 太郎", "grantDate": "2024-10-01", "grantedDays": 10, "expireDate": "2026-10-01" }
  ]
}
```

## 戻り値（社員別）

```json
{
  "employeeId": "emp_001",
  "employeeName": "山田 太郎",
  "createdGrantCount": 1,
  "createdGrants": [
    { "grantDate": "2024-10-01", "grantedDays": 10, "expireDate": "2026-10-01" }
  ]
}
```

## 権限

管理者のみ実行可能（`isAdmin()` で確認）

## 実装ファイル

- `assets/js/leaveService.js` - `generateLeaveGrantsIfNeeded()` / `generateLeaveGrantsForAllEmployees()` / `generateLeaveGrantsForEmployee()`
- `assets/js/app.js` - `handleGenerateLeaveGrantsForAll()` / `handleGenerateLeaveGrantsForEmployee()`
