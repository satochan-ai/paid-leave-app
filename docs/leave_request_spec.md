# 有給申請・承認フロー仕様書

## 目的

社員が自分のマイページから有給取得を申請し、管理者が承認・却下できる機能。  
承認したタイミングで有給取得履歴に反映し、残日数を消化する。

---

## 申請ステータス

| ステータス | 値 | 説明 |
|-----------|-----|------|
| 申請中 | pending | 申請後・処理前 |
| 承認済み | approved | 管理者が承認済み |
| 却下 | rejected | 管理者が却下済み |
| 取消 | cancelled | データ定義のみ（未実装） |

---

## フロー

```
社員がマイページで申請
  ↓ createLeaveRequest() → leaveRequests に pending で保存
  ↓ ※この時点では残日数を変更しない

管理者が申請一覧で確認
  ↓ leave-requests.html

管理者が承認
  ↓ approveLeaveRequest() → registerLeaveUsage() → leaveUsages に登録・残日数消化
  ↓ status を approved に更新

管理者が却下
  ↓ rejectLeaveRequest() → status を rejected に更新・rejectReason を保存
  ↓ ※残日数は変更しない
```

---

## 重要ルール

- **申請時は残日数を変更しない**
- **承認時のみ** `registerLeaveUsage()` を呼び出して残日数を消化する
- 却下時は残日数を一切変更しない

---

## バリデーション（validateLeaveRequestForm）

| チェック項目 | 詳細 |
|------------|------|
| employeeId | 必須 |
| usageDate | 必須・今日以降の日付 |
| usedDays | 必須・0.5単位の正の数 |
| 退職済みチェック | 退職済み社員は申請不可 |
| 残日数チェック | 取得希望日時点の残日数が不足している場合は申請不可 |
| 重複申請チェック | 同一社員・同一日付で pending または approved が存在する場合は申請不可 |

---

## データ構造（leaveRequests）

```json
{
  "id": "request_xxx",
  "employeeId": "emp_001",
  "requestDate": "2026-06-01",
  "usageDate": "2026-06-10",
  "usedDays": 1,
  "reason": "私用のため",
  "status": "pending",
  "approvedBy": "",
  "approvedAt": "",
  "rejectedBy": "",
  "rejectedAt": "",
  "rejectReason": "",
  "createdAt": "2026-06-01T10:00:00.000Z",
  "updatedAt": "2026-06-01T10:00:00.000Z"
}
```

---

## 関数仕様

| 関数 | 説明 |
|------|------|
| `createLeaveRequest(employeeId, usageDate, usedDays, reason)` | 申請を作成・保存する |
| `getLeaveRequestsByEmployeeId(employeeId)` | 社員の申請一覧を返す（申請日降順） |
| `getAllLeaveRequests()` | 全申請を返す（申請日降順） |
| `getLeaveRequestById(requestId)` | IDで申請を返す |
| `approveLeaveRequest(requestId)` | 申請を承認し有給取得履歴へ反映する |
| `rejectLeaveRequest(requestId, rejectReason)` | 申請を却下する |
| `getLeaveRequestStatusLabel(status)` | ステータスラベルを返す |
| `getLeaveRequestStatusBadgeClass(status)` | バッジCSSクラスを返す |
| `getPendingLeaveRequestCount()` | 未承認申請数を返す |

---

## 未実装（今後の拡張予定）

- 申請取消機能（cancelled ステータスは定義済み）
- 有給申請履歴CSV出力
- メール通知（申請・承認・却下時）
- 承認依頼通知
- カレンダー連携
- 複数日まとめて申請
- 代理申請
