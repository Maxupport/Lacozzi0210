/**
 * 404 錯誤頁面與降級處理 Smoke Tests
 * 依據 AG-009 規格：
 * 驗證造訪不存在之路徑時正確回傳 404 狀態碼、顯示繁體中文引導介面、
 * 提供首頁與影音頁導覽連結、點擊回到首頁功能正常且無水平溢位。
 */
import { test, expect } from '@playwright/test';

test.describe('404 錯誤頁面 Smoke Tests', () => {
  test('開啟不存在之路徑回傳 404 狀態碼、顯示完整引導介面且導覽運作正常', async ({ page }) => {
    // 1. 開啟明確不存在的路徑
    const response = await page.goto('/__smoke__/missing-page-404');

    // 2. HTTP 狀態碼為 404
    expect(response?.status()).toBe(404);

    // 3. 頁面主標題「找不到這個頁面」可見
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('找不到這個頁面');

    // 4. 404 標示可見
    const badge = page.getByText('404', { exact: true });
    await expect(badge).toBeVisible();

    // 5. 「回到首頁」連結存在且 href="/"
    const homeLink = page.locator('a[href="/"]', { hasText: '回到首頁' });
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveAttribute('href', '/');

    // 6. 「查看演出影音」連結存在且 href="/videos"
    const videosLink = page.locator('a[href="/videos"]', { hasText: '查看演出影音' });
    await expect(videosLink).toBeVisible();
    await expect(videosLink).toHaveAttribute('href', '/videos');

    // 8. 頁面沒有水平溢位
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalOverflow).toBe(false);

    // 7. 點擊「回到首頁」可回到首頁 /
    await homeLink.click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('h1')).toContainText('您專屬的演出報價');
  });
});
