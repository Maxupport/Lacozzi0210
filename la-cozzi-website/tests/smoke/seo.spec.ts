import { test, expect } from '@playwright/test';

test.describe('SEO 基本端點 Smoke Tests', () => {
  test('/robots.txt 回傳成功且包含 sitemap 位置', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toContain('Sitemap:');
    expect(body).toContain('/sitemap.xml');
  });

  test('/sitemap.xml 回傳成功且包含主要公開頁面網址', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toContain('<urlset');
    expect(body).toContain('/brand');
    expect(body).toContain('/videos');
    expect(body).toContain('/partners');
    expect(body).toContain('/blog');
    expect(body).toContain('/reviews');
  });
});
