import { test, expect } from '@playwright/test';

test.describe('後台登入頁 Smoke Tests', () => {
  test('未登入狀態顯示帳號、密碼輸入欄位及登入按鈕，且不進行表單提交', async ({ page }) => {
    // 監聽並攔截所有 POST 網路請求，確保測試過程絕無發出任何登入請求
    const interceptedPostUrls: string[] = [];
    await page.route('**/*', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        interceptedPostUrls.push(request.url());
        await route.abort();
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin');

    // 頁面標題與核心主視覺
    await expect(page).toHaveTitle('網站管理後台 | La Cozzi 拉釦子樂團');
    await expect(page.locator('h1')).toContainText('La Cozzi 後台管理');

    // 確認帳號欄位存在
    const usernameInput = page.locator('input[type="text"]');
    await expect(usernameInput).toBeVisible();

    // 確認密碼欄位存在且為 password 類型
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // 確認登入按鈕存在
    const submitButton = page.locator('button[type="submit"]', { hasText: '登入後台' });
    await expect(submitButton).toBeVisible();

    // 嚴格遵守規範：不得填入帳密，不得送出登入表單，不得發送 POST 請求
    expect(interceptedPostUrls).toHaveLength(0);
  });
});
