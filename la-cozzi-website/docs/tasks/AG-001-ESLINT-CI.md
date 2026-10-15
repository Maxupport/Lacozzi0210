# AG-001：清理 ESLint 基準並建立 CI

## 任務狀態

- 優先級：高
- 風險等級：低至中
- 執行角色：AG
- 規格與驗收角色：Codex
- 前台視覺變更：不得有
- 正式資料影響：不得有

## 專案負責人預先授權

專案負責人已於 2026-10-15 授權 AG 在本任務範圍內自主完成下列事項，不需要逐項詢問：

- 讀取專案檔案與本機 Next.js 文件。
- 修改本任務「允許修改範圍」列出的檔案。
- 安裝 lockfile 已記錄的相依套件。
- 執行 lint、型別檢查、建置及其他非破壞性檢查。
- 建立工作分支、建立 commit、推送該工作分支及建立 Pull Request。
- 修正因本任務變更造成的測試或 CI 失敗，前提是不超出原訂範圍。

只有下列情況必須停止並請 Codex 或專案負責人決定：

- 需要刪除資料、資料表、migration、正式環境資源或其他難以回復的內容。
- 需要讀取、建立、更新或顯示密碼、Token、私密金鑰及正式環境機密。
- 需要修改正式資料庫、正式環境變數、DNS、網域或 Vercel Production 設定。
- 需要直接推送、強制推送或合併至 `main`。
- 發現必須超出本任務允許範圍才能完成。

若 AG 的執行環境本身顯示作業系統或安全性核准視窗，該視窗仍以平台安全機制為準；本段授權不能繞過平台強制的權限確認。

## 背景與目的

目前正式網站可正常使用，本任務只改善開發防護，不新增功能。現有 `npm run lint` 共回報 49 個問題，包含 32 個錯誤及 17 個警告，因此尚不能把 ESLint 納入可靠的合併檢查。

本任務的目標是：

1. 在不改變網站行為的前提下，讓完整 ESLint 檢查通過。
2. 建立 GitHub Actions CI，讓 Pull Request 自動執行必要的靜態檢查與建置。
3. 保持 Vercel 部署流程不變；CI 不得自動發布或寫入正式環境。

## 執行前必讀

1. `AGENTS.md`
2. `docs/ARCHITECTURE.md`
3. `docs/DELIVERY_PROCESS.md`
4. `docs/RELEASE_CHECKLIST.md`
5. 與本次設定相關的 `node_modules/next/dist/docs/` 文件

此專案使用 Next.js 16.2.1。不得依賴舊版 Next.js 的慣例或記憶直接修改設定。

## 目前基準

在 2026-10-15 的 `main` 上執行：

```text
npm run lint
```

結果為：

```text
49 problems (32 errors, 17 warnings)
```

問題分布：

- `scripts/migrate-from-notion.ts`：8 個 `no-explicit-any` 錯誤。
- `src/app/sitemap.ts`：1 個 `no-explicit-any` 錯誤。
- `src/components/BlogPage.tsx`：2 個 `no-explicit-any` 錯誤。
- `src/components/MarkdownContent.tsx`：3 個未使用參數警告。
- `src/components/ReviewsPage.tsx`：1 個未使用匯入警告。
- `src/components/VideosPage.tsx`：1 個未使用匯入警告。
- `src/components/admin/PartnerList.tsx`：1 個未使用匯入警告。
- `src/components/admin/ReviewList.tsx`：7 個未使用項目警告。
- `src/lib/auth.ts`：1 個未使用變數警告。
- `src/lib/notion.ts`：15 個錯誤及 2 個警告。
- `test-n2m.js`：3 個 CommonJS 匯入錯誤。
- `test-notion.js`：2 個錯誤及 1 個警告。
- `test.js`：2 個 CommonJS 匯入錯誤。

開始實作前必須自行重跑 `npm run lint`；若數量或檔案分布已改變，先停止並回報 Codex，不得沿用過期基準。

## 允許修改範圍

- 上述 ESLint 問題涉及的檔案。
- 為上述檔案新增必要且精確的 TypeScript 型別。
- `eslint.config.mjs`，但僅限合理處理明確屬於一次性診斷腳本的規則；不得全域關閉安全性或型別規則。
- `.github/workflows/ci.yml`。
- `package.json` 與 lockfile，但僅限 CI 或檢查指令確實需要的最小修改。
- `CHANGELOG.md`，記錄本次工程改善。

## 禁止修改範圍

- 不得改變任何前台版面、文案、動畫或互動。
- 不得改變 API 回應格式、認證流程或權限判斷。
- 不得修改 Prisma schema、migration、seed 或正式資料。
- 不得新增或修改 Vercel、Supabase、Notion 的環境變數。
- 不得將 ESLint 規則整體降級、關閉，或以大量 `eslint-disable` 規避問題。
- 不得順便重構 Notion 整合、資料存取層或元件架構。
- 不得設定 GitHub Actions 自動部署、寫入資料庫或存取正式環境機密。
- 不得直接推送或合併至 `main`。

## 實作要求

### A. ESLint 清理

1. 以具體型別、型別守衛或 `unknown` 取代 `any`；不可單純把規則關閉。
2. 移除真正未使用的匯入與變數；若參數受外部介面約束，採最小且可說明的處理。
3. 對根目錄的 `test*.js` 先判斷用途：
   - 若仍是可重現的診斷工具，保留並以最小修改納入合理檢查。
   - 若已失效或依賴不存在，先回報 Codex，不得自行刪除。
4. `src/lib/notion.ts` 與遷移腳本的型別改善不得改變資料轉換、篩選、排序或錯誤處理行為。
5. 最終 `npm run lint` 必須達到 0 錯誤、0 警告。

### B. GitHub Actions CI

建立 `.github/workflows/ci.yml`，符合以下條件：

1. 在所有指向 `main` 的 Pull Request 執行。
2. 在推送至 `main` 時執行，作為合併後記錄。
3. 使用目前專案相容的 Node.js LTS 版本。
4. 使用 `npm ci` 安裝相依套件並啟用 npm 快取。
5. 依序執行：

```text
npm run typecheck
npm run lint
npm run build
```

6. 不得使用正式環境密鑰；若 build 因應用程式現況需要公開型環境變數，只能使用明確的無敏感測試值，並在回報中逐項說明。
7. 設定合理的最小權限，例如工作流程僅需讀取儲存庫內容。
8. 不得加入部署、資料搬遷或資料庫寫入步驟。

## 驗收條件

- [ ] `npm run typecheck` 通過。
- [ ] `npm run lint` 為 0 錯誤、0 警告。
- [ ] `npm run build` 通過。
- [ ] GitHub Actions workflow 語法有效。
- [ ] Pull Request 上三項檢查均成功。
- [ ] 首頁、品牌、影音、合作夥伴、文章、評論及後台登入頁行為不變。
- [ ] 無資料庫、環境變數、正式資料或 Vercel 部署設定變更。
- [ ] diff 中沒有無關格式化或順便重構。

## 必須執行的檢查

```text
npm run typecheck
npm run lint
npm run build
git diff --check
```

如本機建置因 Google Fonts 等外部網路限制失敗，必須保存完整錯誤並交由 Codex 在具網路環境重跑；不得以移除字型或改變前台外觀作為解法。

## 資料與正式環境影響

- 是否修改資料庫：否。
- 是否新增環境變數：原則上否。
- 是否影響正式資料：否。
- 是否需要資料搬遷：否。
- 是否修改部署流程：否；僅增加 GitHub Pull Request 檢查。

## 分支與交付

1. 從最新 `main` 建立分支：`ag/eslint-ci-baseline`。
2. 建議分成兩個 commit：
   - `chore: clear existing eslint findings`
   - `ci: add pull request quality checks`
3. 推送分支並建立 Pull Request，但不要自行合併。
4. 將 Pull Request 連結交給 Codex 審查。

## 回復方式

- 未合併前：關閉 Pull Request 即可，不影響正式站。
- 合併後若 CI 設定有問題：以新的修正 Pull Request 調整或移除 workflow。
- 若程式碼清理造成行為異常：回復本任務的程式碼 commit，保留可獨立運作的 CI commit。

## AG 完成後的回報格式

請逐項提供：

1. 修改摘要。
2. 實際修改的檔案清單。
3. 每一類 lint 問題採用的處理方式。
4. 所有測試指令、結果及執行環境。
5. CI 執行連結與各步驟結果。
6. 未完成或無法驗證的項目。
7. 已知風險。
8. 是否偏離本規格；若有，說明原因並等待 Codex 決定。
