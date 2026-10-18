# AG-009：建立全站錯誤降級與 404 頁面

> 本文件為 La Cozzi 官網專案的具體任務執行規格書。依據 `docs/tasks/AG-TASK-TEMPLATE.md` 標準範本建立，完整記錄任務背景、授權邊界、現況基準、Next.js 16.2.1 文件依據、修改範圍、驗收條件與回復流程。

---

## 1. 任務編號與名稱

- **任務編號**：AG-009
- **任務名稱**：建立全站錯誤降級與 404 頁面

---

## 2. 任務狀態

- **優先級**：高
- **風險等級**：低至中
- **執行角色**：AG
- **規格與驗收角色**：Codex
- **是否允許前台視覺變更**：僅限錯誤狀態與不存在的網址（正常頁面視覺完全不得變更）
- **是否影響正式資料**：否（錯誤頁面與測試不存取資料庫與外部網路）
- **資料庫或環境變數影響**：否

---

## 3. 背景與目的

目前網站主要頁面與核心流程皆可正常運作，但先前尚未建立全站錯誤頁面與明確的 404 降級介面。

當使用者開啟不存在的網址、頁面發生非預期錯誤，或根層 Layout 發生錯誤時，網站應顯示清楚、可操作且不洩漏技術細節的繁體中文介面。

本次任務目標：
1. 建立一般路由錯誤降級頁面（`src/app/error.tsx`）。
2. 建立根層 Layout 錯誤的最後防線（`src/app/global-error.tsx`）。
3. 建立正式的 404 頁面（`src/app/not-found.tsx`）。
4. 為 404 行為新增唯讀冒煙測試（`tests/smoke/error-pages.spec.ts`）。
5. 不修改正常頁面、資料來源、API、資料庫、環境設定或相依套件。

---

## 4. 專案負責人預先授權

專案負責人已授權 AG 在本任務明確列出的範圍內自主完成下列事項，無需逐項詢問：

- 閱讀 Next.js 本機文件及專案檔案。
- 新增本任務指定的錯誤頁面與測試。
- 更新指定治理文件。
- 執行 Typecheck、Lint、Unit Tests、Build 與 Smoke Tests。
- 建立短期工作分支、建立 Commit、推送分支及建立 Pull Request。
- 修正本任務直接造成的測試或 CI 問題，但不得擴大修改範圍。

---

## 5. 必須停止並回報的條件

遇到下列任何情況時，AG 必須立即停止操作並向 Codex 或專案負責人回報，不得自行決策：

1. **正常頁面改動**：必須修改正常頁面或既有共用元件才能完成。
2. **Next.js 設定變更**：必須修改 Next.js 設定或啟用實驗性設定（如 `globalNotFound`）。
3. **除錯或測試入口**：必須加入測試用錯誤路由或會進入正式站的除錯入口。
4. **外部與資料異動**：必須修改資料庫、環境變數或外部服務。
5. **相依套件**：必須新增、移除或升級套件，或修改 `package-lock.json`。
6. **範圍外檔案**：必須修改本任務允許範圍以外的檔案。
7. **文件依據衝突**：Next.js 16.2.1 本機文件與本任務要求衝突。
8. **Git 保護違規**：直接推送至 `main`、強制推送或自行合併 Pull Request 至 `main`。

---

## 6. 執行前必讀文件

在開始動工前，AG 必須完整閱讀下列文件與規範：

1. `AGENTS.md`（遵循 Next.js 16 breaking changes 規範）
2. `README.md` 與 `la-cozzi-website/README.md`
3. `la-cozzi-website/docs/ARCHITECTURE.md`（系統架構）
4. `la-cozzi-website/docs/DELIVERY_PROCESS.md`（開發、驗收與發布流程）
5. `la-cozzi-website/docs/RELEASE_CHECKLIST.md`（正式上線檢查表）
6. `la-cozzi-website/docs/tasks/AG-TASK-TEMPLATE.md`（標準 AG 任務範本）
7. `la-cozzi-website/src/app/layout.tsx`
8. `la-cozzi-website/src/app/globals.css`
9. `la-cozzi-website/src/app/(site)/layout.tsx`
10. `la-cozzi-website/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`
11. `la-cozzi-website/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md`

> 重要文件依據：此專案使用 Next.js 16.2.1。依據 Next.js 16.2.1 本機文件，錯誤重試 API 為 `unstable_retry()`。嚴禁依照舊版 Next.js 經驗擅自改用 `reset()`。

---

## 7. 開始前的現況基準

執行前的專案現況基準核對：

- `la-cozzi-website/src/app/error.tsx` 原先不存在。
- `la-cozzi-website/src/app/global-error.tsx` 原先不存在。
- `la-cozzi-website/src/app/not-found.tsx` 原先不存在。
- 專案原先不存在專門驗證 404 頁面的冒煙測試。
- 正常頁面已有 12 項 Playwright 冒煙測試（全數通過）。
- 純邏輯單元測試已有 44 項（全數通過）。
- 專案已有全域深色（stone/amber）視覺樣式。

---

## 8. 允許修改範圍

本任務僅允許新增或修改下列 9 個檔案，不得變更任何其他檔案：

- `la-cozzi-website/src/app/error.tsx`
- `la-cozzi-website/src/app/global-error.tsx`
- `la-cozzi-website/src/app/not-found.tsx`
- `la-cozzi-website/tests/smoke/error-pages.spec.ts`
- `la-cozzi-website/docs/tasks/AG-009-ERROR-FALLBACKS.md`
- `la-cozzi-website/docs/tasks/README.md`
- `la-cozzi-website/docs/PROJECT_ROADMAP.md`
- `la-cozzi-website/docs/CURRENT_STATE.md`
- `la-cozzi-website/CHANGELOG.md`

---

## 9. 禁止修改範圍

- 不得修改正常頁面與既有元件。
- 不得修改 Root Layout 或網站 Layout。
- 不得修改 `globals.css`。
- 不得修改既有測試（12 項 smoke tests 與 44 項 unit tests）。
- 不得修改 `package.json` 或 `package-lock.json`。
- 不得新增、移除或升級套件。
- 不得修改 Next.js 設定（`next.config.ts`）。
- 不得修改 Prisma、資料庫或 seed。
- 不得修改 API、Server Actions 或認證流程。
- 不得新增可觸發正式錯誤的測試路由。
- 不得修改環境變數。
- 不得修改 CI workflow。
- 不得修改 Vercel、Supabase、DNS 或網域。
- 不得加入外部監控服務。
- 不得改變正常頁面的文案、樣式或互動。
- 不得直接合併至 `main`。

---

## 10. 實作要求

### A. 一般錯誤降級頁面（`src/app/error.tsx`）
- Client Component，第一行標註 `"use client"`。
- 使用 Next.js 16.2.1 `unstable_retry()`，不使用舊版 `reset()`。
- 繁體中文標題：「頁面暫時無法顯示」。
- 繁體中文說明：「可能只是暫時性的狀況，請重新嘗試或先回到首頁。」。
- 提供「重新載入內容」按鈕（`type="button"`，呼叫 `unstable_retry()`）。
- 提供「回到首頁」連結（指向 `/`）。
- 語意正確之 `<main>` 與 `<h1>`，支援鍵盤無障礙操作。
- 沿用既有 stone／amber 深色視覺設計，無水平溢位。
- 不顯示錯誤訊息、Stack Trace、檔案路徑、Digest 或 Session 技術資訊。
- 不新增外部圖片、字型或網路請求。

### B. 根層錯誤最後防線（`src/app/global-error.tsx`）
- Client Component，第一行標註 `"use client"`。
- 自行包含 `<html lang="zh-TW">` 與 `<body>`，包含 `<title>網站暫時發生問題 | La Cozzi 拉釦子樂團</title>`。
- 使用 `unstable_retry()` 提供重新嘗試功能。
- 提供回到首頁的普通 `<a href="/">` 連結。
- 繁體中文標題：「網站暫時發生問題」。
- 繁體中文說明：「我們正在努力恢復服務，請稍後再試。」。
- 使用最小且自足的純行內樣式（inline style），確保 Root Layout 與 CSS 失效時仍可閱讀與操作。
- 不匯入 Navbar、資料庫、外部圖片、Google Fonts 或其他可能失敗之相依。
- 不顯示任何技術錯誤內容、訊息或 Stack Trace。

### C. 404 頁面（`src/app/not-found.tsx`）
- 維持 Server Component，不加入 `"use client"`。
- 顯示明確的 `404` 標示。
- 繁體中文主標題：「找不到這個頁面」。
- 說明文案：「這個網址可能已變更，或頁面暫時不存在。」。
- 提供「回到首頁」連結（指向 `/`）與「查看演出影音」連結（指向 `/videos`），使用 `next/link`。
- 語意正確之 `<main>` 與 `<h1>`，沿用 stone／amber 深色視覺設計，無水平溢位。
- 不新增圖片、外部資源或資料庫查詢。
- 不啟用實驗性 `globalNotFound`，依賴 Next.js 既有 404 noindex 行為。

### D. 404 冒煙測試（`tests/smoke/error-pages.spec.ts`）
- 驗證開啟不存在之路徑（如 `/__smoke__/missing-page-404`）回傳 HTTP 404。
- 驗證「找不到這個頁面」主標題可見、「404」標示可見。
- 驗證「回到首頁」（`href="/"`）與「查看演出影音」（`href="/videos"`）連結存在。
- 驗證點擊「回到首頁」可回到 `/`。
- 驗證頁面無水平溢位。
- 測試不提交表單、不登入後台、不寫入資料、不依賴資料庫。

---

## 11. 驗收條件

- [x] `error.tsx` 使用 `"use client"` 與 `unstable_retry()`。
- [x] `global-error.tsx` 包含自己的 html、body 與 title。
- [x] `global-error.tsx` 不依賴 Root Layout 或外部資源。
- [x] `not-found.tsx` 維持 Server Component。
- [x] 所有訪客可見文字均為繁體中文。
- [x] 不顯示任何技術錯誤細節（無 message、stack、digest 洩漏）。
- [x] 404 回應狀態為 404。
- [x] 404 頁面具備首頁與影音頁連結。
- [x] 新增的 404 冒煙測試通過。
- [x] 原有 12 項冒煙測試全部通過（總計 13 項通過）。
- [x] 44 項單元測試全部通過。
- [x] 正常頁面沒有視覺或行為變更。
- [x] 沒有資料庫、環境變數或正式資料變更。
- [x] 沒有新增套件或 lockfile 變更。
- [x] 沒有測試用正式路由或除錯入口。
- [x] Preview 的 404 頁面可正常顯示。

---

## 12. 必須執行的檢查

在 `la-cozzi-website/` 目錄執行：

```bash
npm run test:unit
npm run typecheck
npm run lint
npm run build
npm run test:smoke
```

在儲存庫根目錄執行 Git 狀態檢查：

```bash
git diff --check
git status --short
git diff --stat origin/main...HEAD
git diff origin/main...HEAD
```

確認項目：
- 差異僅包含允許修改的 9 個檔案。
- `package.json` 與 `package-lock.json` 未變更。
- 沒有新增測試用路由或除錯端點。
- GitHub Actions CI 全部通過。
- Vercel Preview 部署成功。

---

## 13. 資料庫、環境變數與正式環境影響

- **是否修改資料庫結構或 migration**：否。
- **是否新增或變更環境變數**：否。
- **是否影響正式環境資料**：否。
- **是否需要資料遷移或腳本**：否。
- **是否修改 Vercel 部署設定**：否。

---

## 14. 分支名稱、Commit 與 Pull Request 規則

1. **分支策略**：
   - 工作分支：`ag/error-fallback-pages`（切自最新 `origin/main`）。
2. **Commit 規範**：
   - Conventional Commits 格式：`feat: add site-wide error fallbacks`。
3. **Pull Request 規範**：
   - 指向 `main` 分支。
   - 完整說明任務目的、錯誤頁面設計、404 測試結果、未修改範圍保證、本地檢查結果、CI/Preview 狀態與回復方式。
   - **嚴禁 AG 自行合併 Pull Request 至 `main`**。

---

## 15. 回復方式

本任務不修改資料庫或正式資料。

- **合併前發現問題**：直接關閉 Pull Request 或在原工作分支補上修正 Commit。
- **合併後發現問題**：透過 Git revert 建立還原 PR 合併至 `main`。不需要操作資料庫還原或 Vercel Rollback。

---

## 16. AG 完成後的回報格式

AG 完成實作、本地檢查、推送與 PR 建立後，必須停止進一步操作，並以繁體中文提供下列結構化回報：

1. **Pull Request 連結**
2. **Commit ID**
3. **實際新增及修改的檔案**
4. **`error.tsx` 的處理方式**
5. **`global-error.tsx` 的自足設計**
6. **`not-found.tsx` 的內容與導覽連結**
7. **404 冒煙測試項目與結果**
8. **44 項 Unit Tests 結果**
9. **Typecheck、Lint、Build 與完整 Smoke Tests 結果**
10. **GitHub Actions CI 結果**
11. **Vercel Preview 狀態與 404 驗證網址**
12. **確認沒有新增測試路由、套件、lockfile、資料庫或環境變數變更**
13. **未完成項目、已知限制或偏離規格之處**

---

## 17. Codex 審查與正式上線規則

1. **獨立審查**：AG 完成回報後必須停止，交由 Codex 審查完整 Git diff 與測試日誌，不依賴口頭摘要。
2. **Preview 驗證**：Codex 必須確認 Vercel Preview 狀態與 404 頁面表現。
3. **嚴禁預設合併**：Codex 驗收通過後，必須由專案負責人核准始可合併至 `main`。
4. **上線後確認**：合併後應依照 `docs/RELEASE_CHECKLIST.md` 執行線上確認，並維護 CHANGELOG 與發布紀錄完整性。
