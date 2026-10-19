# AG-011 任務規格與執行紀錄：調查並規劃字型建置穩定化

---

## 1. 任務基本資訊

- **任務編號**：AG-011
- **任務名稱**：調查並規劃字型建置穩定化
- **執行日期**：2026-10-19
- **執行角色**：AG
- **規格與驗收角色**：Codex
- **優先級**：高（P1 風險處理）
- **風險等級**：低（唯讀技術調查與文件規劃任務）
- **前台視覺變更**：無（本任務不修改任何程式碼與前台介面）
- **正式資料影響**：無
- **資料庫連線**：無
- **外部網路呼叫**：僅限公開官方字型資源查證與雜湊校驗，正式建置不更動
- **分支名稱**：`ag/font-build-reliability-audit`
- **基底 Commit**：`30c360a791f429ccf3e97a43a53b91402ff651cc`（PR #13 合併至 `main` 之最新 Commit）

---

## 2. 任務背景與問題陳述

在 PR #12 合併後，`main` 分支的 GitHub Actions CI 工作流程（Run ID: `39113850612`）曾於 `npm run build` 階段遭遇建置失敗。經查證，Next.js 16.2.1 Turbopack 原生引擎在解析 `next/font/google` 載入的繁體中文字型切片樣式時，因外部網路連線異常拋出 `module-not-found` 與 `next/font/google queries have exactly one entry` 錯誤。

同一份程式碼在後續 PR #13、本機環境與 Vercel 均曾建置成功，顯示專案目前面臨非確定性的外部建置脆弱性。依照專案風險清單（P1 風險），正式建置不應依賴外部網路即時抓取大量 CJK 字型切片。

---

## 3. 任務目標與非目標

### 任務目標
1. 深入盤點現行 `next/font/google` 載入行為、CSS 規則與實際建置產物規模。
2. 查證官方 Google Fonts、upstream 儲存庫及 SIL OFL 1.1 授權。
3. 實測並記錄各字型之檔案大小、格式、Variable 支援與 SHA-256 完整性雜湊。
4. 比較可行性方案並客觀評估對 Build 穩定性、前台視覺、傳輸量與 Git 體積之影響。
5. 提出候選折衷方案（自託管 Nunito + 系統繁中堆疊）與備用方案（精簡字重子集化自託管），並建立完整技術報告與後續實作驗收規格。

### 非目標（嚴格禁止）
1. 不直接修改 `src/app/layout.tsx`、`src/app/globals.css` 或任何網站程式。
2. 不更動前台或後台畫面、樣式與排版。
3. 不將下載之字型檔案加入 Git 儲存庫。
4. 不在 CI 加入建置重試（Retry）機制來掩蓋問題。
5. 不引入任何新套件或修改 `package.json`。
6. 不直接合併至 `main`。

---

## 4. 前置依賴與前置閱讀

開始調查前已完整閱讀並查證：
- `AGENTS.md`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `next.config.ts`
- `package.json`
- `package-lock.json`
- `.github/workflows/ci.yml`
- `docs/PROJECT_ROADMAP.md`
- `docs/CURRENT_STATE.md`
- `docs/RISK_REGISTER.md`
- `docs/DELIVERY_PROCESS.md`
- `docs/tasks/AG-TASK-TEMPLATE.md`
- Next.js 16.2.1 本機文件：
  - `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md`
  - `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md`

---

## 5. 執行前基準盤點

於 `origin/main`（Commit `30c360a`）建立分支前完成檢查：
- `npm run test:unit`：65 項單元測試全數通過。
- `npm run typecheck`：0 錯誤。
- `npm run lint`：0 錯誤、0 警告。
- `git status --short`：工作目錄乾淨。
- Git 分支同步：確認遠端包含 PR #13 合併 Commit。

---

## 6. 允許修改範圍

本任務僅允許新增與更新規劃與記錄文件：
- **主要新增**：
  - `la-cozzi-website/docs/FONT_BUILD_RELIABILITY.md`
  - `la-cozzi-website/docs/tasks/AG-011-FONT-BUILD-RELIABILITY-AUDIT.md`
- **允許更新**：
  - `la-cozzi-website/docs/tasks/README.md`
  - `la-cozzi-website/docs/PROJECT_ROADMAP.md`
  - `la-cozzi-website/docs/CURRENT_STATE.md`
  - `la-cozzi-website/docs/RISK_REGISTER.md`
  - `la-cozzi-website/CHANGELOG.md`

---

## 7. 嚴格禁止範圍

- 禁止修改 `src/**`、`public/**`、`prisma/**`、`next.config.ts`。
- 禁止修改 `package.json`、`package-lock.json`、`.github/workflows/**`。
- 禁止修改任何字型載入邏輯或加入字型二進位檔案至 Git。
- 禁止修改任何前台或後台介面、樣式或元件。
- 禁止連線資料庫或外部正式服務。

---

## 8. 設計決策與方案評估

經深入檢查現行建置產物與規則：
- **CSS 規則數**：包含 884 個 `@font-face` 規則（Noto Sans TC: 540, Noto Serif TC: 324, Nunito: 20）。
- **實體建置產物**：`.next/static/media` 實際生成 **221 個不重複的 `.woff2` 字型切片檔案**，總位元組數為 **10,134,980 位元組（約 10.13 MB）**。
- **現行字型優先順序**：`--font-sans` 第一順位為 Noto Sans TC，英數字現況大多由 Noto Sans TC 渲染，而非 Nunito。

各方案評估摘要如下：

1. **方案 1（全自託管完整未切片字型）**：
   - 體積高達 28.7 MB，嚴重膨脹 Git 儲存庫並影響使用者首屏速度，**不予採用**。
2. **方案 2（自託管 Nunito + 原生繁中系統字型堆疊）——【候選折衷方案】**：
   - 以建置穩定性與傳輸量為優先的視覺折衷方案。
   - 預期可完全移除 Google Fonts 建置外部依賴，傳輸量預估降至數十 KB。
   - 代價為英數字造型改為 Nunito 圓潤特徵，繁中改為各系統原生字型，跨平台字寬與行高有差異。**正式採用前必須建立獨立 Preview，與現行正式站進行桌面與手機版截圖比對並由專案負責人確認**。
3. **方案 3（全系統字型）**：
   - 雖可離線建置，但英數字失去現有特徵，僅作為極簡退路。
4. **方案 4（保留 Google Fonts 並加入 CI Retry）**：
   - 治標不治本，未消除外部依賴，Vercel 仍會失敗，**不建議採用**。
5. **方案 5（改成瀏覽器端執行時遠端 `<link>` 載入）**：
   - 將風險轉嫁給終端訪客，產生文字空白閃爍（FOIT），並伴隨潛在隱私合規疑慮，**不建議採用**。
6. **方案 6（精簡核心字重子集化自託管）——【備用候選方案】**：
   - 若專案堅持全平台中文維持 Noto，精簡為核心字重並以常用國字（4,808 字）裁剪，體積壓制在 2.5~3.5 MB 內自託管。但動態內容若超出字元範圍仍會 fallback，無法保證 100% 一致。

---

## 9. 實作步驟與防護措施（後續執行指導）

本任務已於 `docs/FONT_BUILD_RELIABILITY.md` 完成規格制定。後續實作建議依獨立任務執行：
1. 建立獨立視覺驗證 PR，上傳測試字型與調整配置。
2. 產出代表性頁面（首頁、品牌、影音、評論、部落格、後台登入）桌面版與手機版截圖對照。
3. 由專案負責人確認視覺差異與排版後始得合併。
4. 進行可控受限網路之離線建置驗證。

---

## 10. 測試案例與驗收標準

本調查任務驗收標準：
- [x] 所有官方來源 URL 與授權已核對（SIL OFL 1.1）。
- [x] 884 個 CSS 規則數與 221 個 WOFF2 建置產物（10,134,980 bytes）之區分已清楚修正。
- [x] 現行字型優先順序（Noto 第一、Nunito 第二）與字型變更對視覺之衝擊已精確分析。
- [x] 產出完整 14 章節技術報告 `docs/FONT_BUILD_RELIABILITY.md`。
- [x] 產出標準 17 章節任務文件 `docs/tasks/AG-011-FONT-BUILD-RELIABILITY-AUDIT.md`。
- [x] `npm run test:unit` 通過（65 項全數通過）。
- [x] `npm run typecheck` 通過（0 錯誤）。
- [x] `npm run lint` 通過（0 錯誤、0 警告）。
- [x] `npm run build` 通過。
- [x] `npm run test:smoke` 通過（13 項全數通過）。
- [x] `git diff --check` 通過。
- [x] Git 異動僅包含允許的文件檔案，無正式程式修改。

---

## 11. 測試隔離保證

- 本任務所有技術分析與驗證均於本機記憶體與唯讀檔案系統執行。
- 暫存抓取官方字型計算雜湊之臨時檔案皆已清理，未遺留任何未受控檔案。
- 單元測試與建置不對正式資料庫發出任何請求。

---

## 12. 檔案異動清單

### 新增檔案
- `la-cozzi-website/docs/FONT_BUILD_RELIABILITY.md`
- `la-cozzi-website/docs/tasks/AG-011-FONT-BUILD-RELIABILITY-AUDIT.md`

### 更新檔案
- `la-cozzi-website/docs/tasks/README.md`
- `la-cozzi-website/docs/PROJECT_ROADMAP.md`
- `la-cozzi-website/docs/CURRENT_STATE.md`
- `la-cozzi-website/docs/RISK_REGISTER.md`
- `la-cozzi-website/CHANGELOG.md`

---

## 13. 基準比較與效益評估

| 指標 | 現況盤點 | 候選折衷方案預期效益與代價 |
| --- | --- | --- |
| **建置外部依賴** | 每次 Build 依賴外部下載 221 個切片（~10.13 MB） | **預期可消除 Google Fonts 外部下載** |
| **字型建置失敗風險** | 外部網路抖動時隨機拋出 `module-not-found` | **預期可消除該類外部下載建置失敗** |
| **首屏字型下載量** | 依切片動態載入（約數百 KB） | **預估降至數十 KB（中文使用系統字型）** |
| **繁體中文渲染** | 全平台呈現 Noto Sans TC | **依作業系統原生字型渲染，跨平台字型有差異** |
| **英數字呈現** | 現況大多由 Noto Sans TC 呈現 | **改為 Nunito 圓潤造型，視覺明顯不同** |
| **Git 儲存庫負擔** | 0 KB | **預計增加約數十 KB** |

---

## 14. 回復方案與退場機制

本任務僅為文件與規格產出，若需放棄：
1. 關閉對應 Pull Request。
2. 刪除遠端分支 `origin/ag/font-build-reliability-audit`。
3. 本機切換回 `main` 並刪除分支即可完整回復。

---

## 15. 待決策事項與殘留風險

- **待決策事項**：請專案負責人確認是否同意建立獨立 PR，以「候選方案 2（自託管 Nunito + 系統繁中堆疊）」進行代表性頁面之桌面與手機版截圖比對。
- **殘留風險**：在正式實作完成前，CI Build 與 Vercel 仍存在依賴外部 Google Fonts 下載之非確定性隨機失敗風險。

---

## 16. 交付物與 Pull Request 規範

- Commit 訊息規範：`docs(fonts): correct audit evidence and assumptions`
- PR 標題規範：`docs: audit deterministic font build options`
- 交付物包含修正後的技術報告、任務規格文件與同步更新的現況文件。

---

## 17. 審查與授權宣告

本規格文件由 AG 依據 AG-TASK-TEMPLATE 格式完成撰寫與自主查證。所有分析均有本機文件與官方公開資源為憑。完成後交由 Codex 與專案負責人審查，未經核准不自行合併至 `main`。
