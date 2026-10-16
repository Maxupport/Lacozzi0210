import { test, expect } from '@playwright/test';

test.describe('主要導覽 Smoke Tests', () => {
  test('首頁具有完整的核心導覽連結，且點擊能正確切換頁面', async ({ page }) => {
    await page.goto('/');

    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    const expectedLinks = [
      { text: '樂團簡介', href: '/brand' },
      { text: '演出影音', href: '/videos' },
      { text: '夥伴列表', href: '/partners' },
      { text: '深度文章', href: '/blog' },
      { text: '客戶好評', href: '/reviews' },
      { text: '後台登入', href: '/admin' },
    ];

    // 確認桌面導覽所有連結存在且 href 正確
    for (const link of expectedLinks) {
      const linkLocator = nav.locator(`a[href="${link.href}"]`, { hasText: link.text });
      await expect(linkLocator.first()).toBeAttached();
      await expect(linkLocator.first()).toHaveAttribute('href', link.href);
    }

    // 至少實際點擊一個內部導覽連結並確認 URL 與頁面標題正確
    const brandLink = nav.locator('a[href="/brand"]', { hasText: '樂團簡介' }).first();
    await brandLink.click();

    await expect(page).toHaveURL(/\/brand$/);
    await expect(page).toHaveTitle('樂團簡介 | La Cozzi 拉釦子樂團');
    await expect(page.locator('body')).not.toContainText('Application error');
  });
});
