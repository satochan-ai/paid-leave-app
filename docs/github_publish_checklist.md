# GitHub公開前チェックリスト

## 1. 基本確認

- [ ] `index.html` が存在する
- [ ] `README.md` が整備されている
- [ ] `docs/` 配下の資料が整理されている
- [ ] 不要な一時ファイル（`.DS_Store`、`Thumbs.db`、`*.tmp` など）が含まれていない
- [ ] ブラウザコンソールエラーがない
- [ ] 実在の個人情報・機密情報が含まれていない

## 2. 起動確認

- [ ] `python -m http.server 8080` で起動できる
- [ ] `http://localhost:8080` でログイン画面が表示される
- [ ] 管理者（`admin@example.com` / `admin123`）でログインできる
- [ ] 社員（`yamada@example.com` / `password123`）でログインできる
- [ ] ログアウトできる

## 3. セキュリティ注意書き

- [ ] localStorageプロトタイプであることを `README.md` に明記している
- [ ] パスワード平文保存であることを明記している
- [ ] 本番利用不可であることを明記している
- [ ] 本番化時の改善案を記載している
- [ ] `docs/security_notes.md` にGitHub公開時の注意を記載している

## 4. 主要機能のデモ確認

- [ ] 管理者ダッシュボードが表示される（KPIカード・クイックアクション）
- [ ] 社員一覧が表示される
- [ ] 社員詳細が表示される（基本情報・有給サマリー・付与/取得履歴）
- [ ] 仮ログイン情報カードが表示される
- [ ] 社員マイページが表示される
- [ ] CSV出力できる（Excelで日本語が文字化けしない）
- [ ] バックアップ/復元セクションが表示される
- [ ] 有給付与チェックが実行できる
- [ ] デモデータ初期化が「⚠ 危険操作」セクションに表示される

## 5. ドキュメント確認

- [ ] `docs/local_setup_guide.md` が存在する（起動方法が明確）
- [ ] `docs/demo_scenario.md` が存在する
- [ ] `docs/known_limitations.md` が存在する
- [ ] `docs/security_notes.md` が存在する
- [ ] `docs/portfolio_summary.md` が存在する

## 6. Git確認

- [ ] `git status` でuntracked/modified なファイルがない
- [ ] 最新の変更がコミットされている
- [ ] コミットメッセージが分かりやすい
- [ ] `.gitignore` が適切に設定されている（node_modules 等があれば）

## 7. GitHub Pages（Round18完了）

- [x] リポジトリをPublicに設定済み
- [x] Settings → Pages → Source を `main` ブランチ / `/(root)` に設定
- [x] 公開URL：https://satochan-ai.github.io/paid-leave-app/
- [x] `README.md` に公開URLを追記済み

**注意：** GitHub PagesでもlocalStorageは閲覧者のブラウザごとに独立しています。
管理者と社員のデータがサーバーで共有されるわけではありません。

---

## 8. .gitignore 確認

- [ ] `.gitignore` が存在する
- [ ] `node_modules/` が除外されている
- [ ] `.env` が除外されている
- [ ] ログファイル（`*.log`）が除外されている
- [ ] `docs/images/*.png` は除外されていない（README 表示に必要）

## 9. スクリーンショット確認

- [ ] `docs/images/01_login.png` が存在する
- [ ] `docs/images/02_admin_dashboard.png` が存在する
- [ ] `docs/images/03_employee_list.png` が存在する
- [ ] `docs/images/04_employee_detail.png` が存在する
- [ ] `docs/images/07_employee_mypage.png` が存在する
- [ ] GitHub 上で README の画像が表示される

## 10. package.json 確認

- [ ] `npm install` が実行できる
- [ ] `npm run screenshots` が実行できる（外部サーバー不要）
- [ ] 不要な依存関係が含まれていない（playwright のみ devDependencies）
- [ ] `node_modules/` が Git 管理に入っていない（`git status` で確認）

---

## 11. README 最終確認

- [ ] README 冒頭に本番利用不可の `[!IMPORTANT]` 注意書きがある
- [ ] デモ用ログイン情報の `[!WARNING]` 注意書きがある
- [ ] 初期ログイン情報が表形式で整理されている
- [ ] 「これらはデモ用の固定ログイン情報です。」の注記がある
- [ ] スクリーンショット画像（5枚）が README 上で表示される
- [ ] 起動方法（Python/Live Server）が明記されている
- [ ] `file://` 非推奨の注意書きがある
- [ ] 未実装機能が明記されている（申請フロー・メール通知など）

## 12. 公開情報確認

- [ ] 実在の個人情報が含まれていない
- [ ] 実在の会社情報が含まれていない
- [ ] 本番用パスワードが含まれていない
- [ ] `.env` が含まれていない
- [ ] `node_modules/` が含まれていない
- [ ] すべてのデータがデモ用であることが分かる

---

## 最終 git 確認手順

```bash
git status       # node_modules/ が表示されないことを確認
git add .
git commit -m "Round16: GitHub publish cleanup"
```
