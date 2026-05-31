# バックアップ / 復元仕様書

## 目的

localStorageに保存されている有給休暇管理アプリのデータをJSON形式でバックアップ・復元する。
ブラウザ変更・PC変更・データ破損時の復元、およびデモデータ初期化前の退避に利用する。

## バックアップ対象

| localStorageキー | 内容 |
|-----------------|------|
| `paidLeave_users` | ユーザー（ログイン情報） |
| `paidLeave_employees` | 社員マスタ |
| `paidLeave_leaveGrants` | 有給付与履歴 |
| `paidLeave_leaveUsages` | 有給取得履歴 |
| `paidLeave_leaveOfAbsences` | 休職履歴 |

## バックアップ対象外

| localStorageキー | 理由 |
|-----------------|------|
| `paidLeave_currentUser` | ログインセッション情報のため。復元後は再ログインさせる方が安全 |

## ファイル形式

JSON（UTF-8、インデント付き整形出力）

## ファイル名

```
paid_leave_backup_YYYYMMDD_HHMMSS.json
```

## JSON構造

```json
{
  "appName": "paid-leave-app",
  "version": "1.0.0",
  "exportedAt": "2026-05-31T23:59:59.000Z",
  "data": {
    "users": [],
    "employees": [],
    "leaveGrants": [],
    "leaveUsages": [],
    "leaveOfAbsences": []
  }
}
```

## バリデーション仕様

復元前に以下を確認する。いずれかが不正な場合は復元を中止する。

- `data` がオブジェクトである
- `appName` が `"paid-leave-app"` である
- `data.data` が存在する
- `data.data.users` が配列である
- `data.data.employees` が配列である
- `data.data.leaveGrants` が配列である
- `data.data.leaveUsages` が配列である
- `data.data.leaveOfAbsences` が配列である

## 復元時の動作

1. 管理者権限を確認する
2. バリデーションを実行する
3. 確認ダイアログ（confirm）を表示する
4. OKの場合、対象キーを上書き保存する
5. `paidLeave_currentUser` を削除する
6. ログイン画面へリダイレクトする

## 権限

管理者のみ利用可能（`isAdmin()` で確認）

## 実装ファイル

- `assets/js/backupService.js` - バックアップ/復元処理
- `assets/js/app.js` - UIバインド（`bindBackupRestoreActions()`）
- `pages/admin/dashboard.html` - データ管理セクション

## 備考

`formatBackupDateTime()` と `csvService.js` の `formatCsvDateTime()` は同等の実装が重複している。
将来的な整理時に `utils.js` へ共通化することを推奨する。
