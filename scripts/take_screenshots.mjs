/**
 * take_screenshots.mjs
 * Playwrightを使って各画面のスクリーンショットを撮影し docs/images/ に保存する
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'http://localhost:3333';
const IMAGES_DIR = path.join(__dirname, '..', 'docs', 'images');
const VIEWPORT = { width: 1280, height: 900 };

// 管理者のログインセッション
const ADMIN_USER = JSON.stringify({
  id: 'user_admin_001',
  employeeId: null,
  name: '管理者',
  email: 'admin@example.com',
  password: 'admin123',
  role: 'admin',
});

// 社員のログインセッション
const EMPLOYEE_USER = JSON.stringify({
  id: 'user_emp_001',
  employeeId: 'emp_001',
  name: '山田 太郎',
  email: 'yamada@example.com',
  password: 'password123',
  role: 'employee',
});

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT });

  // ─── 1. ログイン画面（未認証） ───────────────────────────────
  {
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/index.html`);
    await page.waitForLoadState('networkidle');
    await wait(500);
    await page.screenshot({ path: `${IMAGES_DIR}/01_login.png`, fullPage: false });
    console.log('✅ 01_login.png');
    await page.close();
  }

  // 管理者セッション用コンテキスト（seedデータ初回投入 → currentUser設定）
  const adminCtx = await browser.newContext({ viewport: VIEWPORT });
  // まずログインページを開いてseedデータを投入する
  const initPage = await adminCtx.newPage();
  await initPage.goto(`${BASE_URL}/index.html`);
  await initPage.waitForLoadState('networkidle');
  // seedデータ確認
  await initPage.evaluate(() => window.initializeSeedData && window.initializeSeedData());
  // currentUser を設定
  await initPage.evaluate((u) => localStorage.setItem('paidLeave_currentUser', u), ADMIN_USER);
  await initPage.close();

  // ─── 2. 管理者ダッシュボード ─────────────────────────────────
  {
    const page = await adminCtx.newPage();
    await page.goto(`${BASE_URL}/pages/admin/dashboard.html`);
    await page.waitForLoadState('networkidle');
    await wait(800);
    await page.screenshot({ path: `${IMAGES_DIR}/02_admin_dashboard.png`, fullPage: false });
    console.log('✅ 02_admin_dashboard.png');
    await page.close();
  }

  // ─── 3. 社員一覧 ────────────────────────────────────────────
  {
    const page = await adminCtx.newPage();
    await page.goto(`${BASE_URL}/pages/admin/employees.html`);
    await page.waitForLoadState('networkidle');
    await wait(600);
    await page.screenshot({ path: `${IMAGES_DIR}/03_employee_list.png`, fullPage: false });
    console.log('✅ 03_employee_list.png');
    await page.close();
  }

  // ─── 4. 社員詳細 ────────────────────────────────────────────
  {
    const page = await adminCtx.newPage();
    await page.goto(`${BASE_URL}/pages/admin/employee-detail.html?id=emp_001`);
    await page.waitForLoadState('networkidle');
    await wait(600);
    await page.screenshot({ path: `${IMAGES_DIR}/04_employee_detail.png`, fullPage: false });
    console.log('✅ 04_employee_detail.png');

    // ─── 5. 仮ログイン情報カード（社員詳細の一部をスクロールして撮影）──
    const loginCard = page.locator('#loginInfoCard');
    if (await loginCard.count() > 0) {
      await loginCard.scrollIntoViewIfNeeded();
      await wait(300);
      await page.screenshot({ path: `${IMAGES_DIR}/05_login_info_card.png`, fullPage: false });
      console.log('✅ 05_login_info_card.png');
    } else {
      // カードが見えない場合はそのままスクショ
      await page.screenshot({ path: `${IMAGES_DIR}/05_login_info_card.png`, fullPage: false });
      console.log('✅ 05_login_info_card.png (full page fallback)');
    }
    await page.close();
  }

  // ─── 6. 有給取得登録フォーム ────────────────────────────────
  {
    const page = await adminCtx.newPage();
    await page.goto(`${BASE_URL}/pages/admin/leave-usage-form.html?employeeId=emp_001`);
    await page.waitForLoadState('networkidle');
    await wait(600);
    await page.screenshot({ path: `${IMAGES_DIR}/06_leave_usage_form.png`, fullPage: false });
    console.log('✅ 06_leave_usage_form.png');
    await page.close();
  }

  // ─── 7. 社員マイページ（社員セッション）────────────────────
  const empCtx = await browser.newContext({ viewport: VIEWPORT });
  const empInitPage = await empCtx.newPage();
  await empInitPage.goto(`${BASE_URL}/index.html`);
  await empInitPage.waitForLoadState('networkidle');
  await empInitPage.evaluate(() => window.initializeSeedData && window.initializeSeedData());
  await empInitPage.evaluate((u) => localStorage.setItem('paidLeave_currentUser', u), EMPLOYEE_USER);
  await empInitPage.close();

  {
    const page = await empCtx.newPage();
    await page.goto(`${BASE_URL}/pages/employee/mypage.html`);
    await page.waitForLoadState('networkidle');
    await wait(600);
    await page.screenshot({ path: `${IMAGES_DIR}/07_employee_mypage.png`, fullPage: false });
    console.log('✅ 07_employee_mypage.png');
    await page.close();
  }

  // ─── 8. CSV出力セクション（ダッシュボード下部） ─────────────
  {
    const page = await adminCtx.newPage();
    await page.goto(`${BASE_URL}/pages/admin/dashboard.html`);
    await page.waitForLoadState('networkidle');
    await wait(500);
    const csvSection = page.locator('.section').filter({ hasText: 'CSV出力' });
    if (await csvSection.count() > 0) {
      await csvSection.scrollIntoViewIfNeeded();
      await wait(300);
    }
    await page.screenshot({ path: `${IMAGES_DIR}/08_csv_export.png`, fullPage: false });
    console.log('✅ 08_csv_export.png');
    await page.close();
  }

  // ─── 9. バックアップ/復元セクション ────────────────────────
  {
    const page = await adminCtx.newPage();
    await page.goto(`${BASE_URL}/pages/admin/dashboard.html`);
    await page.waitForLoadState('networkidle');
    await wait(500);
    const dataSection = page.locator('.data-management-section');
    if (await dataSection.count() > 0) {
      await dataSection.scrollIntoViewIfNeeded();
      await wait(300);
    }
    await page.screenshot({ path: `${IMAGES_DIR}/09_backup_restore.png`, fullPage: false });
    console.log('✅ 09_backup_restore.png');
    await page.close();
  }

  // ─── 10. 有給付与チェックセクション ─────────────────────────
  {
    const page = await adminCtx.newPage();
    await page.goto(`${BASE_URL}/pages/admin/dashboard.html`);
    await page.waitForLoadState('networkidle');
    await wait(500);
    const grantSection = page.locator('.grant-check-section');
    if (await grantSection.count() > 0) {
      await grantSection.scrollIntoViewIfNeeded();
      await wait(300);
    }
    await page.screenshot({ path: `${IMAGES_DIR}/10_grant_check.png`, fullPage: false });
    console.log('✅ 10_grant_check.png');
    await page.close();
  }

  await empCtx.close();
  await adminCtx.close();
  await context.close();
  await browser.close();
  console.log('\n🎉 全スクリーンショット撮影完了');
}

main().catch((e) => {
  console.error('❌ エラー:', e.message);
  process.exit(1);
});
