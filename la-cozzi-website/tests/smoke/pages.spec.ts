import { test, expect } from '@playwright/test';

const publicPages = [
  { path: '/', titleExpected: 'La Cozzi 拉釦子樂團 | 官方網站' },
  { path: '/brand', titleExpected: '樂團簡介 | La Cozzi 拉釦子樂團' },
  { path: '/videos', titleExpected: '演出影音 | La Cozzi 拉釦子樂團' },
  { path: '/partners', titleExpected: '夥伴列表 | La Cozzi 拉釦子樂團' },
  { path: '/blog', titleExpected: '深度文章 | La Cozzi 拉釦子樂團' },
  { path: '/reviews', titleExpected: '客戶好評 | La Cozzi 拉釦子樂團' },
  { path: '/admin', titleExpected: '網站管理後台 | La Cozzi 拉釦子樂團' },
];

test.describe('公開頁面可用性 Smoke Tests', () => {
  for (const { path, titleExpected } of publicPages) {
    test(`路徑 ${path} 回傳成功、具有正確標題且無應用程式錯誤`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response).not.toBeNull();
      expect(response?.status()).toBe(200);

      await expect(page).toHaveTitle(titleExpected);

      // 主要內容可見
      const mainContainer = page.locator('main, div.min-h-\\[85vh\\]');
      await expect(mainContainer.first()).toBeVisible();

      // 頁面不得有 Next.js 崩潰錯誤
      await expect(page.locator('body')).not.toContainText('Application error');
      await expect(page.locator('body')).not.toContainText('Internal Server Error');
    });
  }
});
