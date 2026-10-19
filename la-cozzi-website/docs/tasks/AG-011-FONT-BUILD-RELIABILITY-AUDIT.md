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
- **前台視覺變更**：無（不修改任何程式碼與前台介面）
- **正式資料影響**：無
- **資料庫連線**：無
- **外部網路呼叫**：僅限公開官方字型資源查證與雜湊校驗，正式建置不更動
- **分支名稱**：`ag/font-build-reliability-audit`
- **基底 Commit**：`30c360a791f429ccf3e97a43a53b91402ff651cc`（PR #13 合併至 `main` 之最新 Commit）

---

## 2. 任務背景與問題陳述

在 PR #12 合併後，`main` 分支的 GitHub Actions CI 工作流程（Run ID: `39113850612`）曾於 `npm run build` 階段遭遇建置失敗。經查證，Next.js 16.2.1 Turbopack 原生引擎在解析 `next/font/google` 載入的繁體中文字型切片樣式時，因外部網路下載不穩定拋出 `module-not-found` 與 `next/font/google queries have exactly one entry` 錯誤。

同一份程式碼在後續 PR #13、本機網路與 Vercel 均曾建置成功，顯示專案目前面臨非確定性的外部建置脆弱性。依照專案風險清單（P1 風險），正式建置不應依賴外部網路即時抓取大量 CJK 字型切片。

---

## 3. 任務目標與非目標

### 任務目標
1. 深入盤點現行 `next/font/google` 載入行為與實際網路請求規模。
2. 查證官方 Google Fonts、 upstream 儲存庫及 SIL OFL 1.1 授權。
3. 實測並記錄各字型之檔案大小、格式、Variable 支援與 SHA-256 完整性雜湊。
4. 比較六大可行性方案並評估對 Build 穩定性、前台視覺、傳輸量與 Git 體積之影響。
5. 提出明確的首選方案（方案 2）與備用方案（方案 6），並建立完整技術報告與實作規格。

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

經深入調查，Google Fonts 對於繁體中文字型會生成高達 884 個 Unicode-Range 切片（累積近 10 MB），每次建置皆須對外下載。各方案評估摘要如下：

1. **方案 1（全自託管完整 CJK 與 Nunito）**：
   - 體積高達 28.7 MB，嚴重膨脹 Git 並重創使用者首屏速度，**不予採用**。
2. **方案 2（自託管 Nunito + 原生繁中系統字型堆疊）——【首選方案】**：
   - 西文由 38 KB 官方 Nunito WOFF2 完美維持品牌圓潤調性。
   - 中文由 Apple PingFang TC / Windows 微軟正黑體原生渲染，零字型下載、零延遲、字體銳利清晰。
   - 100% 離線建置成功，Git 僅增加約 43 KB，兼顧效能與品牌識別。
3. **方案 3（全系統字型）**：
   - 雖達 100% 離線，但西文失去 Nunito 特色，僅作為極簡退路。
4. **方案 4（保留 Google Fonts 並加入 CI Retry）**：
   - 治標不治本，未移除外部依賴，Vercel 仍會失敗，**強烈反對**。
5. **方案 5（改成瀏覽器端執行時遠端 `<link>` 載入）**：
   - 洩漏訪客 IP 違反隱私法規，且造成文字空白閃爍（FOIT），**強烈反對**。
6. **方案 6（精簡核心字重子集化自託管）——【備用方案】**：
   - 若專案堅持全平台 100% 呈現 Noto 字型，精簡為 2 個字重並依常用國字標準字體裁剪，將體積壓制在 3 MB 內自託管。

---

## 9. 實作步驟與防護措施（後續執行指導）

本任務已於 `docs/FONT_BUILD_RELIABILITY.md` 完成規格制定。後續實作建議依獨立任務（如 AG-012）執行：
1. 下載官方 Nunito Variable WOFF2 與 OFL.txt 至 `src/app/fonts/`。
2. 更新 `src/app/layout.tsx` 改用 `next/font/local`。
3. 更新 `src/app/globals.css` 對齊字型優先順序。
4. 進行跨裝置視覺驗證與離線斷網建置測試。

---

## 10. 測試案例與驗收標準

本調查任務驗收標準：
- [x] 所有官方來源與授權已核對（SIL OFL 1.1）。
- [x] 所有字型之官方檔案大小、格式、Variable 支援與 SHA-256 已精確記錄。
- [x] 產出完整 15 章節技術報告 `docs/FONT_BUILD_RELIABILITY.md`。
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

| 指標 | 調查前現況 | 首選方案預期效益 |
| --- | --- | --- |
| **建置外部依賴** | 每次 Build 抓取 884 次切片（~10 MB） | **0 次外部連線（100% 離線建置）** |
| **CI 失敗風險** | 網路抖動即隨機拋出 `module-not-found` | **徹底歸零（建置確定性）** |
| **首屏字型下載量** | 依切片動態載入（累積數百 KB） | **僅 38 KB（效能提升 90% 以上）** |
| **繁體中文渲染** | 需等待 CJK 切片載入 | **0 毫秒原生系統字型渲染，無 FOIT** |
| **Git 儲存庫負擔** | 0 KB | **僅增加約 43 KB** |

---

## 14. 回復方案與退場機制

本任務僅為文件與規格產出，若需放棄：
1. 關閉對應 Pull Request。
2. 刪除遠端分支 `origin/ag/font-build-reliability-audit`。
3. 本機切換回 `main` 並刪除分支即可完整回復。

---

## 15. 待決策事項與殘留風險

- **待決策事項**：請專案負責人或 Codex 核准是否依「首選方案 2（自託管 Nunito + 系統繁中堆疊）」派發實作任務。
- **殘留風險**：在正式實作完成前，CI Build 與 Vercel 仍存在依賴外部 Google Fonts 下載之非確定性隨機失敗風險。

---

## 16. 交付物與 Pull Request 規範

- Commit 訊息規範：`docs(fonts): audit deterministic build options`
- PR 標題規範：`docs: audit deterministic font build options`
- 交付物包含完整的技術報告、任務規格文件與同步更新的現況文件。

---

## 17. 審查與授權宣告

本規格文件由 AG 依據 AG-TASK-TEMPLATE 格式完成撰寫與自主查證。所有分析均有本機文件與官方公開資源為憑。完成後交由 Codex 與專案負責人審查，未經核准不自行合併至 `main`。
