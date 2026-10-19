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
- **前台視覺變更**：有（候選版將英數字轉為自託管 Nunito Variable，中文與襯線改為系統繁中字型堆疊，等待視覺審查）
- **正式資料影響**：無
- **資料庫連線**：無
- **外部網路呼叫**：無（移除所有 `next/font/google` 外部下載）
- **分支名稱**：`ag/local-font-visual-validation`
- **基底 Commit**：`d59af5a031a401b0559c1acb4446fe761d647e93`（PR #14 合併至 `main` 之最新 Commit）

---

## 2. 任務背景與候選性質定位

本任務依據 AG-011 字型穩定化技術調查結論，建立一個獨立、可回復、不得自行合併的「字型候選版本」，用來實質驗證：

1. 移除 `next/font/google` 後，正式 Build 是否不再依賴 Google Fonts。
2. 自託管 Nunito 加上系統繁中字型後，桌面版與手機版的視覺差異是否可接受。
3. 字型變更是否造成換行、按鈕寬度、卡片高度或水平溢位問題。
4. 候選方案是否值得正式採用。

**特別聲明（Candidate Status Only）**：
- 本任務純屬「候選方案驗證」，不代表專案已決定將候選字型上線。
- AG 不得自行合併 Pull Request 至 `main`，亦不得宣稱候選方案已獲專案負責人核准。
- 正式採用前必須由專案負責人審閱桌面版與手機版比對截圖後裁決。

---

## 3. 字型官方來源與可驗證憑據

為確保字型資源與授權具備 100% 可重現性與合法性，字型檔與授權文件嚴格遵循官方固定發布 Commit，絕不使用第三方字型來源或浮動分支。

- **官方儲存庫**：Google Fonts Official Repository (`https://github.com/google/fonts`)
- **官方目錄**：`https://github.com/google/fonts/tree/main/ofl/nunito`
- **Upstream 來源**：`https://github.com/googlefonts/nunito`
- **授權條款**：SIL Open Font License 1.1 (`https://openfontlicense.org/`)
- **固定來源 Commit ID**：`604936664fd62c14271209b51f98e7f495dd1a3e` (Date: 2022-02-16)

### 檔案校驗紀錄

| 檔案名稱 | 專案存放路徑 | 固定下載 URL | 檔案大小 (Bytes) | SHA-256 校驗值 |
| :--- | :--- | :--- | :--- | :--- |
| **Nunito[wght].ttf** | `src/app/fonts/Nunito-Variable.ttf` | `https://raw.githubusercontent.com/google/fonts/604936664fd62c14271209b51f98e7f495dd1a3e/ofl/nunito/Nunito%5Bwght%5D.ttf` | 276,932 | `bb55a5ca5c2042335b3991af27c4d0705d0ef41cac6164ac737fd8f2a1e85207` |
| **OFL.txt** | `src/app/fonts/OFL-Nunito.txt` | `https://raw.githubusercontent.com/google/fonts/604936664fd62c14271209b51f98e7f495dd1a3e/ofl/nunito/OFL.txt` | 4,385 | `580df76c95a1ec5ab878ceb25bb3d85c6a076804e9c970c8c6972aea775fdf65` |

- **Nunito Variable 字型 Metadata 查驗**：
  經解析 `Nunito-Variable.ttf` 之 `fvar` 表：
  - 變軸名稱：`wght`
  - 最小值：`200.0`
  - 預設值：`200.0`
  - 最大值：`1000.0`
  涵蓋專案所需之全部字重範圍（`200` 至 `1000`）。

---

## 4. 修改與新增檔案清單

### 允許新增
- `src/app/fonts/Nunito-Variable.ttf`（自託管 Nunito 可變字型）
- `src/app/fonts/OFL-Nunito.txt`（SIL OFL 1.1 授權證明）
- `tests/smoke/fonts.spec.ts`（字型獨立性與無水平溢位 Smoke Test）
- `docs/tasks/AG-012-LOCAL-FONT-VISUAL-VALIDATION.md`（本任務文件）

### 允許修改
- `src/app/layout.tsx`（以 `next/font/local` 替換 `next/font/google`）
- `src/app/globals.css`（依規範更新 `@theme` 之 `--font-sans`、`--font-serif`、`--font-marker`）
- `docs/FONT_BUILD_RELIABILITY.md`（更新字型候選版進度）
- `docs/tasks/README.md`（登記 AG-012）
- `docs/PROJECT_ROADMAP.md`（標記候選版驗證狀態）
- `docs/CURRENT_STATE.md`（更新現況說明）
- `CHANGELOG.md`（記錄候選版實作）

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
移除 Google Fonts 匯入，改用 `next/font/local`：
```typescript
import localFont from "next/font/local";
import "./globals.css";

export const preferredRegion = 'sin1';

const nunito = localFont({
  src: "./fonts/Nunito-Variable.ttf",
  weight: "200 1000",
  display: "swap",
  variable: "--font-nunito",
});
```
`<html>` 標籤的 `className` 僅保留實際存在的字型變數，完全移除已作廢之 `--font-noto-sans-tc` 與 `--font-noto-serif-tc`：
```tsx
<html lang="zh-TW" className={`dark scroll-smooth ${nunito.variable}`}>
```

### B. `src/app/globals.css`
依據任務規範更新 Tailwind 4 `@theme` 字型堆疊，未將 Nunito 置於 serif 或 marker，並保留系統 fallback：
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
    "Songti TC",
    "Noto Serif CJK TC",
    "PMingLiU",
    "Times New Roman",
    ui-serif,
    Georgia,
    serif;

  --font-marker:
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

新增唯讀煙霧測試，確保字型載入符合零外部連線要求：
1. 成功載入首頁並等待 `document.fonts.ready`。
2. 驗證頁面文字可見且無 Application error。
3. 驗證頁面無水平溢位 (`scrollWidth <= clientWidth`)。
4. 攔截並驗證頁面網路請求中完全無 `fonts.googleapis.com` 或 `fonts.gstatic.com`。
5. 驗證自託管之 Nunito 字型資源已正確被載入與套用。
6. 全程不執行任何表單提交、登入或寫入操作。

---

## 7. 建置產物對比分析

| 評估維度 | 原正式站基準 (AG-011 / PR #14) | 候選版本 (AG-012) | 差異 / 優化效益 |
| :--- | :--- | :--- | :--- |
| **載入機制** | `next/font/google` | `next/font/local` | 移除建置期外部下載風險 |
| **CSS @font-face 規則數** | 884 個規則 | 1 個規則 | 大幅精簡樣式表解析負擔 |
| **不重複字型建置產物** | 221 個 WOFF2 | 1 個 TTF (`Nunito_Variable...ttf`) | 減少 220 個檔案 |
| **字型產物總位元組數** | 10,134,980 bytes (~9.66 MB) | 276,932 bytes (~0.26 MB) | 減少 9,858,048 bytes (降幅 97.27%) |
| **Google Fonts 外部切片** | 221 個切片 | 0 個 | 完全脫離外部切片相依 |

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
   - 建置產物 `.next/static/media` 經確認僅生成專案內部的 `Nunito_Variable-s.p.06-4q_v6x1lq3.ttf` 與 `favicon.ico`，原 221 個 Google Fonts 切片全數消失。

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
`/Users/max.yuo1238/Documents/Vibe Coding/Nathan's Website/la-cozzi-website/test-results/ag-012-font-comparison/`

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
4. **襯線與手寫標籤 (`font-serif` / `font-marker`)**：
   - 原正式站使用 `Noto Serif TC` (weight 700 / 900)，其特點為粗重直筆畫與銳利襯線角，黑度高且視覺份量厚重。
   - 候選版改使用系統繁中襯線堆疊（macOS 呈現為 `Songti TC` 宋體），字形筆畫較細緻優雅，具有經典印刷宋體之橫細直粗特徵，但黑度不及原 900 黑體字重的 Noto Serif TC。
5. **文字換行觀察**：
   - 首頁報價副標題、簡介段落、評價內文等處之斷行點 100% 一致。
   - 在 `/blog` 深度文章卡片中：第二篇標題「【41的宅器材研究】Old Blood Noise Endeavors(OBNE...」，因 Nunito 英文單字寬度較原 Noto Sans TC 稍窄，候選版首行多容納「Old」後換行；第一篇卡片則多容納一個中文字後進入省略號。版面高度不受影響。

---

## 11. 尚待專案負責人核准之視覺事項

候選版本已準備就緒，後續決策由專案負責人審閱以下項目並裁決是否正式採用：

1. **標題襯線風格感受**：
   大標題（如「您專屬的演出報價」、「現場演出 影音精選」、「深度文章」）由粗厚之 Noto Serif TC 轉為較秀氣經典之宋體（Songti TC / 系統襯線），是否符合樂團品牌調性。
2. **英數字 Nunito 圓角風格**：
   樂團品牌名稱、英文標籤與數字採用 Nunito 呈現，外觀較柔和親切，是否符合期望。
3. **跨作業系統差異認知**：
   Windows 使用者將看到「微軟正黑體」與「新細明體/思源宋體」，Linux 則視安裝之字型 fallback。本折衷方案省去 9.85 MB 下載，但放棄全平台絕對像素級中文字型一致性。

---

## 12. 驗收結果記錄

```bash
npm run test:unit      # 65 passed
npm run typecheck      # 0 errors
npm run lint           # 0 errors, 0 warnings
npm run build          # Exit 0, 23/23 routes compiled
npm run test:smoke     # 14 passed (包含新增之 fonts.spec.ts)
grep -rn "next/font/google" src  # 0 matches
git diff --check       # clean
```

- **單元測試**：65 項全數通過。
- **煙霧測試**：14 項全數通過（新增 1 項字型獨立性與無溢位測試）。
- **TypeScript**：0 錯誤。
- **ESLint**：0 錯誤、0 警告。
- **Production Build**：成功（靜態頁面 23/23 通過）。
- **字型資源**：僅 1 個自託管 Nunito TTF，0 個 Google Fonts 切片。

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
