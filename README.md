# 有給休暇管理アプリ

社員の有給休暇を管理する社内プロトタイプWebアプリです。  
HTML / CSS / JavaScript のみで動作し、バックエンドは不要です。

---

## アプリ概要

| 項目 | 内容 |
|------|------|
| 用途 | 社内の有給休暇付与・取得・残日数の管理 |
| 対象ユーザー | 管理者・社員 |
| データ保存 | localStorage（サーバー不要） |
| 動作環境 | モダンブラウザ（Chrome / Edge / Firefox / Safari） |

- 管理者は全社員の有給情報を管理できます
- 社員はログイン後、自分の有給休暇情報のみ閲覧できます

---

## 技術構成

| 項目 | 内容 |
|------|------|
| フロントエンド | HTML / CSS / JavaScript（バニラ） |
| データ保存 | localStorage |
| 認証 | localStorageを使った簡易認証 |
| バックエンド | なし |

---

## 主な機能

### 管理者ができること

- 全社員の有給残日数・付与状況を一覧確認
- 社員の追加・編集・退職扱い
- 有給取得登録（1日・半休0.5日対応）
- 有給付与チェック（入社日から自動計算・不足分を補完）
- 社員別の仮ログイン情報確認
- CSV出力（社員一覧・有給残日数・取得履歴・社員別詳細）
- JSONバックアップ・復元
- デモデータ初期化

### 社員ができること

- 自分の有給残日数確認（大きく表示）
- 次回付与日・次回付与日数確認
- 直近失効日・直近失効日数確認
- 付与履歴・取得履歴確認

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
│       ├── app.js              # アプリ全体の初期化・描画
│       ├── auth.js             # 認証処理
│       ├── storage.js          # localStorage操作
│       ├── seed.js             # 初期データ投入
│       ├── utils.js            # 共通ユーティリティ
│       ├── leaveCalculator.js  # 有給計算ロジック
│       ├── leaveService.js     # 有給データ操作
│       ├── employeeService.js  # 社員データ操作
│       ├── validation.js       # 入力バリデーション
│       ├── routerGuard.js      # アクセス制御
│       ├── csvService.js       # CSV出力
│       └── backupService.js    # JSONバックアップ/復元
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
    ├── requirements.md          # 要件定義書
    ├── screen_design.md         # 画面設計書
    ├── data_model.md            # データ設計書
    ├── logic_spec.md            # 有給計算ロジック仕様書
    ├── security_notes.md        # セキュリティ注意事項
    ├── csv_export_spec.md       # CSV出力仕様書
    ├── backup_restore_spec.md   # バックアップ/復元仕様書
    ├── leave_grant_check_spec.md # 有給付与チェック仕様書
    ├── operation_checklist.md   # 動作確認チェックリスト
    ├── demo_scenario.md         # デモシナリオ
    ├── screenshot_guide.md      # スクリーンショット撮影ガイド
    ├── screenshot_checklist.md  # スクリーンショット撮影チェックリスト
    ├── known_limitations.md     # 既知の制限事項
    ├── future_roadmap.md        # 今後の拡張予定
    ├── final_qa_report.md       # 最終QAレポート
    ├── portfolio_summary.md     # ポートフォリオ概要
    ├── presentation_outline.md  # 説明構成案
    ├── demo_talk_script.md      # デモ台本
    └── round6_mvp_summary.md    # MVP完成サマリー
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
- 半休（0.5日）対応

---

## MVP完成範囲

このアプリは、HTML/CSS/JavaScript/localStorageで作成した有給休暇管理アプリのMVPです。

### 対応済み有給ルール

- 入社6か月後に10日付与
- 以後、法定付与日数に従って付与
- 付与日から2年で失効
- 有給取得時は古い付与分から消化
- 半休0.5日に対応

---

## 仮ログイン情報について

社員追加後、管理者は社員詳細画面で以下を確認できます。

- ログインID
- 仮パスワード
- 権限

この情報はプロトタイプ用です。本番運用ではパスワードの平文表示は行わないでください。

---

## 実装済み機能

| Round | 内容 |
|-------|------|
| Round 1 | localStorage基盤・ログイン・ログアウト・権限制御 |
| Round 2 | 有給計算ロジック・法定付与日数・2年失効・社員CRUD |
| Round 3 | 管理者ダッシュボード・社員一覧・社員詳細 |
| Round 4 | 社員追加・社員編集・有給取得登録・バリデーション |
| Round 5 | 社員マイページ |
| Round 6 | MVP仕上げ・プロトタイプ注意書き・デモデータ初期化 |
| Round 7 | CSV出力（社員一覧・有給残日数・取得履歴・社員別詳細） |
| Round 8 | JSONバックアップ・復元 |
| Round 8.5 | 仮ログイン情報表示（社員詳細） |
| Round 9 | 有給付与チェック（全社員・社員別） |
| Round 10 | UI改善（ログイン画面・ダッシュボード・クイックアクション） |

---

## 未対応機能

- 本番認証・パスワードハッシュ化
- サーバーDB保存
- 有給申請承認フロー
- メール通知
- 出勤率8割判定
- 休職期間を考慮した厳密計算
- CSVインポート
- PDF・Excel出力
- 自動バックアップ

詳細は `docs/known_limitations.md` / `docs/future_roadmap.md` を参照してください。

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

## ドキュメント一覧

| ファイル | 内容 |
|---------|------|
| `docs/requirements.md` | 要件定義書 |
| `docs/screen_design.md` | 画面設計書 |
| `docs/data_model.md` | データ設計書 |
| `docs/logic_spec.md` | 有給計算ロジック仕様書 |
| `docs/security_notes.md` | セキュリティ注意事項 |
| `docs/csv_export_spec.md` | CSV出力仕様書 |
| `docs/backup_restore_spec.md` | バックアップ/復元仕様書 |
| `docs/leave_grant_check_spec.md` | 有給付与チェック仕様書 |
| `docs/operation_checklist.md` | 動作確認チェックリスト |
| `docs/demo_scenario.md` | デモシナリオ |
| `docs/demo_talk_script.md` | デモ台本 |
| `docs/screenshot_guide.md` | スクリーンショット撮影ガイド |
| `docs/screenshot_checklist.md` | スクリーンショット撮影チェックリスト |
| `docs/known_limitations.md` | 既知の制限事項 |
| `docs/future_roadmap.md` | 今後の拡張予定 |
| `docs/final_qa_report.md` | 最終QAレポート |
| `docs/portfolio_summary.md` | ポートフォリオ概要 |
| `docs/presentation_outline.md` | 説明構成案 |
| `docs/round6_mvp_summary.md` | MVP完成サマリー |

---

## ポートフォリオ説明資料

以下の資料を `docs/` 配下に整理しています。

| ファイル | 用途 |
|---------|------|
| `docs/portfolio_summary.md` | ポートフォリオ・GitHubに掲載する概要 |
| `docs/presentation_outline.md` | 社内説明・面談時の説明構成 |
| `docs/screenshot_checklist.md` | スクリーンショット撮影チェックリスト |
| `docs/demo_talk_script.md` | デモ時の台本（管理者・社員・QA対応） |

---

## 今後の拡張予定

- 有給申請ワークフロー（社員が申請→管理者が承認）
- 出勤率8割判定
- メール通知（失効予定アラート）
- バックエンド移行（Supabase / Firebase / GAS / PHP / Node.js）
- パスワードハッシュ化
- 帳票出力（PDF・Excel・CSV一括）
- 勤怠システム連携

詳細は `docs/future_roadmap.md` を参照してください。

---

## コンソールテスト方法

管理者でログイン後、ブラウザの開発者ツール（F12）→ Console タブで実行できます。

```js
// 有給計算
calculateFirstGrantDate("2024-04-01")              // "2024-10-01"
calculateGrantDays("2024-04-01", "2024-10-01")     // 10
calculateNextGrantDate("2024-04-01", "2026-05-30") // "2026-10-01"
calculateExpireDate("2024-10-01")                  // "2026-10-01"

// 社員
getAllEmployees()
getEmployeeById("emp_001")
getUserByEmployeeId("emp_001")

// 有給履歴
getLeaveGrantHistory("emp_001")
getLeaveUsageHistory("emp_001")

// 有給サマリー
calculateLeaveSummary("emp_001", "2026-05-30")

// 有給取得登録
registerLeaveUsage("emp_001", "2026-06-10", 1, "テスト取得")

// 有給付与チェック
generateLeaveGrantsForAllEmployees("2026-05-31")

// バックアップ
getBackupData()
```
