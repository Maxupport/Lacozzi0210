# 字型建置穩定化技術調查與規劃報告

本文件記錄 La Cozzi 官方網站正式建置（Next.js Production Build）依賴 Google Fonts 即時下載之技術風險調查、官方來源查證、方案成本比較與後續實作驗收規格規劃。

---

## 一、問題摘要

目前專案於根層版面（`src/app/layout.tsx`）使用 Next.js 內建的 `next/font/google` 宣告載入三套 Google Fonts（`Noto Sans TC`、`Noto Serif TC`、`Nunito`），並設定 12 個不同字重（Noto Sans TC: 5 個、Noto Serif TC: 3 個、Nunito: 4 個）。

雖然 Next.js 的設計是在建置時期（Build Time）自託管（Self-host）字型，但此機制要求 **每一次無快取的正式建置必須從外部 Google Fonts API 與 gstatic CDN 即時下載字型與樣式**。

經實際檢查正式建置產物與樣式規則，繁體中文字型（CJK）因字符數量龐大，Google Fonts API 採用了動態 Unicode-Range 切片技術：
- **CSS `@font-face` 規則數**：
  - `Noto Sans TC`（5 個字重）：CSS 包含 **540 個 `@font-face` 規則**。
  - `Noto Serif TC`（3 個字重）：CSS 包含 **324 個 `@font-face` 規則**。
  - `Nunito`（4 個字重）：CSS 包含 **20 個 `@font-face` 規則**。
  - **合計共 884 個 `@font-face` 規則**。
- **實際不重複 WOFF2 建置產物數**：
  - 在 `.next/static/media` 中，建置產物實際生成 **221 個不重複的 `.woff2` 字型切片檔案**（另有 1 個 `favicon.ico`，共 222 個檔案）。
  - 這代表多個字重或 Unicode-Range 規則在底層會共用相同的 Variable WOFF2 資源。**884 是 CSS 規則數，不等於 884 個不同字型檔**。
- **WOFF2 總位元組數**：
  - 221 個 `.woff2` 檔案總計為 **10,134,980 位元組**（約 10.13 MB 十進位，或 9.66 MiB 二進位）。
- **外部網路連線特性**：
  - 未經實際網路封包監控（Network Trace），無法確切斷定建置過程中發出的精確 HTTP 請求次數（可能因 HTTP/2 多工複用、連線池復用或共用資源而與切片數不一致）。
  - 但可以確定的是：每一次全新建置皆必須連線至 `fonts.googleapis.com` 取得龐大樣式表，並由 Turbopack 解析後向 `fonts.gstatic.com` 下載約 10.13 MB 的字型切片資源。

一旦 GitHub Actions 雲端 Runner、本機網路或 Vercel 建置節點遭遇外部網路抖動、連線逾時、CDN 節流或封包傳輸中斷，Turbopack 內部之字型解析器即可能拋出 `module-not-found`，導致整個正式發布或 CI Pipeline 隨機中斷失敗。

---

## 二、已知失敗證據

在 PR #12 合併至 `main` 後，GitHub Actions 於 Build 階段發生非確定性崩潰：

- **GitHub Actions Run**：
  [Run 39113850612](https://github.com/Maxupport/Lacozzi0210/actions/runs/39113850612)
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
2. 同一 Commit 後續在 PR #13、本機環境與 Vercel 均曾順利建置，證實程式碼並無語法或邏輯錯誤，問題本質為 **「建置階段依賴外部網路即時抓取大量 CJK 字型切片所引發之非確定性隨機失敗」**。

---

## 三、現行字型架構與視覺順序分析

### 1. 載入位置與宣告
全站僅於一個檔案載入字型：`src/app/layout.tsx`：
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

### 2. 現行字型優先順序（`src/app/globals.css`）
```css
@theme {
  --font-sans: var(--font-noto-sans-tc), var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
  --font-serif: var(--font-noto-serif-tc), ui-serif, Georgia, serif;
  --font-marker: var(--font-noto-serif-tc), cursive;
}
```

### 3. 重要視覺事實釐清
根據 CSS 字型匹配規則，瀏覽器在解析文字時會依字型堆疊宣告由前至後逐字元匹配：
1. **`font-sans` 中英數字現況**：
   - 目前 `--font-sans` 的第一順位是 `var(--font-noto-sans-tc)`，第二順位才是 `var(--font-nunito)`。
   - 由於 Google Fonts 的 `Noto Sans TC` 本身即收錄完整的拉丁字母（A–Z, a–z）、阿拉伯數字與基本標點符號，因此 **在現行網站中，絕大多數無襯線英數字實際上是由 Noto Sans TC 渲染，而非 Nunito**。
   - 宣稱「Nunito 是目前全站主要英數字型」並不符合現行 CSS 的實際匹配順序。
2. **`font-serif` 與 `font-marker` 現況**：
   - `--font-serif` 完全由 `Noto Serif TC` 主導。
   - `--font-marker` 亦指向 `var(--font-noto-serif-tc), cursive`。
3. **字型變更的視覺衝擊**：
   - 若候選方案將 `Nunito` 移至 `--font-sans` 第一順位，**英文字母與數字的外觀將產生明顯改變**（由 Noto Sans 的剛正造型轉變為 Nunito 的圓潤端點造型）。
   - 若中文改用作業系統原生字型，不同作業系統（Apple PingFang TC、Windows 微軟正黑體、Linux 系統字型）的字重分佈、字面率、行高與字寬皆有差異，**不可視為無縫或完全一致的切換**。
   - 若將 `--font-marker` 改為 Nunito，將失去原本 Noto Serif TC 的襯線筆觸，視覺差異顯著。

---

## 四、官方文件依據

查證 Next.js 16.2.1 本機文件：
- `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md`

重點技術規範確認：
1. **內建自託管（Built-in self-hosting）**：`next/font` 會在建置時將字型靜態化，使得訪客瀏覽器不會直接發送連線至 Google 伺服器，能避免版面位移（CLS）並兼顧訪客端連線效能。
2. **`next/font/local` 自託管支援**：Next.js 官方推薦使用 `next/font/local` 載入本機字型檔案，以完全移除對外部網路的建置依賴：
   ```typescript
   import localFont from 'next/font/local'
   const myFont = localFont({
     src: './my-font.woff2',
     display: 'swap',
     variable: '--my-font',
   })
   ```
3. **路徑解析機制**：`localFont` 的 `src` 是相對於呼叫檔案進行本地解析，完全由本機檔案系統讀取，不產生任何網路請求。
4. **CSS Variable 相容性**：`next/font/local` 支援與 `next/font/google` 相同的 `variable` 與 `display` 選項，能對齊既有 Tailwind `@theme` 設定。

---

## 五、官方字型與授權盤點

所有字型皆查證自官方 Google Fonts 及 upstream 儲存庫，均採用 **SIL Open Font License 1.1 (OFL-1.1)**。該授權允許免費自託管、修改、商業使用與網站部署（限制為不得單獨販售字型檔且需保留版權與授權宣告）。

### 官方來源與精確查證資訊

1. **SIL Open Font License 1.1 官方授權**：
   - 官方網站：[https://openfontlicense.org/](https://openfontlicense.org/) 或 [https://scripts.sil.org/OFL](https://scripts.sil.org/OFL)
2. **Noto Sans TC**：
   - Google Fonts 目錄：[https://fonts.google.com/specimen/Noto+Sans+TC](https://fonts.google.com/specimen/Noto+Sans+TC)
   - 官方 Git 儲存庫：[google/fonts: ofl/notosanstc](https://github.com/google/fonts/tree/main/ofl/notosanstc)（Upstream: [notofonts/noto-cjk](https://github.com/notofonts/noto-cjk)）
   - 精確查證檔案：`NotoSansTC[wght].ttf`
   - 下載 URL：`https://raw.githubusercontent.com/google/fonts/main/ofl/notosanstc/NotoSansTC%5Bwght%5D.ttf`
   - 檔案大小：**11,941,968 位元組**（約 11.9 MB）
   - SHA-256：`864727d210d54f2537bbe23b3a839436c3992af72de9322af5270897246bd44f`
3. **Noto Serif TC**：
   - Google Fonts 目錄：[https://fonts.google.com/specimen/Noto+Serif+TC](https://fonts.google.com/specimen/Noto+Serif+TC)
   - 官方 Git 儲存庫：[google/fonts: ofl/notoseriftc](https://github.com/google/fonts/tree/main/ofl/notoseriftc)（Upstream: [notofonts/noto-cjk](https://github.com/notofonts/noto-cjk)）
   - 精確查證檔案：`NotoSerifTC[wght].ttf`
   - 下載 URL：`https://raw.githubusercontent.com/google/fonts/main/ofl/notoseriftc/NotoSerifTC%5Bwght%5D.ttf`
   - 檔案大小：**16,851,596 位元組**（約 16.8 MB）
   - SHA-256：`0077e18f57c6908f4a000969880940bdb0dad057c0e8d98b49dc364c3d1b09c6`
4. **Nunito**：
   - Google Fonts 目錄：[https://fonts.google.com/specimen/Nunito](https://fonts.google.com/specimen/Nunito)
   - 官方 Git 儲存庫：[google/fonts: ofl/nunito](https://github.com/google/fonts/tree/main/ofl/nunito)（Upstream: [googlefonts/nunito](https://github.com/googlefonts/nunito)）
   - 精確查證檔案：`Nunito[wght].ttf`
   - 下載 URL：`https://raw.githubusercontent.com/google/fonts/main/ofl/nunito/Nunito%5Bwght%5D.ttf`
   - 檔案大小：**276,932 位元組**（約 276 KB）
   - SHA-256：`bb55a5ca5c2042335b3991af27c4d0705d0ef41cac6164ac737fd8f2a1e85207`
   - *註：本次調查實測之 Nunito Latin Variable WOFF2 切片大小為 39,152 位元組，此數值為 Google Fonts CDN 回傳切片之實測值，並非官方儲存庫中單一固定的可重現發布資產。後續若需於本機自託管，應以官方 TTF 來源透過標準可重現工具轉換，或採用具備固定版本與校驗碼之上游發布檔。*

---

## 六、檔案大小與傳輸成本分析

### 1. 繁體中文字型自託管的體積負擔
繁體中文（CJK）字型收錄超過萬字，若在未經子集化（Subsetting）的情況下直接自託管完整 Variable TTF 檔案：
- `Noto Sans TC` (~11.9 MB) + `Noto Serif TC` (~16.8 MB) 合計高達 **28.7 MB**。
- 這將直接增加 Git 儲存庫近 30 MB，並使未開啟切片的瀏覽器必須下載超過 10~28 MB 的字型資料，對行動網路使用者的載入時間（LCP）與流量消耗造成負面影響。

### 2. 現行建置產物實況
- 目前 Next.js 透過 `next/font/google` 在建置階段下載了 **221 個 WOFF2 切片**，總體積達 **10,134,980 位元組（約 10.13 MB）**。
- 瀏覽器造訪時，雖然能透過 HTTP 僅按需下載當前頁面有使用到的數個切片（約數百 KB），但建置階段必須全數下載，造成 CI 與發布環境的穩定性隱憂。

---

## 七、方案比較表

| 評估項目 | 方案 1：全自託管完整未切片字型 | 方案 2：自託管 Nunito + 原生系統繁中（候選折衷） | 方案 3：全系統字型堆疊（零自託管） | 方案 4：保留 Google Fonts + CI Retry | 方案 5：改為瀏覽器端遠端 `<link>` 載入 | 方案 6：精簡核心字重子集化自託管（備用候選） |
| --- | --- | --- | --- | --- | --- | --- |
| **Build 穩定性** | 預期可達離線建置 | **預期可達離線建置** | 預期可達離線建置 | **差**（未移除外部連線） | 高（Build 階段不載入） | **預期可達離線建置** |
| **視覺一致性** | 與現行完全一致 | **有明顯差異**（中英字型與順序改變） | 有明顯差異（英文字型改變） | 與現行完全一致 | 與現行完全一致 | **高**（核心字重一致，罕見字 fallback） |
| **首屏使用者下載量** | 偏高（>10~28 MB） | **極低**（預估約數十 KB） | **最低**（0 KB） | 中（依頁面切片載入） | 中（依頁面切片載入） | 中（預估約 2~3 MB） |
| **Repository 增量** | 增加約 15~28 MB | **僅增約數十 KB** | **0 KB** | 0 KB | 0 KB | 增加約 2~3 MB |
| **外部依賴消除** | 消除 Google Fonts 下載 | **消除 Google Fonts 下載** | 消除 Google Fonts 下載 | **未消除** | 僅自 Build 轉移至瀏覽器 | 消除 Google Fonts 下載 |
| **隱私與合規** | 自託管無第三方連線 | **自託管無第三方連線** | 無第三方連線 | 自託管無第三方連線 | **存在潛在合規風險** | 自託管無第三方連線 |
| **綜合評估** | 不建議（體積過大） | **候選折衷方案（需 Preview 比對）** | 備用退路 | **不建議（治標不治本）** | **不建議（轉移風險給訪客）** | **備用候選方案（需評估動態內容）** |

*註：關於瀏覽器連線第三方字型服務（方案 5），瀏覽器直接向第三方請求字型會傳遞訪客 IP 與 User-Agent 等連線資訊，在特定司法管轄區（如歐盟 GDPR 相關判例）可能衍生隱私合規爭議；實際法規遵循狀態須視適用地區、法律基礎與同意機制而定，但就技術架構而言確有增加第三方依賴與資料洩漏面之風險。*

---

## 八、候選方案 A：自託管輕量拉丁字型＋系統繁中字型堆疊（視覺折衷方案）

### 方案本質
**「以建置穩定性與傳輸量為優先的視覺折衷方案，正式採用前必須建立 Preview，與現行正式站進行桌面版及手機版截圖比較，並由專案負責人確認視覺差異。」**

### 1. 預期技術效益
- **移除建置外部依賴**：改用 `next/font/local` 載入本機字型檔，預期可消除 Google Fonts 下載逾時引發的建置失敗。
- **大幅縮減傳輸體積**：中文依賴本機系統字型（0 下載量），僅需傳輸輕量拉丁字型，預期可降低行動裝置首屏頻寬負擔。
- **儲存庫負擔極低**：僅需納入單一拉丁字型檔（數十 KB）與授權文件。

### 2. 明確存在的視覺差異與折衷代價
1. **英數字外觀轉變**：若將 Nunito 調至第一順位，原本由 Noto Sans TC 呈現的英文字母與數字將改為 Nunito 的圓潤筆觸。
2. **跨平台繁中呈現差異**：
   - Apple 裝置（macOS / iOS）：回退至 `PingFang TC`（蘋方）。
   - Windows 裝置：回退至 `Microsoft JhengHei`（微軟正黑體）。
   - Android / Linux 裝置：依作業系統版本、硬體製造商與發行版設定而異，實際字型可能為思源黑體或廠商客製字型，**無法保證跨平台一致**。
   - 不同系統字型的字重、字寬與行高差異，可能導致折行位置與按鈕寬度產生微調。
3. **襯線與強調字型改變**：`font-serif` 與 `font-marker` 若不再載入 Noto Serif TC，將回退至系統襯線字（如宋體、新細明體或 Georgia），視覺風格將有顯著變化。

### 3. 正式採用前必須進行比對的 12 項清單
在實作驗證 PR 中，必須建立 Preview 並針對下列項目截圖比對：
1. **首頁 Hero 標題與報價表單**（中英混排、輸入框文字、按鈕高度）。
2. **主要導覽列與行動版漢堡選單**（導覽項目寬度與折行）。
3. **品牌故事頁（Brand）標題與內文排版**。
4. **影音頁（Videos）標題與標籤**。
5. **顧客好評頁（Reviews）評論卡片與評分區塊**。
6. **部落格列表與內文頁**（標題字重、段落行高、中英標點）。
7. **後台登入頁與後台管理介面**。
8. **`font-sans`、`font-serif`、`font-marker` 三大字型類別樣式呈現**。
9. **純中文、純英文、純數字與中英數混排效果**。
10. **桌面版與手機版螢幕寬度渲染效果**。
11. **文字折行、按鈕寬度與卡片高度變化**。
12. **各頁面橫向水平溢位（Horizontal Overflow）檢查**。

---

## 九、候選方案 B：精簡核心字重子集化自託管（備用候選方案）

### 適用時機
若專案負責人審查候選方案 A 後，認為跨平台中文字體變化過大，堅持全平台中文必須維持 Noto Sans TC / Noto Serif TC 原貌。

### 核心做法與動態內容風險
1. **字重精簡**：僅保留核心字重（如 Noto Sans TC 400/700, Noto Serif TC 700, Nunito Variable）。
2. **字元子集化**：依據台灣教育部《常用國字標準字體表》（4,808 字）與常見符號進行切片，將 WOFF2 總體積壓縮至約 2.5 ~ 3.5 MB 放入專案自託管。
3. **動態內容風險說明**：
   - 資料庫中的文章內容、顧客評論、合作夥伴名稱與未來新增的公開文字，若包含常用 4,808 字以外的罕見字、特殊符號、日韓文或 Emoji，**該字元將無法由此子集呈現，仍會 Fallback 至各裝置的系統字型**。
   - 因此，子集化方案亦無法宣稱全站「100% 絕對完全一致」，必須評估動態內容之字元覆蓋風險。

---

## 十、其他評估方案與不建議原因

1. **方案 1（全自託管完整未切片 CJK 字型）**：
   - 不建議原因：總檔案高達 28.7 MB，對 Git 儲存庫與訪客載入速度帶來過大負擔。
2. **方案 4（保留 Google Fonts 並加入 CI Retry）**：
   - 不建議原因：Retry 僅能緩解偶發斷線，無法消除外部依賴；若網路環境持續受限，CI 與 Vercel 仍會失敗，屬治標不治本。
3. **方案 5（改成瀏覽器執行時遠端 `<link>` 載入）**：
   - 不建議原因：將建置風險轉嫁給所有終端訪客，產生文字空白（FOIT）或跳動（FOUT），並伴隨連線隱私與合規考量。

---

## 十一、後續實作建議與驗證規劃

若專案負責人同意評估候選方案，建議之執行流程如下：
1. **建立獨立的視覺驗證 PR**：
   - 不直接併入 `main`。
   - 納入自託管之字型檔，改寫 `src/app/layout.tsx` 與 `src/app/globals.css`。
   - 產出代表性頁面（桌面版與手機版）截圖，與現行正式站進行並列對照。
2. **專案負責人視覺確認**：
   - 確認中英文字型外觀、折行與按鈕間距是否符合樂團形象預期。
   - 若視覺差異可接受，始得核准合併。
   - 若視覺無法接受，則進一步評估候選方案 B（子集化）或更接近 Noto 外觀之開源拉丁字型。

---

## 十二、離線 Build 驗收條件

後續實作任務若宣稱達成消除外部依賴，必須符合以下客觀驗收條件：
1. **受限網路驗證**：
   - 在阻擋 `fonts.googleapis.com` 與 `fonts.gstatic.com` 網域的受控環境中（例如透過本機 hosts 轉向至 127.0.0.1 或代理伺服器攔截，不中斷整台電腦網路）。
   - 清除本機快取目錄（`rm -rf .next`）後執行 `npm run build`。
2. **驗收標準**：
   - `npm run build` 必須成功（Exit code 0）。
   - 建置日誌中 **完全不得出現** Google Fonts 下載、逾時或連線警告。
   - 搜尋正式程式碼目錄（`src/**`）中不得再存在 `next/font/google` 匯入。
   - 檢查產物目錄（`.next/static/media`），不得再產生由 Google Fonts 動態生成的 221 個舊切片檔案。
   - 建置耗時僅作前後對比紀錄，不設固定秒數門檻。

---

## 十三、回復方案

若後續實作在 Preview 或上線後發現非預期問題：
1. 可透過 Git Revert 撤銷實作 Commit。
2. 或於 `src/app/layout.tsx` 暫時切換為純系統安全字型堆疊（方案 3），無需外部網路即可維持正常運作。

---

## 十四、尚待 Codex 或專案負責人決定的事項

1. **候選方案方向**：是否同意建立獨立 PR，以「方案 2（自託管 Nunito + 原生繁中系統字型）」進行桌面與手機版截圖比較。
2. **視覺驗收標準**：專案負責人是否接受英數字外觀轉為 Nunito 圓潤特徵，以及不同作業系統（Apple / Windows / Android）中文字型之細微差異。
3. **任務派發**：本任務（AG-011）僅負責完成客觀技術調查與規格制定，正式實作將待審查核准後另行派發獨立任務執行。
