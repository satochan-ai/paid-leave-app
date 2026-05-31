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

## 7. GitHub Pages（オプション）

GitHub Pagesで公開する場合の追加確認：

- [ ] リポジトリをPublicに設定する
- [ ] Settings → Pages → Source を `main` ブランチ / `/(root)` に設定する
- [ ] 公開URL（`https://ユーザー名.github.io/リポジトリ名/`）でアクセスできる
- [ ] `README.md` に公開URLを追記する

**注意：** GitHub PagesでもlocalStorageは閲覧者のブラウザごとに独立しています。
管理者と社員のデータがサーバーで共有されるわけではありません。
