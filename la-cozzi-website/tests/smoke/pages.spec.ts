import { test, expect } from '@playwright/test';

interface PageTestConfig {
  path: string;
  titleExpected: string;
  verifyContent: (page: import('@playwright/test').Page) => Promise<void>;
}

const publicPages: PageTestConfig[] = [
  {
    path: '/',
    titleExpected: 'La Cozzi 拉釦子樂團 | 官方網站',
    verifyContent: async (page) => {
      // 驗證首頁專屬的報價大標題與表單取得報價按鈕
      await expect(page.locator('h1')).toContainText('您專屬的演出報價');
      await expect(page.locator('button[type="submit"]')).toContainText('立即索取報價單');
    },
  },
  {
    path: '/brand',
    titleExpected: '樂團簡介 | La Cozzi 拉釦子樂團',
    verifyContent: async (page) => {
      // 驗證樂團簡介專屬 Logo 與核心區塊標題
      await expect(page.locator('img[alt="La Cozzi 樂團 Logo"]')).toBeVisible();
      await expect(page.locator('h2:has-text("我們的堅持")')).toBeVisible();
      await expect(page.locator('h2:has-text("我們的三大特色")')).toBeVisible();
    },
  },
  {
    path: '/videos',
    titleExpected: '演出影音 | La Cozzi 拉釦子樂團',
    verifyContent: async (page) => {
      // 驗證影音頁專屬大標題與播放器狀態標籤
      await expect(page.locator('h1')).toContainText('現場演出');
      await expect(page.locator('h1')).toContainText('影音精選');
      const playerStatus = page.locator('text=/YouTube 官方播放清單|影音專區建置中/');
      await expect(playerStatus.first()).toBeVisible();
    },
  },
  {
    path: '/partners',
    titleExpected: '夥伴列表 | La Cozzi 拉釦子樂團',
    verifyContent: async (page) => {
      // 驗證夥伴列表專屬標題與介紹文案
      await expect(page.locator('h2')).toContainText('樂團好夥伴在此！');
      await expect(page.getByText('每一段動人的旋律，都來自這群熱愛音樂、充滿故事的夥伴')).toBeVisible();
    },
  },
  {
    path: '/blog',
    titleExpected: '深度文章 | La Cozzi 拉釦子樂團',
    verifyContent: async (page) => {
      // 驗證專屬標題
      await expect(page.locator('h2')).toContainText('深度文章');
      // 驗證專屬文章內容列表或明確空狀態（精彩文章正在醞釀中）
      const articleItem = page.locator('a[href^="/blog/"], article');
      const emptyState = page.getByText('精彩文章正在醞釀中');
      await expect(articleItem.or(emptyState).first()).toBeVisible();
    },
  },
  {
    path: '/reviews',
    titleExpected: '客戶好評 | La Cozzi 拉釦子樂團',
    verifyContent: async (page) => {
      // 驗證專屬標題與分享體驗按鈕
      await expect(page.locator('h2')).toContainText('聽見感動的迴響');
      await expect(page.locator('button:has-text("分享您的美好體驗")')).toBeVisible();
      // 驗證專屬評價列表（La Cozzi 樂團評價）或明確空狀態（目前尚無公開評價）
      const reviewItem = page.getByText('La Cozzi 樂團評價');
      const emptyState = page.getByText('目前尚無公開評價');
      await expect(reviewItem.or(emptyState).first()).toBeVisible();
    },
  },
  {
    path: '/admin',
    titleExpected: '網站管理後台 | La Cozzi 拉釦子樂團',
    verifyContent: async (page) => {
      // 驗證後台登入頁專屬標題、登入按鈕與內部管理標示
      await expect(page.locator('h1')).toContainText('La Cozzi 後台管理');
      await expect(page.locator('button[type="submit"]')).toContainText('登入後台');
      await expect(page.getByText('La Cozzi 拉釦子樂團內部管理入口')).toBeVisible();
    },
  },
];

test.describe('公開頁面可用性 Smoke Tests', () => {
  for (const { path, titleExpected, verifyContent } of publicPages) {
    test(`路徑 ${path} 回傳成功、具有正確標題且具備專屬內容或明確空狀態`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response).not.toBeNull();
      expect(response?.status()).toBe(200);

      await expect(page).toHaveTitle(titleExpected);

      // 驗證各頁專屬且穩定的主要內容或明確空狀態
      await verifyContent(page);

      // 頁面不得有 Next.js 崩潰錯誤
      await expect(page.locator('body')).not.toContainText('Application error');
      await expect(page.locator('body')).not.toContainText('Internal Server Error');
    });
  }
});
