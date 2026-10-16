import { test, expect } from '@playwright/test';

test.describe('報價表單安全驗證 Smoke Tests', () => {
  test('確認 Email 輸入限制與表單驗證，並確保不對外送出實際 POST 請求', async ({ page }) => {
    // 監聽並攔截所有 POST 網路請求，確保測試過程絕無發出任何實際 POST
    const interceptedPostUrls: string[] = [];
    await page.route('**/*', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        interceptedPostUrls.push(request.url());
        // 即使有意外觸發也予以阻擋
        await route.abort();
      } else {
        await route.continue();
      }
    });

    await page.goto('/');

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(emailInput).toHaveAttribute('required', '');

    const submitButton = page.locator('button[type="submit"]', { hasText: '立即索取報價單' });
    await expect(submitButton).toBeVisible();

    // 1. 未填寫 Email 時，HTML5 表單驗證不通過且不會觸發送出
    await emailInput.fill('');
    const isEmptyValid = await emailInput.evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(isEmptyValid).toBe(false);

    // 點擊送出按鈕（觸發瀏覽器表單阻擋）
    await submitButton.click();

    // 2. 格式錯誤的 Email（如缺少 @ 或網域）無法通過瀏覽器驗證
    await emailInput.fill('invalid-email-format');
    const isMalformedValid = await emailInput.evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(isMalformedValid).toBe(false);

    await submitButton.click();

    // 3. 驗證全過程中沒有向任何端點發出 POST 請求
    expect(interceptedPostUrls).toHaveLength(0);
  });
});
