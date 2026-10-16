import { test, expect } from '@playwright/test';

test.describe('SEO 基本端點 Smoke Tests', () => {
  test('/robots.txt 回傳成功且包含 sitemap 位置', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toContain('Sitemap:');
    expect(body).toContain('/sitemap.xml');
  });

  test('/sitemap.xml 回傳成功且精確包含首頁與所有主要公開路由的 loc', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toContain('<urlset');

    // 解析所有 <loc> 標籤中的 URL
    const locMatches = Array.from(body.matchAll(/<loc>\s*(.*?)\s*<\/loc>/gi));
    expect(locMatches.length).toBeGreaterThan(0);

    // 解析 pathname 並標準化去除結尾斜線
    const locPathnames = locMatches.map((m) => {
      const locText = m[1].trim();
      try {
        const url = new URL(locText);
        return url.pathname.replace(/\/$/, '') || '/';
      } catch {
        return locText.replace(/\/$/, '') || '/';
      }
    });

    const expectedRoutes = ['/', '/brand', '/videos', '/partners', '/blog', '/reviews'];
    for (const route of expectedRoutes) {
      expect(
        locPathnames,
        `sitemap.xml 必須包含路由 loc: "${route}"`
      ).toContain(route);
    }
  });
});
