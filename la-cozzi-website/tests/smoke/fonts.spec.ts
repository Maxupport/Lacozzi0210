/**
 * 字型載入與獨立性 Smoke Tests
 * 依據 AG-012 規範：
 * 驗證移除 next/font/google 後，頁面不再向 Google Fonts (fonts.googleapis.com / fonts.gstatic.com) 發送請求，
 * 且能正確載入並辨識專案自託管之 Nunito 字型資源，同時確保頁面無水平溢位且文字正常顯示。
 */
import { test, expect } from '@playwright/test';

test.describe('字型載入與獨立性 Smoke Tests', () => {
  test('首頁載入不依賴 Google Fonts，且使用專案自託管 Nunito 字型且無水平溢位', async ({ page }) => {
    const requestedUrls: string[] = [];

    // 監聽所有網路請求，確保不發送任何外部 Google Fonts 請求
    page.on('request', (request) => {
      requestedUrls.push(request.url());
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

    // 4. 驗證完全沒有對 fonts.googleapis.com 或 fonts.gstatic.com 的請求
    const googleFontRequests = requestedUrls.filter(
      (url) => url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')
    );
    expect(googleFontRequests).toHaveLength(0);

    // 5. 驗證頁面 HTML 或載入資源中可辨識專案自行託管的 Nunito 字型
    // 檢查是否有字型資源請求（自託管 TTF/WOFF2 產物）或 CSS @font-face / document.fonts
    const fontAssetRequests = requestedUrls.filter((url) =>
      /\/_next\/static\/media\/.*\.(?:ttf|woff2|woff)/.test(url)
    );

    const fontFaceInfo = await page.evaluate(() => {
      const fonts: Array<{ family: string; status: string }> = [];
      document.fonts.forEach((font) => {
        fonts.push({ family: font.family, status: font.status });
      });

      // 檢查 html 元素是否帶有 Nunito 的 CSS 變數
      const htmlEl = document.documentElement;
      const classAttr = htmlEl.getAttribute('class') || '';

      // 檢查 styleSheets 中的 @font-face 規則
      let hasLocalFontFace = false;
      try {
        for (const sheet of Array.from(document.styleSheets)) {
          try {
            for (const rule of Array.from(sheet.cssRules || [])) {
              if (rule instanceof CSSFontFaceRule) {
                if (rule.cssText.includes('/_next/static/media/')) {
                  hasLocalFontFace = true;
                  break;
                }
              }
            }
          } catch {
            // cross-origin stylesheets or security restrictions
          }
        }
      } catch {
        // ignore
      }

      return {
        loadedFonts: fonts,
        hasClassVariable: classAttr.includes('nunito') || classAttr.includes('font-nunito'),
        hasLocalFontFace,
      };
    });

    // 確保有載入自託管字型資源，或 CSS / document.fonts 中已註冊自託管字型
    const isLocalFontRecognized =
      fontAssetRequests.length > 0 ||
      fontFaceInfo.hasLocalFontFace ||
      fontFaceInfo.hasClassVariable ||
      fontFaceInfo.loadedFonts.some((f) => /nunito/i.test(f.family));

    expect(isLocalFontRecognized).toBe(true);
  });
});
