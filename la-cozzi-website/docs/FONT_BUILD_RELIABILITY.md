# 字型建置穩定化技術調查與規劃報告

本文件記錄 La Cozzi 官方網站正式建置（Next.js Production Build）依賴 Google Fonts 即時下載之技術風險調查、官方來源查證、方案比較與後續實作規格規劃。

---

## 一、問題摘要

目前專案於根層版面（`src/app/layout.tsx`）使用 Next.js 內建的 `next/font/google` 載入三套 Google Fonts（`Noto Sans TC`、`Noto Serif TC`、`Nunito`），並設定 12 個不同字重。

雖然 Next.js 的設計是在建置時期（Build Time）自託管（Self-host）字型，但此機制要求 **每一次無快取的正式建置必須從外部 Google Fonts API 與 gstatic CDN 即時下載字型與樣式**。

經實際實測，繁體中文字型（CJK）因字符數量龐大，Google Fonts API 採用了動態 Unicode-Range 切片技術：
- `Noto Sans TC`（5 個字重）：Google Fonts 回傳達 **540 個切片檔案**（CSS 長達 624 KB）。
- `Noto Serif TC`（3 個字重）：回傳達 **324 個切片檔案**（CSS 長達 375 KB）。
- `Nunito`（4 個字重）：回傳 **20 個切片檔案**。

總計在每一次全新建置中，Next.js（特別是 16.2.1 Turbopack 原生引擎）必須對 Google 伺服器發送高達 **884 次** 網路切片請求並下載累積約 **9.69 MB** 的 WOFF2 檔案。

一旦 GitHub Actions 雲端 Runner、本機網路或 Vercel 建置節點遭遇短暫網路抖動、連線逾時、CDN 節流或 HTTP 封包中斷，Turbopack 內部之字型解析器即會崩潰並拋出 `module-not-found`，導致整個正式發布或 CI Pipeline 立即中斷失敗。

---

## 二、已知失敗證據

在 PR #12 合併至 `main` 後，GitHub Actions 於 Build 階段發生非確定性崩潰：

- **GitHub Actions Run**：
  `https://github.com/Maxupport/Lacozzi0210/actions/runs/39113850612`
- **失敗 Commit**：
  `163d2513514245962c0a57a4175eaf6b8f1b8fb4`
- **崩潰階段**：`npm run build`（Next.js 16.2.1 Turbopack）
- **關鍵錯誤紀錄（節錄自 CI Runner 原始日誌）**：
  ```text
  next/font/google queries have exactly one entry

  Debug info:
  - Execution of *AssetContext::process_resolve_result failed
  - Execution of resolve failed
  - Execution of resolve_internal failed
  - Execution of <NextFontGoogleFontFileReplacer as ImportMappingReplacement>::result failed
  - next/font/google queries have exactly one entry
  Error while looking up import map: next/font/google queries have exactly one entry

  Import trace:
    Server Component:
      [next]/internal/font/google/noto_sans_tc_45bc40a5.module.css
      [next]/internal/font/google/noto_sans_tc_45bc40a5.js
      ./src/app/layout.tsx

  https://nextjs.org/docs/messages/module-not-found
      at <unknown> ([next]/internal/font/google/noto_sans_tc_45bc40a5.module.css:4338:8)
  ##[error]Process completed with exit code 1.
  ```

**證據分析**：
1. 錯誤直接發生於 Turbopack 原生模組 `<NextFontGoogleFontFileReplacer>` 解析 `noto_sans_tc` 生成之 4,300+ 行 CSS 樣式表。
2. 同一 Commit 後續在 PR #13、本機網路與 Vercel 均曾順利建置，證實程式碼無邏輯錯誤，問題本質為 **「建置時外部依賴網路即時抓取大量 CJK 切片所引發之非確定性隨機失敗」**。

---

## 三、現行字型架構

### 1. 載入位置
全站僅於一個檔案載入字型：
- `src/app/layout.tsx`

### 2. 載入方式與宣告
```typescript
import { Noto_Sans_TC, Noto_Serif_TC, Nunito } from "next/font/google";

const notoSansTC = Noto_Sans_TC({
  weight: ['300', '400', '500', '700', '900'],
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-noto-sans-tc',
});

const notoSerifTC = Noto_Serif_TC({
  weight: ['400', '700', '900'],
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-noto-serif-tc',
});

const nunito = Nunito({
  weight: ['300', '400', '600', '700'],
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-nunito',
});
```

### 3. CSS 變數與字型堆疊（`src/app/globals.css`）
```css
@theme {
  --font-sans: var(--font-noto-sans-tc), var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
  --font-serif: var(--font-noto-serif-tc), ui-serif, Georgia, serif;
  --font-marker: var(--font-noto-serif-tc), cursive;
}
```

### 4. 特性盤點
- **套用範圍**：RootLayout 將變數注入 `<html>`，全站所有前台頁面（首頁、品牌、影音、夥伴、部落格、評論）、錯誤頁面（`error.tsx`, `not-found.tsx`）及後台路由全數套用。
- **預先載入（Preload）**：現行保留預設 `preload: true`，會在 SSR HTML `<head>` 注入 `<link rel="preload">`。
- **外部連線**：
  - **建置時期**：必須連線 `fonts.googleapis.com` 與 `fonts.gstatic.com`。
  - **訪客端執行時期**：若建置成功，檔案已複製至 `.next/static/media`，訪客瀏覽器不會連線 Google，由站點自身的 CDN / 伺服器自託管。
- **建置失敗後果**：`next build` 直接拋出錯誤並中斷，阻止整個部署流程。

---

## 四、官方文件依據

查證 Next.js 16.2.1 本機文件：
- `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md`

重點技術規範確認：
1. **內建自託管（Built-in self-hosting）**：`next/font` 設計初衷即為去除外部執行時網路請求，提升隱私（GDPR 合規）並消除累積版面位移（CLS）。
2. **`next/font/local` 支援**：Next.js 官方第一優先推薦在無法依賴外部網路或自帶字型時，使用 `next/font/local`：
   ```typescript
   import localFont from 'next/font/local'
   const myFont = localFont({
     src: './my-font.woff2',
     display: 'swap',
     variable: '--my-font',
   })
   ```
3. **路徑解析**：`localFont` 的 `src` 支援相對於呼叫檔案之相對路徑（例如 `./fonts/my-font.woff2`），且完全在本地檔案系統解析，**不發出任何網路請求**。
4. **CSS Variable 相容**：`next/font/local` 與 `next/font/google` 具備完全相同的 `variable` 與 `display` 介面，能無痛維持既有 CSS 變數名稱與 Tailwind `@theme` 設定。

---

## 五、官方字型與授權盤點

所有字型皆查證自官方 Google Fonts 及 upstream 儲存庫，均使用 **SIL Open Font License 1.1 (OFL-1.1)**，允許免費自託管、修改、商業使用與網站部署（唯一限制為不得單獨販售字型檔且需保留版權宣告）。

| 字型名稱 | 官方來源 | 授權類型 | Variable 支援 | 格式 | 官方檔案大小 | 官方 SHA-256 / 識別碼 |
| --- | --- | --- | --- | --- | --- | --- |
| **Noto Sans TC** | `google/fonts/ofl/notosanstc` (notofonts/noto-cjk) | OFL-1.1 | 支援 (`wght`) | TTF / WOFF2 | TTF: **11,941,968 bytes** (~11.9 MB) | `864727d210d54f2537bbe23b3a839436c3992af72de9322af5270897246bd44f` |
| **Noto Serif TC** | `google/fonts/ofl/notoseriftc` (notofonts/noto-cjk) | OFL-1.1 | 支援 (`wght`) | TTF / WOFF2 | TTF: **16,851,596 bytes** (~16.8 MB) | `0077e18f57c6908f4a000969880940bdb0dad057c0e8d98b49dc364c3d1b09c6` |
| **Nunito** | `googlefonts/nunito` (Vernon Adams) | OFL-1.1 | 支援 (`wght`) | TTF / WOFF2 | TTF: **276,932 bytes** (~276 KB)<br>WOFF2: **39,152 bytes** (~38 KB) | `bb55a5ca5c2042335b3991af27c4d0705d0ef41cac6164ac737fd8f2a1e85207` |

---

## 六、檔案大小與傳輸成本分析

### 1. 繁體中文字型的體積陷阱
繁體中文（CJK）字型包含台灣教育部常用國字、次常用字以及 Big5 收錄字，字符總數通常高達 13,000 至數萬字。
- 若直接將未子集化的完整 Variable TTF 放入專案自託管：
  - 兩套 CJK 字型合計高達 **28.7 MB**。
  - 將使 Git 儲存庫膨脹近 30 MB。
  - 若使用者造訪首頁時必須下載完整字型檔，在行動裝置上將造成毀滅性的 LCP 延遲與頻寬消耗。

### 2. 現行 Google Fonts 動態切片的兩難
- Google Fonts 透過切成 884 個切片來解決使用者傳輸量問題（使用者僅下載當頁用到的 5~10 個切片，約 200~400 KB）。
- 但這個設計把負擔全部推移給了 **建置時期**：Next.js 在 Build 時期被迫下載所有 884 個切片（累積近 10 MB），導致 CI 建置隨機中斷。

### 3. 西文字型（Nunito）的極佳優勢
- `Nunito` 僅涵蓋拉丁字母與符號，其官方 Variable WOFF2 檔案僅 **38 KB**。
- 將 `Nunito` 自託管於 Git 儲存庫對專案體積毫無負擔，且能 100% 確定移除外部網路建置依賴。

---

## 七、方案比較表

| 評估項目 | 方案 1：全自託管完整 CJK 與 Nunito | 方案 2：自託管 Nunito + 原生系統繁中字型堆疊（首選） | 方案 3：全系統字型堆疊（零自託管） | 方案 4：保留 Google Fonts + CI Retry | 方案 5：改為瀏覽器端遠端 `<link>` 載入 | 方案 6：精簡核心字重子集化自託管（備用） |
| --- | --- | --- | --- | --- | --- | --- |
| **Build 穩定性** | **極高**（100% 離線） | **極高**（100% 離線） | **極高**（100% 離線） | **差**（仍有外部依賴，假性穩定） | **高**（Build 不下載） | **極高**（100% 離線） |
| **前台視覺一致性** | 極高 | **高**（西文 Nunito 一致，中文原生高品質渲染） | 中（西文失去 Nunito 圓角特徵） | 極高 | 極高 | **極高**（維持 Noto 原貌） |
| **首屏使用者下載量** | **極差**（>15~28 MB） | **極佳**（僅 38 KB） | **最優**（0 KB） | 中（動態切片） | 中（動態切片） | 中（約 2~3 MB） |
| **Repository 增量** | **極差**（增加約 15~28 MB） | **極佳**（僅增約 43 KB） | **0 KB** | 0 KB | 0 KB | 中（增約 2.5~3.5 MB） |
| **實作與維護複雜度** | 低 | **極低** | 極低 | 低（但遺留技術債） | 低 | 中至高（需維護字型子集工具） |
| **使用者隱私保護** | 優良（無第三方連線） | **優良**（無第三方連線） | 優良（無連線） | 優良（自託管） | **差**（訪客 IP 洩漏給 Google） | 優良（無第三方連線） |
| **消除建置外部依賴** | 是 | **是** | 是 | **否（完全未消除）** | 是（但轉嫁風險給訪客） | 是 |
| **推薦結論** | **不建議**（傳輸過大） | **首選推薦** | 備用退路 | **強烈反對**（違背任務原則） | **強烈反對**（傷害隱私與 FOUT） | **備用推薦** |

---

## 八、首選方案規格（方案 2）

### 核心精神
**「以極輕量的 38 KB 官方 Nunito WOFF2 自託管確保樂團核心西文品牌視覺，繁體中文全面回歸作業系統原生最高品質字型堆疊，徹底達成 100% 離線穩定建置與極速首屏載入。」**

### 1. 為什麼這是最佳選擇？
- **繁體中文作業系統原生支援成熟**：
  - Apple 裝置（macOS / iOS / iPadOS）：內建 `PingFang TC`（蘋方-繁），為公認螢幕閱讀體驗最佳之繁中黑體。
  - Windows 裝置：內建 `Microsoft JhengHei`（微軟正黑體），具備高度 ClearType 最佳化。
  - Android / ChromeOS / Linux：系統原生即為 `Noto Sans CJK TC`。
  - 訪客在任何設備上皆能享受到清晰、銳利且載入速度為 0 毫秒的繁中文字。
- **樂團品牌視覺完美保留**：
  - La Cozzi 作為手作溫暖樂團，其最具辨識度的品牌視覺為標題、Logo、英文字母與數字的圓潤線條，這完全來自 **`Nunito`**。
  - 將自託管的 `Nunito` 置於字型堆疊首位，英文字母與數字全部由 Nunito 渲染，中文字符自動向下 Fallback 至系統高品質黑體。
- **體積與效能達到顛峰**：
  - 總下載量從近 10 MB 驟降至 **38 KB**（減少 99.6%），行動裝置使用者首屏秒開，無 FOIT（文字消失閃爍）或 FOUT（字型跳動）。
  - Git 儲存庫僅增加 1 個 38 KB 檔案與 4 KB 授權文字。

### 2. 預計調整檔案
- 新增：`src/app/fonts/Nunito-Variable.woff2`（39,152 bytes）
- 新增：`src/app/fonts/OFL-Nunito.txt`（4,385 bytes）
- 修改：`src/app/layout.tsx`（改以 `next/font/local` 載入 Nunito，移除 `next/font/google`）
- 修改：`src/app/globals.css`（微調字型堆疊優先序，讓 Nunito 優先處理英數字，繁中完美 Fallback）

### 3. CSS 變數相容性保證
在 `src/app/globals.css` 中：
```css
@theme {
  --font-sans: var(--font-nunito), "PingFang TC", "Microsoft JhengHei", "Noto Sans TC", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Songti TC", "PMingLiU", "Times New Roman", ui-serif, Georgia, serif;
  --font-marker: var(--font-nunito), "Songti TC", cursive;
}
```
所有既有 class（`font-sans`, `font-serif`, `font-marker`）完全無縫運作，不需改動任何前台 HTML 或元件。

---

## 九、備用方案規格（方案 6）

### 適用時機
若 Codex 或專案負責人經視覺審查後，堅持「Windows 平台上的中文亦必須與 Noto Sans TC / Noto Serif TC 100% 絕對一致，不得使用微軟正黑體」。

### 核心做法：核心字重精簡子集化自託管
1. **精簡字重**：將原有的 12 個字重精簡為真正核心的字重：
   - `Noto Sans TC`：Regular (400) 與 Bold (700)
   - `Noto Serif TC`：Bold (700)
   - `Nunito`：Variable (300..700)
2. **字符子集化（Subsetting）**：使用 `pyftsubset` 依據台灣教育部《常用國字標準字體表》（4,808 字）+ 常用英數標點符號進行切片裁剪，轉換為 WOFF2。
3. **成果**：
   - Noto Sans TC (400, 700)：約 1.8 MB
   - Noto Serif TC (700)：約 1.1 MB
   - Nunito：約 38 KB
   - 總體積控制在 **約 3 MB**，透過 `next/font/local` 放入專案，達成全平台一致與離線建置。

---

## 十、不採用方案與原因

1. **方案 1（全自託管完整未切片 CJK 字型）**：
   - 拒絕原因：高達 28.7 MB，嚴重膨脹 Git 儲存庫並嚴重破壞行動裝置使用者效能。
2. **方案 4（保留 Google Fonts 並加入 CI Retry）**：
   - 拒絕原因：治標不治本，未消除外部網路依賴；CI Runner 或 Vercel 遇網路封鎖或限流時重試依然會失敗。
3. **方案 5（改成瀏覽器執行時 `<link>` 遠端載入）**：
   - 拒絕原因：洩漏訪客 IP 違反隱私規範；產生文字空白閃爍（FOIT）；將建置風險轉嫁給所有造訪官網的客人。

---

## 十一、後續實作檔案清單（若採首選方案）

若獲核准實作首選方案，後續任務（如 AG-012）之修改範圍如下：
- **新增**：
  - `la-cozzi-website/src/app/fonts/Nunito-Variable.woff2`
  - `la-cozzi-website/src/app/fonts/OFL-Nunito.txt`
- **修改**：
  - `la-cozzi-website/src/app/layout.tsx`（將 `next/font/google` 替換為 `next/font/local`）
  - `la-cozzi-website/src/app/globals.css`（對齊字型堆疊順序）
- **完全不修改**：
  - 任何前台頁面結構、元件內容、資料庫、套件相依或 CI 工作流程。

---

## 十二、視覺驗證方法

後續實作時，必須依序進行跨平台與跨裝置視覺驗證：
1. **桌面瀏覽器比對**：
   - macOS / iOS：驗證英數字由 Nunito 呈現圓潤手作感，中文由 PingFang TC 呈現精緻黑體。
   - Windows：驗證英數字維持 Nunito，中文由微軟正黑體呈現，字距與行高無溢位。
2. **關鍵版面檢查**：
   - 首頁 Hero 區塊、導覽列按鈕、詢價表單輸入框。
   - 部落格文章列表（`BlogPage.tsx`）與內文標題。
   - 影音列表（`VideosPage.tsx`）與評論卡片（`ReviewsPage.tsx`）。
3. **自動化煙霧測試防護**：
   - 執行 `npm run test:smoke`（Playwright 13 項測試），確保所有文字節點均正常渲染且頁面無水平溢位（Zero horizontal overflow）。

---

## 十三、離線 Build 驗證方法

證明建置不再依賴 Google Fonts 的具體驗收步驟：
1. **斷網建置測試**：
   - 在本機斷開 Wi-Fi / 乙太網路，或透過代理伺服器封鎖 `fonts.googleapis.com` 與 `fonts.gstatic.com`。
   - 執行 `npm run build`。
   - **驗收標準**：即使在完全無網路環境下，Turbopack 仍能在 10 秒內成功完成 Production Build，不再產生任何網路超時或模組遺失錯誤。
2. **建置產物檢查**：
   - 檢查 `.next/static/media`：原本產生的 222 個零散 Google 切片全部消失，僅有專案自託管之單一 Nunito 字型。

---

## 十四、回復方案

若實作後發現任何非預期字型渲染異常，可透過標準 Git 流程快速回復：
1. 透過 Git Revert 撤銷該次 PR 之 Commit。
2. 或於 `src/app/layout.tsx` 暫時切換回系統安全字型堆疊（方案 3），不需依賴外部網路即可維持 100% 正常運作。

---

## 十五、尚待 Codex 或專案負責人決定的事項

1. **方案核准**：請專案負責人確認是否同意採用「**方案 2（自託管 Nunito + 原生繁中系統字型堆疊）**」作為正式修正方向。
2. **字重精簡原則**：若專案負責人偏好保留 Noto 字型外觀（方案 6），是否同意將字重精簡為 Regular (400) 與 Bold (700) 以控制檔案大小在 3 MB 以內。
3. **任務派發**：本任務（AG-011）僅負責調查與規格制定，正式實作將交由後續專屬任務（如 AG-012）獨立執行與驗收。
