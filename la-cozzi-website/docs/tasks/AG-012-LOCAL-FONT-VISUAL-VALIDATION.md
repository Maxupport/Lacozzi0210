# AG-012 任務規格與執行紀錄：建立可回復的字型穩定化候選版與視覺驗證

---

## 1. 任務基本資訊

- **任務編號**：AG-012
- **任務名稱**：建立可回復的字型穩定化候選版與視覺驗證
- **執行日期**：2026-10-19
- **執行角色**：AG
- **規格與驗收角色**：Codex
- **優先級**：高
- **風險等級**：低至中（獨立候選分支、不修改資料庫或 API、完整可回復、不得自行合併）
- **前台視覺變更**：有（候選版自託管 Nunito Variable 與 Noto Serif TC Variable WOFF2 unicode-range 分片，提供深邃黑度 900 大標題，等待視覺審查）
- **正式資料影響**：無
- **資料庫連線**：無
- **外部網路呼叫**：無（移除所有 `next/font/google` 外部下載）
- **分支名稱**：`ag/local-font-visual-validation`
- **基底 Commit**：`d59af5a031a401b0559c1acb4446fe761d647e93`（PR #14 合併至 `main` 之最新 Commit）

---

## 2. 任務背景與候選性質定位

本任務依據 AG-011 字型穩定化技術調查結論，建立一個獨立、可回復、不得自行合併的「字型候選版本」，用來實質驗證：

1. 移除 `next/font/google` 後，正式 Build 是否不再依賴 Google Fonts。
2. 自託管 Nunito 與 Noto Serif TC WOFF2 unicode-range 分片後，桌面版與手機版的視覺差異是否可接受。
3. 大標題與重要粗體文字是否維持足夠的黑度與份量（font-bold 700 / font-black 900）。
4. 首頁冷快取實際字型傳輸量是否合理（低於 2 MB，徹底消除 16.85 MB 完整 TTF 預載）。
5. 字型變更是否造成換行、按鈕寬度、卡片高度或水平溢位問題。
6. 候選方案是否值得正式採用。

**特別聲明（Candidate Status Only）**：
- 本任務純屬「候選方案驗證」，不代表專案已決定將候選字型上線。
- AG 不得自行合併 Pull Request 至 `main`，亦不得宣稱候選方案已獲專案負責人核准。
- 正式採用前必須由專案負責人審閱桌面版與手機版比對截圖後裁決。

---

## 3. 字型官方來源與可驗證憑據

為確保字型資源與授權具備 100% 可重現性與合法性，字型檔與授權文件嚴格遵循官方發布來源與固定版本，絕不使用第三方未知來源或浮動分支。

- **官方儲存庫**：Google Fonts Official Repository (`https://github.com/google/fonts`)
- **官方目錄 / 發布版本**：
  - Nunito: `https://github.com/google/fonts/tree/main/ofl/nunito`（固定 Commit `604936664fd62c14271209b51f98e7f495dd1a3e`）
  - Noto Serif TC: Google Fonts `v37` 官方發布版本（經 `@fontsource-variable/noto-serif-tc@5.3.1` 打包，完整保留 108 個 WOFF2 unicode-range 分片）
- **Upstream 來源**：
  - Nunito: `https://github.com/googlefonts/nunito`
  - Noto Serif TC: `https://github.com/googlefonts/noto-cjk`
- **授權條款**：SIL Open Font License 1.1 (`https://openfontlicense.org/`)

### 檔案校驗紀錄

| 檔案名稱 | 專案存放路徑 | 來源 / 版本 | 檔案數量 / 大小 (Bytes) | 授權 |
| :--- | :--- | :--- | :--- | :--- |
| **Nunito[wght].ttf** | `src/app/fonts/Nunito-Variable.ttf` | Commit `604936664fd62c14271209b51f98e7f495dd1a3e` | 1 個檔案 / 276,932 bytes | SIL OFL 1.1 |
| **OFL.txt (Nunito)** | `src/app/fonts/OFL-Nunito.txt` | Google Fonts | 4,384 bytes (SHA-256 `ee9491ad...`) | SIL OFL 1.1 |
| **Noto Serif TC WOFF2 Slices** | `src/app/fonts/noto-serif-tc/*.woff2` | Google Fonts v37 / `@fontsource-variable/noto-serif-tc@5.3.1` | 108 個分片 / 5,723,820 bytes | SIL OFL 1.1 |
| **OFL.txt (Noto Serif TC)** | `src/app/fonts/OFL-NotoSerifTC.txt` | Google Fonts | 4,350 bytes (SHA-256 `5e0da210...`) | SIL OFL 1.1 |
| **noto-serif-tc.css** | `src/app/fonts/noto-serif-tc.css` | 108 個 `@font-face` unicode-range 規則 | 111,552 bytes | - |

- **Nunito Variable 字型 Metadata 查驗**：
  經解析 `Nunito-Variable.ttf` 之 `fvar` 表：
  - 變軸名稱：`wght`，範圍 `200.0` 至 `1000.0`。
- **Noto Serif TC Variable WOFF2 分片 Metadata 查驗**：
  - 涵蓋 108 個 unicode-range 分片，字重範圍 `200 900`（含 700 Bold 與 900 Black）。
  - 涵蓋完整繁體中文字元集（常用字、次常用字、罕見字、注音符號與相容字元），非按目前頁面臨時抽取的殘缺子集，未來新增文章與頁面無缺字之虞。

---

## 4. 修改與新增檔案清單

### 允許新增
- `src/app/fonts/Nunito-Variable.ttf`（自託管 Nunito 可變字型）
- `src/app/fonts/OFL-Nunito.txt`（Nunito SIL OFL 1.1 授權證明）
- `src/app/fonts/noto-serif-tc/*.woff2`（自託管 108 個 Noto Serif TC 可變 WOFF2 分片）
- `src/app/fonts/noto-serif-tc.css`（108 個 `@font-face` unicode-range 宣告樣式表）
- `src/app/fonts/OFL-NotoSerifTC.txt`（Noto Serif TC SIL OFL 1.1 授權證明）
- `tests/smoke/fonts.spec.ts`（字型獨立性、本機 2xx 與無水平溢位 Smoke Test）
- `docs/tasks/AG-012-LOCAL-FONT-VISUAL-VALIDATION.md`（本任務文件）

### 允許修改
- `src/app/layout.tsx`（以 `next/font/local` 載入 Nunito，引入 `noto-serif-tc.css`，移除 16.85 MB TTF 預載）
- `src/app/globals.css`（依規範更新 `@theme` 之 `--font-sans`、`--font-serif`、`--font-marker`）
- `docs/FONT_BUILD_RELIABILITY.md`（更新字型候選版進度與分片方案）
- `docs/tasks/README.md`（登記 AG-012）
- `docs/PROJECT_ROADMAP.md`（標記候選版驗證狀態）
- `docs/CURRENT_STATE.md`（更新現況說明、分片大小與測試數量）
- `CHANGELOG.md`（記錄候選版實作、分片優化與粗體保證）

### 移除檔案
- `src/app/fonts/NotoSerifTC-Variable.ttf`（移除 16.85 MB 完整 TTF，徹底消除首頁 16.85 MB 預載問題）

### 嚴格未變更保證
- `src/components/**`：0 變更
- 除指定檔案外之 `src/app/**`：0 變更
- `src/lib/**`：0 變更
- `prisma/**`：0 變更
- `package.json` 與 `package-lock.json`：0 變更（未新增任何 npm 套件）
- `.github/workflows/**`：0 變更
- 任何 API、Server Action、資料庫連線或環境變數：0 變更

---

## 5. Next.js 16.2.1 實作細節

### A. `src/app/layout.tsx`
移除 Google Fonts 匯入與 16.85 MB 完整 TTF 載入，改由 `next/font/local` 載入 Nunito，並匯入自託管分片樣式表：
```typescript
import localFont from "next/font/local";
import "./fonts/noto-serif-tc.css";
import "./globals.css";

export const preferredRegion = 'sin1';

const nunito = localFont({
  src: "./fonts/Nunito-Variable.ttf",
  weight: "200 1000",
  display: "swap",
  variable: "--font-nunito",
});
```
`<html>` 標籤的 `className` 僅宣告 Nunito 變數：
```tsx
<html lang="zh-TW" className={`dark scroll-smooth ${nunito.variable}`}>
```

### B. `src/app/fonts/noto-serif-tc.css`
透過 108 個 `@font-face` 區塊與明確之 `unicode-range`，讓瀏覽器依據頁面出現的字符按需下載對應分片，且設定 `font-display: swap`：
```css
@font-face {
  font-family: 'Noto Serif TC';
  font-style: normal;
  font-display: swap;
  font-weight: 200 900;
  src: url('./noto-serif-tc/noto-serif-tc-0-wght-normal.woff2') format('woff2');
  unicode-range: U+3401, ...;
}
/* 共 108 個分片規則 */
```

### C. `src/app/globals.css`
Tailwind 4 `@theme` 直接採用 `"Noto Serif TC"`：
```css
@theme {
  --font-sans:
    var(--font-nunito),
    "PingFang TC",
    "Microsoft JhengHei",
    "Noto Sans CJK TC",
    ui-sans-serif,
    system-ui,
    sans-serif;

  --font-serif:
    "Noto Serif TC",
    "Songti TC",
    "Noto Serif CJK TC",
    "PMingLiU",
    "Times New Roman",
    ui-serif,
    Georgia,
    serif;

  --font-marker:
    "Noto Serif TC",
    "Songti TC",
    "Noto Serif CJK TC",
    "PMingLiU",
    ui-serif,
    Georgia,
    serif;
}
```

---

## 6. 新增字型 Smoke Test (`tests/smoke/fonts.spec.ts`)

新增嚴格唯讀煙霧測試，分別驗證兩套字型實質載入：
1. 監聽 `page.on("response")`，分別驗證：
   - Nunito 收到本機 `/_next/static/media/` 2xx 回應。
   - Noto Serif TC 收到本機 `/_next/static/media/` 2xx 回應。
2. 驗證首頁文字可見且無 Application error。
3. 驗證頁面無水平溢位 (`scrollWidth <= clientWidth`)。
4. 攔截並驗證頁面網路請求中完全無 `fonts.googleapis.com` 或 `fonts.gstatic.com`。
5. 驗證 `document.fonts` 中分別確認 Nunito 與 Noto Serif TC 之狀態為 `loaded`，排除 `loadedCount >= 1` 的寬鬆 OR 判斷。
6. 全程不執行任何表單提交、登入或寫入操作。

---

## 7. 建置產物與效能對比分析

### A. 儲存庫／建置產物規模

| 評估維度 | 原正式站基準 (AG-011 / PR #14) | 候選版 (16.85 MB TTF 版) | 候選版 (WOFF2 分片優化版) |
| :--- | :--- | :--- | :--- |
| **載入機制** | `next/font/google` | `next/font/local` | `next/font/local` + `@font-face` 分片 |
| **字型建置產物** | 221 個 WOFF2 切片 | 2 個 TTF 檔案 | 1 個 TTF + 108 個 WOFF2 分片 |
| **儲存庫字型總大小** | 10,134,980 bytes (~9.66 MB) | 17,128,528 bytes (~16.33 MB) | **6,000,752 bytes (~5.72 MB)** |
| **首頁 HTML 預載** | Google 切片 | **16.85 MB 完整 TTF (過大)** | **僅 276 KB Nunito (0 MB 繁中預載)** |

### B. 首頁冷快取實際瀏覽器傳輸量（效能驗證目標：< 2 MB）

經 Playwright 實際監聽首頁冷快取（Cold Cache）實測數據：

| 視窗模式 | 解析度 | 字型請求數 | 回應狀態 | 實際傳輸總量 | 達標狀態 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **桌面版** | 1440 × 1000 | 8 個 | 全部 200 OK | **775,204 bytes (757.04 KB / 0.74 MB)** | **通過 (遠低於 2 MB)** |
| **手機版** | 390 × 844 | 8 個 | 全部 200 OK | **775,204 bytes (757.04 KB / 0.74 MB)** | **通過 (遠低於 2 MB)** |

#### 首頁冷快取實際請求清單：
1. `Nunito_Variable...ttf`：276,932 bytes
2. `noto-serif-tc-latin...woff2`：33,168 bytes
3. `noto-serif-tc-123...woff2`：48,696 bytes
4. `noto-serif-tc-34...woff2`：57,680 bytes
5. `noto-serif-tc-122...woff2`：81,036 bytes
6. `noto-serif-tc-121...woff2`：85,224 bytes
7. `noto-serif-tc-120...woff2`：95,340 bytes
8. `noto-serif-tc-119...woff2`：97,128 bytes
- **合計**：8 個檔案，775,204 位元組。

---

## 8. 受限網路與離線 Build 驗證真實紀錄

依據任務規範第十三條，為證明建置不再依賴 Google Fonts，執行了受限網路驗證：

1. **環境限制盤點**：
   - 當前本機環境未安裝 Docker (`docker not found`)。
   - 嘗試使用 macOS 內建之 `sandbox-exec` 執行無對外網路連線建置：
     `(deny network-outbound)(allow network* (local ip "localhost:*"))`
   - **實測結果**：Next.js 16.2.1 Turbopack 原生引擎在建置過程中，需要透過多程序 IPC 與 Node.js child workers 通訊（執行 PostCSS 等 CSS Module 解析）。在 `sandbox-exec` 阻斷底層 socket 時，Node worker 提早退出導致 Turbopack 拋出內部 Panic (`node process exited before we could connect to it`)。
2. **遵守誠實通報規範**：
   - **明確回報：本機環境因架構限制無法完成真正的無網路隔離 Build 證明。**
   - **不得聲稱已通過真正的離線 Build。**
3. **客觀事實佐證**：
   - 執行 `grep -rn "next/font/google" src`：0 筆結果，正式程式碼無任何外部字型模組。
   - 一般 Production Build (`npm run build`) 順利成功（Exit code 0），建置日誌中 0 筆 Google Fonts 下載請求或逾時錯誤。
   - 建置產物 `.next/static/media` 經確認僅生成專案內部的自託管字型檔案，原 221 個 Google Fonts 切片全數消失。

---

## 9. 視覺比較驗證與截圖清單

### 比對基準
- **正式站基準**：`https://lacozzi0210.vercel.app/`
- **候選版基準**：本機 Production Build (`npm run start` 監聽於 `http://127.0.0.1:3000`)

### Viewport 規格
- **桌面版**：1440 × 1000
- **手機版**：390 × 844

### 擷取路由（共 7 個路徑，產出 28 張獨立截圖）
1. `/` (Home)
2. `/brand` (Brand)
3. `/videos` (Videos)
4. `/reviews` (Reviews)
5. `/blog` (Blog)
6. `/admin` (Admin)
7. `/__smoke__/missing-page-404` (404 Page)

### 截圖儲存位置（非 Git 追蹤）
所有截圖皆儲存於專案 `.gitignore` 明確排除之路徑，未進入 Git 儲存庫：
`la-cozzi-website/test-results/ag-012-font-comparison/`

### 28 張截圖檔案清單
- `prod-home-desktop.png` / `candidate-home-desktop.png`
- `prod-home-mobile.png` / `candidate-home-mobile.png`
- `prod-brand-desktop.png` / `candidate-brand-desktop.png`
- `prod-brand-mobile.png` / `candidate-brand-mobile.png`
- `prod-videos-desktop.png` / `candidate-videos-desktop.png`
- `prod-videos-mobile.png` / `candidate-videos-mobile.png`
- `prod-reviews-desktop.png` / `candidate-reviews-desktop.png`
- `prod-reviews-mobile.png` / `candidate-reviews-mobile.png`
- `prod-blog-desktop.png` / `candidate-blog-desktop.png`
- `prod-blog-mobile.png` / `candidate-blog-mobile.png`
- `prod-admin-desktop.png` / `candidate-admin-desktop.png`
- `prod-admin-mobile.png` / `candidate-admin-mobile.png`
- `prod-not-found-404-desktop.png` / `candidate-not-found-404-desktop.png`
- `prod-not-found-404-mobile.png` / `candidate-not-found-404-mobile.png`

---

## 10. 視覺差異詳細觀察

經人工與圖像逐項比對：

1. **版面尺寸與容器結構**：
   - 7 條路由在桌面版與手機版均**無任何水平溢位**。
   - 按鈕寬度、表單輸入框高度、卡片內距與外框 Organic border radius 均保持完全一致。
2. **英文字母與數字**：
   - 原正式站大部分英數字由 `Noto Sans TC` latin subset 呈現。
   - 候選版改由自託管 `Nunito Variable` 呈現，字母筆畫帶有微圓角（rounded terminals），例如在首頁「Email」、評價作者姓名「Tzuyu Chen」「Denny Han」、日期「2019-07-02」等處呈現親切、現代感之風格。
3. **中文無襯線字型 (`font-sans`)**：
   - macOS / iOS 環境下 fallback 至系統預設之 `PingFang TC`。
   - 字元字寬、行高與行距極為接近 Noto Sans TC，大部分內文段落的換行點完全一致。
4. **襯線大標題與粗體黑度份量 (`font-serif font-black` / `font-bold`)**：
   - **完全維持粗體要求**：透過自託管 Noto Serif TC Variable 分片，大標題「您專屬的演出報價」、「現場演出 影音精選」、「深度文章」以及後台登入標題等，**維持深邃黑度與厚重視覺份量（Black 900 / Bold 700）**。
   - 一般內文因為維持使用 `font-sans`（PingFang TC / 系統無襯線）並設定正常 `font-normal` 字重，**內文完全不受影響，絕無全站變粗之副作用**。
   - 且完全不使用任何 `text-shadow` 假粗體技術，字體邊緣銳利清晰。
5. **文字換行觀察**：
   - 首頁報價副標題、簡介段落、評價內文等處之斷行點 100% 一致。
   - 在 `/blog` 深度文章卡片中：第二篇標題「【41的宅器材研究】Old Blood Noise Endeavors(OBNE...」，因 Nunito 英文單字寬度較原 Noto Sans TC 稍窄，候選版首行多容納「Old」後換行；第一篇卡片則多容納一個中文字後進入省略號。版面高度不受影響。

---

## 11. 尚待專案負責人核准之視覺事項

候選版本已準備就緒，後續決策由專案負責人審閱以下項目並裁決是否正式採用：

1. **粗體標題與英數字 Nunito 圓角風格**：
   確認大標題恢復厚重黑度（Noto Serif TC Black 900）後之整體協調感，以及英數字採用 Nunito 呈現之微圓角現代風格。
2. **效能優化成果認可**：
   分片方案使首頁冷快取字型載入僅 757 KB（8 個請求），遠低於 2 MB，徹底消除 16.85 MB 完整字型預載問題。
3. **無缺字風險保證**：
   108 個 WOFF2 分片具備完整繁體中文字元集，未來新增深度文章或活動頁面時無缺字缺碼之虞。

---

## 12. 驗收結果記錄

```bash
npm run test:unit      # 65 passed
npm run typecheck      # 0 errors
npm run lint           # 0 errors, 0 warnings
npm run build          # Exit 0, 23/23 routes compiled
npm run test:smoke     # 14 passed (包含強化的 fonts.spec.ts)
grep -rn "next/font/google" src  # 0 matches
git diff --check origin/main...HEAD  # clean (0 whitespace warnings)
```

- **單元測試**：65 項全數通過。
- **煙霧測試**：14 項全數通過（獨立驗證 Nunito 與 Noto Serif TC 本機 2xx 回應、document.fonts loaded 狀態、零 Google Fonts 與無溢位）。
- **TypeScript**：0 錯誤。
- **ESLint**：0 錯誤、0 警告。
- **Production Build**：成功（靜態頁面 23/23 通過）。
- **字型資源**：僅自託管 Nunito TTF 與 Noto Serif TC WOFF2 分片，0 個 Google Fonts 外部切片。

---

## 13. 回復方式

- **合併前**：
  直接關閉 Pull Request，正式站 (`https://lacozzi0210.vercel.app/`) 與 `main` 完全不受影響。
- **未來若核准合併後欲回復**：
  直接以 Git Revert 建立還原 PR 合併至 `main` 即可。本任務無任何資料庫結構變更、無環境變數變更、無外部服務設定變動。

---

## 14. 結論與當前狀態

**AG-012 候選方案與視覺驗證已完成，等待專案負責人視覺確認。**
本方案尚未獲得專案負責人核准，嚴禁自行合併至 `main`。
