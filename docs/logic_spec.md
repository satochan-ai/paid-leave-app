# 有給計算ロジック仕様書

---

## 有給付与チェック仕様

### 初回付与日
入社日 + 6か月

### 2回目以降の付与日
初回付与日から1年ごと

### 重複付与防止
同じ `employeeId` + `grantDate` の付与履歴が存在する場合は新規作成しない。何度実行しても重複しない。

### 退職者除外
`status === "retired"` の社員には付与しない。

詳細は `docs/leave_grant_check_spec.md` を参照。

---

## 基本ルール

| ルール | 仕様 |
|--------|------|
| 初回付与日 | 入社日 + 6か月 |
| 2回目以降の付与日 | 初回付与日から1年ごと |
| 失効日 | 付与日 + 2年 |
| 消化順 | 古い付与分（失効日が近い順）から消化 |
| 半休 | 0.5日単位対応 |

### 付与日数テーブル（法定付与日数）

| 付与回次 | 継続勤務年数 | 付与日数 |
|---------|------------|---------|
| 1回目 | 0.5年 | 10日 |
| 2回目 | 1.5年 | 11日 |
| 3回目 | 2.5年 | 12日 |
| 4回目 | 3.5年 | 14日 |
| 5回目 | 4.5年 | 16日 |
| 6回目 | 5.5年 | 18日 |
| 7回目以降 | 6.5年以上 | 20日（上限） |

---

## 関数仕様（leaveCalculator.js）

---

### `calculateFirstGrantDate(hireDate)`

| 項目 | 内容 |
|------|------|
| 目的 | 初回有給付与日を計算する |
| 引数 | `hireDate: string` — 入社日（YYYY-MM-DD） |
| 戻り値 | `string` — 初回付与日（YYYY-MM-DD） |

```js
calculateFirstGrantDate("2024-04-01") // → "2024-10-01"
```

---

### `getGrantCount(hireDate, grantDate)`

| 項目 | 内容 |
|------|------|
| 目的 | 対象付与日が何回目の付与かを返す |
| 引数 | `hireDate: string`, `grantDate: string` |
| 戻り値 | `number` — 1始まり |

```js
getGrantCount("2024-04-01", "2024-10-01") // → 1
getGrantCount("2024-04-01", "2025-10-01") // → 2
getGrantCount("2024-04-01", "2026-10-01") // → 3
```

**処理**
1. `calculateFirstGrantDate(hireDate)` で初回付与日を取得
2. `(grantDate - firstGrantDate) / 365.25日` を年換算し四捨五入
3. `+1` して回次を返す

---

### `calculateGrantDays(hireDate, grantDate)`

| 項目 | 内容 |
|------|------|
| 目的 | 指定付与日の付与日数を計算する |
| 引数 | `hireDate: string`, `grantDate: string` |
| 戻り値 | `number` — 付与日数（10〜20） |

```js
calculateGrantDays("2024-04-01", "2024-10-01") // → 10（1回目）
calculateGrantDays("2024-04-01", "2025-10-01") // → 11（2回目）
calculateGrantDays("2024-04-01", "2026-10-01") // → 12（3回目）
calculateGrantDays("2024-04-01", "2027-10-01") // → 14（4回目）
calculateGrantDays("2024-04-01", "2028-10-01") // → 16（5回目）
calculateGrantDays("2024-04-01", "2029-10-01") // → 18（6回目）
calculateGrantDays("2024-04-01", "2030-10-01") // → 20（7回目以降）
```

**計算式**
```js
const LEGAL_GRANT_DAYS = [10, 11, 12, 14, 16, 18, 20];
付与日数 = LEGAL_GRANT_DAYS[min(getGrantCount(...) - 1, 6)]
```

---

### `calculateNextGrantDate(hireDate, currentDate)`

| 項目 | 内容 |
|------|------|
| 目的 | 次回の有給付与日を計算する |
| 引数 | `hireDate: string`, `currentDate: string` |
| 戻り値 | `string` — 次回付与日（YYYY-MM-DD） |

```js
calculateNextGrantDate("2024-04-01", "2026-05-30") // → "2026-10-01"
calculateNextGrantDate("2024-04-01", "2024-08-01") // → "2024-10-01"（初回未到来）
```

**処理**
1. 初回付与日が `currentDate` より未来 → 初回付与日を返す
2. `(currentDate - firstGrantDate) / 365.25日` を年換算し切り捨て → `n`
3. `addYears(firstGrantDate, n + 1)` を返す

---

### `calculateExpireDate(grantDate)`

| 項目 | 内容 |
|------|------|
| 目的 | 有給失効日を計算する |
| 引数 | `grantDate: string` |
| 戻り値 | `string` — 失効日（YYYY-MM-DD） |

```js
calculateExpireDate("2024-10-01") // → "2026-10-01"
```

---

### `isExpired(expireDate, currentDate)`

| 項目 | 内容 |
|------|------|
| 目的 | 付与履歴が失効済みか判定する |
| 引数 | `expireDate: string`, `currentDate: string` |
| 戻り値 | `boolean` |

```
expireDate < currentDate → true（失効済み）
expireDate >= currentDate → false（有効）
```

---

### `calculateLeaveSummary(employeeId, currentDate)`

| 項目 | 内容 |
|------|------|
| 目的 | 社員の有給サマリーを計算する |
| 引数 | `employeeId: string`, `currentDate: string`（省略時は今日） |
| 戻り値 | オブジェクト（下記参照） |

**戻り値の構造**
```js
{
  employeeId: "emp_001",
  totalGrantedDays: 21,       // 全付与日数合計
  totalUsedDays: 2,           // 取得履歴の合計
  totalRemainingDays: 19,     // 付与履歴上の残日数合計（失効含む）
  activeRemainingDays: 19,    // 未失効分の残日数合計
  expiredRemainingDays: 0,    // 失効済みの残日数合計
  nextGrantDate: "2026-10-01",
  nextGrantDays: 12,
  nearestExpireDate: "2026-10-01", // 最も近い失効日
  nearestExpireDays: 8             // その失効日に消える残日数
}
```

---

## 関数仕様（leaveService.js）

---

### `generateLeaveGrantsIfNeeded(employeeId, currentDate)`

| 項目 | 内容 |
|------|------|
| 目的 | 入社日〜現在日までに付与されるべき有給を自動生成する |
| 引数 | `employeeId: string`, `currentDate: string`（省略時は今日） |
| 戻り値 | `leaveGrant[]` — 新規作成した付与履歴 |

**注意**
- 退職済み社員には付与しない
- 同じ `grantDate` の付与履歴は重複作成しない
- 休職期間の按分は対象外（将来拡張）

---

### `consumeLeave(employeeId, usedDays, currentDate)`

| 項目 | 内容 |
|------|------|
| 目的 | 有給を古い付与分から消化する |
| 引数 | `employeeId: string`, `usedDays: number`, `currentDate: string` |
| 戻り値 | `{ success, consumedDetails }` または `{ success: false, message }` |

**成功時の戻り値**
```js
{
  success: true,
  consumedDetails: [
    { grantId: "grant_001", usedDays: 1 }
  ]
}
```

**消化フロー**
```
1. 対象社員の付与履歴を取得
2. isExpired() で失効済みを除外
3. remainingDays > 0 のものに絞る
4. grantDate 昇順（古い順）に並び替える
5. 合計残日数 < usedDays → エラーを返す
6. 古い付与分から remainingDays を減算、usedDays を加算（0.5単位対応）
7. saveLeaveGrants() で保存
```

---

### `registerLeaveUsage(employeeId, usageDate, usedDays, note)`

| 項目 | 内容 |
|------|------|
| 目的 | 有給取得を登録する |
| 引数 | `employeeId`, `usageDate`, `usedDays`, `note` |
| 戻り値 | `{ success, usage }` または `{ success: false, message }` |

**登録フロー**
```
1. validateLeaveUsageForm() でバリデーション
2. generateLeaveGrantsIfNeeded() で付与を最新化（取得日を基準）
3. consumeLeave() で古い付与分から消化
4. leaveUsages に取得履歴を追加
5. createdBy にログイン中ユーザーIDを設定
```

---

## 関数仕様（employeeService.js）

| 関数 | 説明 |
|------|------|
| `getAllEmployees()` | 全社員を返す |
| `getEmployeeById(id)` | IDで社員を返す（存在しない場合 null） |
| `createEmployee(data)` | 社員新規作成（usersも同時作成） |
| `updateEmployee(id, data)` | 社員更新（usersも同期） |
| `deleteEmployee(id)` | 論理削除（status を retired に変更） |
| `searchEmployees(keyword, status)` | キーワード・ステータスで検索 |

---

## 関数仕様（validation.js）

| 関数 | 戻り値形式 |
|------|-----------|
| `validateLoginForm(email, password)` | `{ valid, errors: { email?, password? } }` |
| `validateEmployeeForm(data, options)` | `{ valid, errors: { name?, email?, password?, hireDate?, retirementDate? } }` |
| `validateLeaveUsageForm(data)` | `{ valid, errors: { employeeId?, usageDate?, usedDays? } }` |

`options` の形式：
```js
{ mode: "create" | "edit", employeeId: "emp_xxx" }
```
編集時は自分自身のメールアドレスを重複扱いしない。

---

## コンソールテスト例

```js
// 有給計算
calculateFirstGrantDate("2024-04-01")          // "2024-10-01"
calculateGrantDays("2024-04-01", "2024-10-01") // 10
calculateGrantDays("2024-04-01", "2025-10-01") // 11
calculateGrantDays("2024-04-01", "2035-10-01") // 20
calculateExpireDate("2024-10-01")              // "2026-10-01"
calculateNextGrantDate("2024-04-01", "2026-05-30") // "2026-10-01"

// 社員
getAllEmployees()           // 配列
getEmployeeById("emp_001") // 山田 太郎

// 有給履歴
getLeaveGrantHistory("emp_001") // grantDate 昇順
getLeaveUsageHistory("emp_001") // usageDate 降順

// サマリー
calculateLeaveSummary("emp_001", "2026-05-30")
// → { totalGrantedDays: 21, totalUsedDays: 2, activeRemainingDays: 19, ... }

// 有給取得登録
registerLeaveUsage("emp_001", "2026-06-10", 1, "テスト")
// → { success: true, usage: {...} }
```
