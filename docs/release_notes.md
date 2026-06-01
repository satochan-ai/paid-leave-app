# リリースノート

有給休暇管理アプリの開発履歴です。

---

## Round 1：基盤実装

- localStorage基盤（`storage.js`）
- 初期データ自動投入（`seed.js`）
- メール＋パスワードによる簡易ログイン・ログアウト
- 管理者/社員の権限制御・ページ遷移制御（`routerGuard.js`）

---

## Round 2：有給計算・社員CRUD

- 法定有給付与日数対応（0.5年：10日〜6.5年以上：20日）
- 付与日から2年で失効
- 入社日から未付与分を自動生成（`generateLeaveGrantsIfNeeded`）
- 社員CRUD・論理削除・検索（`employeeService.js`）
- 有給取得登録ロジック・古い付与分から消化
- 半休0.5日対応
- フォームバリデーション（`validation.js`）

---

## Round 3：管理者閲覧画面

- 管理者ダッシュボード（KPIカード6種・失効予定アラート）
- 社員一覧（キーワード検索・ステータス絞り込み・退職扱い）
- 社員詳細（基本情報・有給サマリー8種・付与履歴・取得履歴）

---

## Round 4：登録・更新画面

- 社員追加（employees・users同時作成・employeeId紐づけ）
- 社員編集（employees・users同期更新）
- 有給取得登録（半休対応・残日数不足エラー）
- フィールド単位バリデーションエラー表示

---

## Round 5：社員マイページ

- 社員本人の有給残日数・次回付与日・直近失効日表示
- 付与履歴・取得履歴表示
- 管理者がマイページにアクセスした場合の専用メッセージ

---

## Round 6：MVP仕上げ

- ログイン画面にプロトタイプ注意書き追加
- デモデータ初期化機能（管理者のみ）
- `docs/operation_checklist.md` 作成
- `docs/round6_mvp_summary.md` 作成

---

## Round 7：CSV出力

- 社員一覧CSV（`exportEmployeesCsv`）
- 有給残日数CSV（`exportLeaveSummaryCsv`）
- 有給取得履歴CSV（`exportLeaveUsagesCsv`）
- 社員別詳細CSV（`exportEmployeeDetailCsv`）
- BOM付きUTF-8でExcel対応
- `docs/csv_export_spec.md` 作成

---

## Round 8：バックアップ/復元

- JSONバックアップダウンロード（`downloadBackupJson`）
- バックアップファイル形式バリデーション（`validateBackupData`）
- JSON復元（`restoreBackupData`）
- currentUserをバックアップ対象外に設定
- 復元後にログアウト・ログイン画面へリダイレクト
- `docs/backup_restore_spec.md` 作成

---

## Round 8.5：仮ログイン情報表示

- 社員詳細画面にログイン情報カード追加（管理者のみ）
- ログインID・仮パスワード・権限を表示
- プロトタイプ警告文表示
- `getUserByEmployeeId` 実装

---

## Round 9：有給付与チェック

- 全社員付与チェック（`generateLeaveGrantsForAllEmployees`）
- 社員別付与チェック（`generateLeaveGrantsForEmployee`）
- 重複付与防止（同一 employeeId + grantDate は作成しない）
- 退職者は対象外
- ダッシュボード・社員詳細に実行UIを追加
- `docs/leave_grant_check_spec.md` 作成

---

## Round 10：UI改善

- ログイン画面にサブタイトル・デモログイン情報カード追加
- ダッシュボードにクイックアクションカード5種追加
- ダッシュボードのセクション順整理（KPI→クイックアクション→失効予定→付与チェック→CSV→データ管理→⚠危険操作）
- 「⚠ 危険操作」としてデモデータ初期化を明確分離
- サイドバーに社員追加リンク追加
- `.quick-action-card`・`.login-demo-card` などCSSクラス追加

---

## Round 11：QA・デモ資料

- `docs/demo_scenario.md` 作成（管理者10手順・社員5手順）
- `docs/screenshot_guide.md` 作成
- `docs/known_limitations.md` 作成
- `docs/future_roadmap.md` 作成
- `docs/final_qa_report.md` 作成（58項目）
- `docs/operation_checklist.md` 更新（Round10対応）
- `README.md` 完成版に全面更新

---

## Round 12：ポートフォリオ資料

- `docs/portfolio_summary.md` 作成
- `docs/presentation_outline.md` 作成
- `docs/screenshot_checklist.md` 作成（11画面）
- `docs/demo_talk_script.md` 作成（台本・QA）
- `docs/screenshot_guide.md` 更新（Round10対応）
- `README.md` にポートフォリオ説明資料セクション追加

---

## Round 18：GitHub公開・公開後確認

- GitHubリポジトリ（satochan-ai/paid-leave-app）をpublicで公開
- masterブランチをmainにリネームしてpush
- GitHub Pages設定（main / root）
- READMEにデモURL追加（https://satochan-ai.github.io/paid-leave-app/）
- `docs/github_pages_check_report.md` 作成
- `docs/github_publish_checklist.md` にRound18完了状況追記

---

## Round 17：GitHub公開前最終確認

- README 冒頭に `[!IMPORTANT]` / `[!WARNING]` 注意書き追加
- 初期ログイン情報に「デモ用固定情報」の注記追加
- スクリーンショット枠の「準備中」文言を削除（実際の画像が配置済みのため）
- 「未実装機能」セクションを README に追加
- `docs/known_limitations.md` に未実装機能テーブルを追加
- `docs/portfolio_summary.md` に「公開時の位置づけ」追加
- `docs/github_publish_checklist.md` にセクション11・12を追加

## Round 16：GitHub公開前整理

- `.gitignore` に Playwright artifacts を追記
- `package.json` に `screenshots` スクリプト追加・`devDependencies` に移動・`type: module` に変更
- `scripts/take_screenshots.mjs` を内蔵 HTTP サーバー付きに改修（外部サーバー不要）
- `README.md` にスクリーンショット撮影手順（`npm run screenshots`）を追記
- `docs/local_setup_guide.md` に撮影手順追記
- `docs/screenshot_guide.md` に自動撮影スクリプト説明追記
- `docs/github_publish_checklist.md` に `.gitignore`・スクリーンショット・package.json 確認項目追加
- `docs/release_notes.md` に Round16 追記

## Round 13：GitHub公開準備

- `README.md` をGitHub公開向けに再整理
- `docs/local_setup_guide.md` 作成
- `docs/github_publish_checklist.md` 作成
- `docs/release_notes.md` 作成（本ファイル）
- `docs/security_notes.md` にGitHub公開時の注意を追記
- `docs/known_limitations.md` に起動方法・GitHub Pages注意を追記
- `README.md` にスクリーンショット枠追加
