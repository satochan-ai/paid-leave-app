# 有給休暇管理アプリ

社員の有給休暇を管理する社内プロトタイプWebアプリです。  
HTML / CSS / JavaScript のみで動作し、バックエンドは不要です。

---

## アプリ概要

- 管理者は全社員の有給情報を管理できます
- 社員はログイン後、自分の有給休暇情報のみ閲覧できます
- データは localStorage に保存されます（サーバー不要）

---

## 技術構成

| 項目 | 内容 |
|------|------|
| フロントエンド | HTML / CSS / JavaScript（バニラ） |
| データ保存 | localStorage |
| 認証 | localStorageを使った簡易認証 |
| バックエンド | なし |
| 用途 | 社内プロトタイプ |

---

## フォルダ構成

```
paid-leave-app/
│
├── index.html              # ログイン画面
├── README.md
│
├── assets/
│   ├── css/
│   │   ├── base.css        # 基本スタイル
│   │   ├── layout.css      # レイアウト（ヘッダー・サイドバー）
│   │   ├── components.css  # 共通部品（ボタン・テーブル・カード）
│   │   ├── pages.css       # 画面固有スタイル
│   │   └── responsive.css  # レスポンシブ対応
│   │
│   └── js/
│       ├── app.js              # アプリ全体の初期化
│       ├── auth.js             # 認証処理
│       ├── storage.js          # localStorage操作
│       ├── seed.js             # 初期データ投入
│       ├── utils.js            # 共通ユーティリティ
│       ├── leaveCalculator.js  # 有給計算ロジック
│       ├── leaveService.js     # 有給データ操作
│       ├── employeeService.js  # 社員データ操作
│       ├── validation.js       # 入力バリデーション
│       └── routerGuard.js      # アクセス制御
│
├── pages/
│   ├── admin/
│   │   ├── dashboard.html       # 管理者ダッシュボード
│   │   ├── employees.html       # 社員一覧
│   │   ├── employee-form.html   # 社員追加・編集
│   │   ├── employee-detail.html # 社員詳細
│   │   └── leave-usage-form.html # 有給取得登録
│   │
│   └── employee/
│       └── mypage.html          # 社員マイページ
│
└── docs/
    ├── requirements.md    # 要件定義書
    ├── screen_design.md   # 画面設計書
    ├── data_model.md      # データ設計書
    ├── logic_spec.md      # 有給計算ロジック仕様書
    └── security_notes.md  # セキュリティ注意事項
```

---

## 初期ログイン情報

### 管理者アカウント

| 項目 | 値 |
|------|----|
| メールアドレス | admin@example.com |
| パスワード | admin123 |
| 権限 | admin |

### サンプル社員アカウント

| 項目 | 値 |
|------|----|
| メールアドレス | yamada@example.com |
| パスワード | password123 |
| 権限 | employee |

---

## 起動方法

バックエンド不要のため、HTMLファイルを直接ブラウザで開くだけで動作します。

### 方法1：ファイルを直接開く

```
index.html をブラウザにドラッグ＆ドロップ
```

### 方法2：VS Code の Live Server を使う（推奨）

1. VS Code に「Live Server」拡張機能をインストール
2. `index.html` を右クリック → 「Open with Live Server」
3. ブラウザが自動で開きます

### 方法3：ローカルサーバーを立てる

```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve .
```

---

## 有給付与ルール

| 勤続 | 付与日数 |
|------|---------|
| 入社6か月後（1回目） | 10日 |
| 1年6か月後（2回目） | 11日 |
| 2年6か月後（3回目） | 12日 |
| 3年6か月後（4回目） | 14日 |
| 4年6か月後（5回目） | 16日 |
| 5年6か月後（6回目） | 18日 |
| 6年6か月後以降（7回目〜） | 20日 |

- 付与日から2年で失効
- 取得時は古い付与分から順に消化

---

## 注意事項

このアプリはlocalStorageを使ったプロトタイプです。
パスワードもlocalStorage上で管理しているため、本番運用には適していません。

本番利用する場合は、以下のようなバックエンド認証・DB管理への移行が必要です。

- Supabase
- Firebase
- Google Apps Script + Googleアカウント認証
- PHP + MySQL
- Node.js + DB

詳細は `docs/security_notes.md` を参照してください。

- **データはブラウザのlocalStorageに保存されます**  
  ブラウザのキャッシュをクリアするとデータが消えます。

- **複数端末でのデータ共有はできません**  
  localStorageは端末・ブラウザ単位のため、別端末からは同じデータを見られません。

---

---

## MVP完成範囲

このアプリは、HTML/CSS/JavaScript/localStorageで作成した有給休暇管理アプリのMVPです。

### 管理者ができること

- ログイン
- 社員一覧確認
- 社員追加
- 社員編集
- 社員詳細確認
- 有給取得登録
- 有給残日数確認
- 付与履歴確認
- 取得履歴確認
- 退職扱い

### 社員ができること

- ログイン
- 自分の有給残日数確認
- 自分の付与履歴確認
- 自分の取得履歴確認
- 次回付与日確認
- 直近失効予定確認

### 対応済み有給ルール

- 入社6か月後に10日付与
- 以後、法定付与日数に従って付与
- 付与日から2年で失効
- 有給取得時は古い付与分から消化
- 半休0.5日に対応

### 法定付与日数

| 継続勤務年数 | 付与日数 |
|---:|---:|
| 0.5年 | 10日 |
| 1.5年 | 11日 |
| 2.5年 | 12日 |
| 3.5年 | 14日 |
| 4.5年 | 16日 |
| 5.5年 | 18日 |
| 6.5年以上 | 20日 |

---

## 実装済み機能

### Round 1：共通基盤
- localStorage による全データの読み書き（storage.js）
- 初期データ自動投入（seed.js）
- メール＋パスワードによる簡易ログイン・ログアウト（auth.js）
- 権限別リダイレクト・アクセス制御（routerGuard.js）

### Round 2：業務ロジック
- 有給付与日・付与日数・失効日の計算（leaveCalculator.js）
- 有給サマリー計算（残日数・失効予定・次回付与など）
- 入社日〜現在日の未付与分を自動生成（generateLeaveGrantsIfNeeded）
- 古い付与分から順に消化する取得登録（registerLeaveUsage）
- 社員CRUD・論理削除・検索（employeeService.js）
- フォームバリデーション（validation.js）

### Round 3：管理者画面の本格描画
- 管理者ダッシュボード（KPIカード6種・失効予定アラート一覧）
- 社員一覧画面（全列表示・キーワード検索・ステータス絞り込み・退職扱い操作）
- 社員詳細画面（基本情報・有給サマリー8種・付与履歴・取得履歴）

### Round 4：入力フォームの本格実装
- 社員追加（employees・users同時作成、employeeId紐づけ）
- 社員編集（employees・users同期更新）
- 有給取得登録（0.5日半休対応、古い付与分から消化、残日数不足エラー）
- フィールド単位バリデーションエラー表示
- 対象社員情報カード（現在の残日数・直近失効日など）

### Round 5：社員マイページ
- 自分の氏名・メール・入社日・ステータス表示
- 有給残日数・次回付与日・直近失効日表示
- 付与履歴・取得履歴表示

### Round 6：MVP仕上げ
- プロトタイプ注意書き表示
- デモデータ初期化機能（管理者のみ）
- 管理者マイページアクセス時の適切なメッセージ表示
- ドキュメント整備

---

## コンソールテスト方法

管理者でログイン後、ブラウザの開発者ツール（F12）→ Console タブで実行できます。

```js
// 有給計算
calculateFirstGrantDate("2024-04-01")              // "2024-10-01"
calculateGrantDays("2024-04-01", "2024-10-01")     // 10
calculateGrantDays("2024-04-01", "2025-10-01")     // 11
calculateNextGrantDate("2024-04-01", "2026-05-30") // "2026-10-01"
calculateExpireDate("2024-10-01")                  // "2026-10-01"

// 社員
getAllEmployees()
getEmployeeById("emp_001")

// 有給履歴
getLeaveGrantHistory("emp_001") // grantDate 昇順
getLeaveUsageHistory("emp_001") // usageDate 降順

// 有給サマリー
calculateLeaveSummary("emp_001", "2026-05-30")
// { totalGrantedDays: 21, activeRemainingDays: 19, nextGrantDate: "2026-10-01", ... }

// 有給取得登録
registerLeaveUsage("emp_001", "2026-06-10", 1, "テスト取得")
// { success: true, usage: {...} }
```

---

## 今後の拡張予定

- [ ] 有給申請ワークフロー（社員が申請→管理者が承認）
- [ ] 休職期間の考慮（付与日数の按分計算）
- [ ] 出勤率8割判定
- [ ] メール通知（失効予定アラート）
- [ ] バックエンド移行（Supabase / Firebase / GAS / PHP / Node.js）
- [ ] パスワードハッシュ化
- [ ] 帳票出力（PDF・Excel・CSV）
- [ ] 勤怠システム連携
- [ ] 自動バックアップ
