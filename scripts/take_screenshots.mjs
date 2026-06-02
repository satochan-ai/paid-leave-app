/**
 * take_screenshots.mjs
 * Playwright を使って各画面のスクリーンショットを撮影し docs/images/ に保存する。
 * Node.js の http モジュールで静的ファイルサーバーを内蔵しているため、
 * 外部サーバーの事前起動は不要です。
 *
 * 実行方法:
 *   npm install
 *   npm run screenshots
 */

import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const IMAGES_DIR = join(ROOT_DIR, 'docs', 'images');
const PORT = process.env.PORT || 8080;
const BASE_URL = `http://localhost:${PORT}`;
const VIEWPORT = { width: 1280, height: 900 };

// 管理者・社員セッション
const ADMIN_USER = JSON.stringify({
  id: 'user_admin_001', employeeId: null, name: '管理者',
  email: 'admin@example.com', password: 'admin123', role: 'admin',
});
const EMPLOYEE_USER = JSON.stringify({
  id: 'user_emp_001', employeeId: 'emp_001', name: '山田 太郎',
  email: 'yamada@example.com', password: 'password123', role: 'employee',
});
const PROPORTIONAL_USER = JSON.stringify({
  id: 'user_emp_002', employeeId: 'emp_002', name: '佐藤 花子',
  email: 'sato@example.com', password: 'password123', role: 'employee',
});

// MIME types
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
};

function startServer() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
      const filePath = join(ROOT_DIR, urlPath);
      const ext = extname(filePath);
      if (existsSync(filePath)) {
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(readFileSync(filePath));
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });
    server.listen(PORT, () => {
      console.log(`🌐 Local server: ${BASE_URL}`);
      resolve(server);
    });
  });
}

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });

  try {
    // ─── 1. ログイン画面 ─────────────────────────────────────
    {
      const ctx = await browser.newContext({ viewport: VIEWPORT });
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/index.html`);
      await page.waitForLoadState('networkidle');
      await wait(400);
      await page.screenshot({ path: `${IMAGES_DIR}/01_login.png` });
      console.log('✅ 01_login.png');
      await ctx.close();
    }

    // 管理者コンテキスト共通セットアップ
    const adminCtx = await browser.newContext({ viewport: VIEWPORT });
    const seedPage = await adminCtx.newPage();
    await seedPage.goto(`${BASE_URL}/index.html`);
    await seedPage.waitForLoadState('networkidle');
    await seedPage.evaluate(() => {
      if (typeof window.initializeSeedData === 'function') window.initializeSeedData();
    });
    await seedPage.evaluate((u) => localStorage.setItem('paidLeave_currentUser', u), ADMIN_USER);
    await seedPage.close();

    // ─── 2. 管理者ダッシュボード ─────────────────────────────
    {
      const page = await adminCtx.newPage();
      await page.goto(`${BASE_URL}/pages/admin/dashboard.html`);
      await page.waitForLoadState('networkidle');
      await wait(600);
      await page.screenshot({ path: `${IMAGES_DIR}/02_admin_dashboard.png` });
      console.log('✅ 02_admin_dashboard.png');
      await page.close();
    }

    // ─── 3. 社員一覧 ──────────────────────────────────────────
    {
      const page = await adminCtx.newPage();
      await page.goto(`${BASE_URL}/pages/admin/employees.html`);
      await page.waitForLoadState('networkidle');
      await wait(500);
      await page.screenshot({ path: `${IMAGES_DIR}/03_employee_list.png` });
      console.log('✅ 03_employee_list.png');
      await page.close();
    }

    // ─── 4 & 5. 社員詳細・仮ログイン情報カード ──────────────
    {
      const page = await adminCtx.newPage();
      await page.goto(`${BASE_URL}/pages/admin/employee-detail.html?id=emp_001`);
      await page.waitForLoadState('networkidle');
      await wait(600);
      await page.screenshot({ path: `${IMAGES_DIR}/04_employee_detail.png` });
      console.log('✅ 04_employee_detail.png');

      const card = page.locator('#loginInfoCard');
      if (await card.count() > 0) {
        await card.scrollIntoViewIfNeeded();
        await wait(300);
      }
      await page.screenshot({ path: `${IMAGES_DIR}/05_login_info_card.png` });
      console.log('✅ 05_login_info_card.png');
      await page.close();
    }

    // ─── 6. 有給取得登録 ──────────────────────────────────────
    {
      const page = await adminCtx.newPage();
      await page.goto(`${BASE_URL}/pages/admin/leave-usage-form.html?employeeId=emp_001`);
      await page.waitForLoadState('networkidle');
      await wait(500);
      await page.screenshot({ path: `${IMAGES_DIR}/06_leave_usage_form.png` });
      console.log('✅ 06_leave_usage_form.png');
      await page.close();
    }

    // ─── 7. 社員マイページ（社員セッション）────────────────────
    const empCtx = await browser.newContext({ viewport: VIEWPORT });
    const empSeed = await empCtx.newPage();
    await empSeed.goto(`${BASE_URL}/index.html`);
    await empSeed.waitForLoadState('networkidle');
    await empSeed.evaluate(() => {
      if (typeof window.initializeSeedData === 'function') window.initializeSeedData();
    });
    await empSeed.evaluate((u) => localStorage.setItem('paidLeave_currentUser', u), EMPLOYEE_USER);
    await empSeed.close();

    {
      const page = await empCtx.newPage();
      await page.goto(`${BASE_URL}/pages/employee/mypage.html`);
      await page.waitForLoadState('networkidle');
      await wait(500);
      await page.screenshot({ path: `${IMAGES_DIR}/07_employee_mypage.png` });
      console.log('✅ 07_employee_mypage.png');
      await page.close();
    }
    await empCtx.close();

    // ─── 8〜10. ダッシュボード下部各セクション ──────────────
    const sections = [
      { selector: '.section:has(.csv-button-group)', file: '08_csv_export.png', label: '08_csv_export.png' },
      { selector: '.data-management-section',        file: '09_backup_restore.png', label: '09_backup_restore.png' },
      { selector: '.grant-check-section',            file: '10_grant_check.png',  label: '10_grant_check.png' },
    ];

    for (const { selector, file, label } of sections) {
      const page = await adminCtx.newPage();
      await page.goto(`${BASE_URL}/pages/admin/dashboard.html`);
      await page.waitForLoadState('networkidle');
      await wait(400);
      const el = page.locator(selector).first();
      if (await el.count() > 0) await el.scrollIntoViewIfNeeded();
      await wait(300);
      await page.screenshot({ path: `${IMAGES_DIR}/${file}` });
      console.log(`✅ ${label}`);
      await page.close();
    }

    // ─── 11. 比例付与社員詳細（佐藤花子） ────────────────────
    {
      const page = await adminCtx.newPage();
      await page.goto(`${BASE_URL}/pages/admin/employee-detail.html?id=emp_002`);
      await page.waitForLoadState('networkidle');
      await wait(600);
      await page.screenshot({ path: `${IMAGES_DIR}/11_proportional_employee_detail.png` });
      console.log('✅ 11_proportional_employee_detail.png');
      await page.close();
    }

    // ─── 12. 有給申請フォーム（佐藤花子マイページ）────────────
    const propReqCtx = await browser.newContext({ viewport: VIEWPORT });
    const propReqSeed = await propReqCtx.newPage();
    await propReqSeed.goto(`${BASE_URL}/index.html`);
    await propReqSeed.waitForLoadState('networkidle');
    await propReqSeed.evaluate(() => {
      if (typeof window.initializeSeedData === 'function') window.initializeSeedData();
      // pending申請を1件注入（今日から7日後）
      const now = new Date().toISOString();
      const today = now.slice(0, 10);
      const future = new Date();
      future.setDate(future.getDate() + 7);
      const usageDate = future.toISOString().slice(0, 10);
      const reqs = JSON.parse(localStorage.getItem('paidLeave_leaveRequests') || '[]');
      reqs.push({
        id: 'request_demo_001', employeeId: 'emp_002',
        requestDate: today, usageDate, usedDays: 1, reason: '私用のため',
        status: 'pending', approvedBy: '', approvedAt: '',
        rejectedBy: '', rejectedAt: '', rejectReason: '',
        createdAt: now, updatedAt: now,
      });
      localStorage.setItem('paidLeave_leaveRequests', JSON.stringify(reqs));
    });
    await propReqSeed.evaluate((u) => localStorage.setItem('paidLeave_currentUser', u), PROPORTIONAL_USER);
    await propReqSeed.close();
    {
      const page = await propReqCtx.newPage();
      await page.goto(`${BASE_URL}/pages/employee/mypage.html`);
      await page.waitForLoadState('networkidle');
      await wait(600);
      // 申請フォームセクションまでスクロール
      const reqSection = page.locator('#leaveRequestSection');
      if (await reqSection.count() > 0) await reqSection.scrollIntoViewIfNeeded();
      await wait(400);
      await page.screenshot({ path: `${IMAGES_DIR}/12_leave_request_form.png` });
      console.log('✅ 12_leave_request_form.png');
      await page.close();
    }
    await propReqCtx.close();

    // ─── 13. 管理者：有給申請一覧（pending申請あり）─────────────
    {
      const page = await adminCtx.newPage();
      await page.goto(`${BASE_URL}/index.html`);
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => {
        if (typeof window.initializeSeedData === 'function') window.initializeSeedData();
        const now = new Date().toISOString();
        const today = now.slice(0, 10);
        const future = new Date();
        future.setDate(future.getDate() + 7);
        const usageDate = future.toISOString().slice(0, 10);
        const reqs = JSON.parse(localStorage.getItem('paidLeave_leaveRequests') || '[]');
        if (!reqs.find((r) => r.id === 'request_demo_001')) {
          reqs.push({
            id: 'request_demo_001', employeeId: 'emp_002',
            requestDate: today, usageDate, usedDays: 1, reason: '私用のため',
            status: 'pending', approvedBy: '', approvedAt: '',
            rejectedBy: '', rejectedAt: '', rejectReason: '',
            createdAt: now, updatedAt: now,
          });
          localStorage.setItem('paidLeave_leaveRequests', JSON.stringify(reqs));
        }
      });
      await page.goto(`${BASE_URL}/pages/admin/leave-requests.html`);
      await page.waitForLoadState('networkidle');
      await wait(600);
      await page.screenshot({ path: `${IMAGES_DIR}/13_leave_requests_admin.png` });
      console.log('✅ 13_leave_requests_admin.png');
      await page.close();
    }

    // ─── 14. 承認済み申請状態 ──────────────────────────────────
    {
      const page = await adminCtx.newPage();
      await page.goto(`${BASE_URL}/pages/admin/leave-requests.html`);
      await page.waitForLoadState('networkidle');
      await wait(400);
      // 申請を承認済みに変更してテーブルを再描画
      await page.evaluate(() => {
        const reqs = JSON.parse(localStorage.getItem('paidLeave_leaveRequests') || '[]');
        reqs.forEach((r) => {
          if (r.id === 'request_demo_001' && r.status === 'pending') {
            r.status = 'approved';
            r.approvedBy = 'user_admin_001';
            r.approvedAt = new Date().toISOString();
            r.updatedAt = new Date().toISOString();
          }
        });
        localStorage.setItem('paidLeave_leaveRequests', JSON.stringify(reqs));
        // テーブル再描画
        if (typeof renderLeaveRequestsPage === 'function') renderLeaveRequestsPage();
      });
      await wait(400);
      await page.screenshot({ path: `${IMAGES_DIR}/14_leave_request_approved.png` });
      console.log('✅ 14_leave_request_approved.png');
      await page.close();
    }

    // ─── 15. 申請中の取消ボタン（佐藤花子マイページ）────────────
    const cancelCtx = await browser.newContext({ viewport: VIEWPORT });
    const cancelSeed = await cancelCtx.newPage();
    await cancelSeed.goto(`${BASE_URL}/index.html`);
    await cancelSeed.waitForLoadState('networkidle');
    await cancelSeed.evaluate(() => {
      if (typeof window.initializeSeedData === 'function') window.initializeSeedData();
      // pending申請を1件注入
      const now = new Date().toISOString();
      const today = now.slice(0, 10);
      const future = new Date();
      future.setDate(future.getDate() + 7);
      const usageDate = future.toISOString().slice(0, 10);
      const reqs = JSON.parse(localStorage.getItem('paidLeave_leaveRequests') || '[]');
      // 既存の demo_cancel があれば削除してから追加
      const filtered = reqs.filter((r) => r.id !== 'request_demo_cancel');
      filtered.push({
        id: 'request_demo_cancel', employeeId: 'emp_002',
        requestDate: today, usageDate, usedDays: 1, reason: '私用のため',
        status: 'pending', approvedBy: '', approvedAt: '',
        rejectedBy: '', rejectedAt: '', rejectReason: '',
        cancelledBy: '', cancelledAt: '',
        createdAt: now, updatedAt: now,
      });
      localStorage.setItem('paidLeave_leaveRequests', JSON.stringify(filtered));
    });
    await cancelSeed.evaluate((u) => localStorage.setItem('paidLeave_currentUser', u), PROPORTIONAL_USER);
    await cancelSeed.close();
    {
      const page = await cancelCtx.newPage();
      await page.goto(`${BASE_URL}/pages/employee/mypage.html`);
      await page.waitForLoadState('networkidle');
      await wait(600);
      // 申請履歴セクションまでスクロール（取消ボタンが見えるように）
      const histSection = page.locator('#leaveRequestHistorySection');
      if (await histSection.count() > 0) await histSection.scrollIntoViewIfNeeded();
      await wait(400);
      await page.screenshot({ path: `${IMAGES_DIR}/15_leave_request_cancel_button.png` });
      console.log('✅ 15_leave_request_cancel_button.png');

      // ─── 16. 取消済み申請状態（同コンテキストで取消後に撮影）───
      await page.evaluate(() => {
        const reqs = JSON.parse(localStorage.getItem('paidLeave_leaveRequests') || '[]');
        reqs.forEach((r) => {
          if (r.id === 'request_demo_cancel' && r.status === 'pending') {
            r.status = 'cancelled';
            r.cancelledBy = 'user_emp_002';
            r.cancelledAt = new Date().toISOString();
            r.updatedAt = new Date().toISOString();
          }
        });
        localStorage.setItem('paidLeave_leaveRequests', JSON.stringify(reqs));
        // 申請履歴を再描画
        if (typeof renderEmployeeLeaveRequestHistory === 'function') {
          renderEmployeeLeaveRequestHistory('emp_002');
        }
      });
      await wait(400);
      await page.screenshot({ path: `${IMAGES_DIR}/16_leave_request_cancelled.png` });
      console.log('✅ 16_leave_request_cancelled.png');
      await page.close();
    }
    await cancelCtx.close();

    await adminCtx.close();
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n🎉 全スクリーンショット撮影完了 → docs/images/');
}

main().catch((e) => {
  console.error('❌ エラー:', e.message);
  process.exit(1);
});
