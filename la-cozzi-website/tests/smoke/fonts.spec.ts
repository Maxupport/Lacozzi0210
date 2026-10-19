/**
 * 字型載入、獨立性與效能 Smoke Tests
 * 依據 AG-012 規範與 Codex 審查意見：
 * 1. 驗證頁面不再向 Google Fonts (fonts.googleapis.com / fonts.gstatic.com) 發送請求。
 * 2. 監聽字型 response，分別驗證：
 *    - Nunito 字型收到本機 /_next/static/media/ 2xx 回應。
 *    - Noto Serif TC 字型收到本機 /_next/static/media/ 2xx 回應。
 * 3. 驗證 document.fonts 中：
 *    - Nunito family 狀態為 "loaded"。
 *    - Noto Serif TC family 狀態為 "loaded"。
 *    - 不得以 loadedCount >= 1 寬鬆判定。
 * 4. 驗證頁面主要標題可見且無 Application error。
 * 5. 驗證頁面無水平溢位 (scrollWidth <= clientWidth)。
 */
import { test, expect } from '@playwright/test';

test.describe('字型載入與獨立性 Smoke Tests', () => {
  test('首頁載入不依賴 Google Fonts，且分別驗證 Nunito 與 Noto Serif TC 本機 2xx 回應與 loaded 狀態', async ({ page }) => {
    const requestedUrls: string[] = [];
    const fontResponses: Array<{ url: string; status: number; resourceType: string }> = [];

    // 監聽所有網路請求，確保不發送任何外部 Google Fonts 請求
    page.on('request', (request) => {
      requestedUrls.push(request.url());
    });

    // 監聽字型 response，記錄 resourceType() === "font" 的回應
    page.on('response', (response) => {
      const resourceType = response.request().resourceType();
      if (resourceType === 'font' && response.url().includes('/_next/static/media/')) {
        fontResponses.push({
          url: response.url(),
          status: response.status(),
          resourceType,
        });
      }
    });

    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response).not.toBeNull();
    expect(response?.status()).toBe(200);

    // 1. 等待字型完全載入
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    // 2. 頁面主要文字可見且沒有應用程式崩潰
    const mainHeading = page.locator('h1').first();
    await expect(mainHeading).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Application error');

    // 3. 頁面沒有水平溢位
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalOverflow).toBe(false);

    // 4. 嚴格驗證完全沒有對 fonts.googleapis.com 或 fonts.gstatic.com 的請求
    const googleFontRequests = requestedUrls.filter(
      (url) => url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')
    );
    expect(googleFontRequests).toHaveLength(0);

    // 5. 分別驗證 Nunito 與 Noto Serif TC 本機字型回應
    const nunitoResponses = fontResponses.filter((resp) =>
      resp.url.toLowerCase().includes('nunito')
    );
    const notoSerifResponses = fontResponses.filter((resp) =>
      resp.url.toLowerCase().includes('noto-serif-tc')
    );

    expect(nunitoResponses.length).toBeGreaterThanOrEqual(1);
    expect(notoSerifResponses.length).toBeGreaterThanOrEqual(1);

    // 6. 本機字型回應 HTTP 狀態必須全部為 2xx
    for (const fontResp of [...nunitoResponses, ...notoSerifResponses]) {
      expect(fontResp.status).toBeGreaterThanOrEqual(200);
      expect(fontResp.status).toBeLessThan(300);
    }

    // 7. document.fonts 中必須分別驗證 Nunito 與 Noto Serif TC 狀態為 loaded
    const fontLoadingState = await page.evaluate(() => {
      const loadedFonts: Array<{ family: string; status: string }> = [];
      document.fonts.forEach((font) => {
        if (font.status === 'loaded') {
          loadedFonts.push({ family: font.family, status: font.status });
        }
      });

      const hasNunitoLoaded = loadedFonts.some((f) =>
        f.family.toLowerCase().includes('nunito')
      );
      const hasNotoSerifLoaded = loadedFonts.some((f) =>
        f.family.toLowerCase().includes('noto serif tc')
      );

      return {
        hasNunitoLoaded,
        hasNotoSerifLoaded,
        loadedFonts,
      };
    });

    expect(fontLoadingState.hasNunitoLoaded).toBe(true);
    expect(fontLoadingState.hasNotoSerifLoaded).toBe(true);
  });
});
