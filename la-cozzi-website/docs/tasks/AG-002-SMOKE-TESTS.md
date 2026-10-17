# AG-002：建立核心唯讀 Smoke Tests 並更新 CI Actions

## 任務狀態

- 優先級：高
- 風險等級：低
- 執行角色：AG
- 規格與驗收角色：Codex
- 前台視覺變更：不得有
- 正式資料影響：不得有

## 專案負責人預先授權

專案負責人已授權 AG 在本任務範圍內自主完成下列事項，不需要逐項詢問：

- 讀取專案檔案及本機 Next.js 文件。
- 安裝本任務指定的測試開發相依套件。
- 修改本任務允許範圍內的測試、設定、文件與 CI 檔案。
- 執行 lint、型別檢查、建置、Playwright 測試及其他非破壞性檢查。
- 下載 Playwright Chromium 測試瀏覽器。
- 建立工作分支、commit、推送工作分支及建立 Pull Request。
- 修正因本任務變更造成的測試或 CI 失敗，前提是不超出原訂範圍。

只有下列情況必須停止並請 Codex 或專案負責人決定：

- 需要向報價、評論或其他表單送出真實資料。
- 需要登入後台或使用任何正式帳號。
- 需要刪除、建立或修改資料庫資料、Storage 內容、migration 或正式環境資源。
- 需要讀取、建立、更新或顯示密碼、Token、私密金鑰及正式環境機密。
- 需要修改 Vercel Production、DNS、網域或正式環境變數。
- 需要直接推送、強制推送或合併至 `main`。
- 發現必須超出本任務允許範圍才能完成。

AG 執行環境若顯示作業系統或安全性核准視窗，仍以平臺安全機制為準；本段授權不能繞過平臺強制的權限確認。

## 背景與目的

AG-001 已完成 ESLint 清理及 GitHub Actions CI，目前 `typecheck`、`lint` 與 `build` 都可自動執行，但專案仍缺少瀏覽器層級的核心頁面保護。此外，GitHub Actions 已提示 `actions/checkout@v4` 與 `actions/setup-node@v4` 使用的內部 Node.js 執行環境即將淘汰。

本任務目標如下：

1. 使用 Playwright Chromium 建立最小、穩定、唯讀的 smoke tests。
2. 在 Pull Request 與 `main` 的 CI 中執行 smoke tests。
3. 將 GitHub 官方 Actions 更新至不再產生上述 Node.js 淘汰提示的版本。
4. 不測試或觸發任何正式資料寫入行為。

## 執行前必讀

1. `AGENTS.md`
2. `docs/ARCHITECTURE.md`
3. `docs/DELIVERY_PROCESS.md`
4. `docs/DEPLOYMENT.md`
5. `docs/RELEASE_CHECKLIST.md`
6. `node_modules/next/dist/docs/01-app/02-guides/testing/playwright.md`

此專案使用 Next.js 16.2.1。不得依賴舊版 Next.js 的慣例或記憶直接修改設定。

## 開始前基準

從最新 `main` 開始，預期 commit 至少包含：

```text
9e99dae chore: 清理 ESLint 基準並建立 CI 工作流程 (AG-001) (#4)
```

開始實作前必須確認：

```text
git status --short --branch
npm run typecheck
npm run lint
npm run build
```

若工作目錄不乾淨，或任何既有檢查失敗，先停止並回報 Codex。

## 允許修改範圍

- `package.json`
- `package-lock.json`
- `playwright.config.ts`
- `tests/smoke/**`
- `.github/workflows/ci.yml`
- `.gitignore`，僅限忽略 Playwright 產物。
- `docs/DEPLOYMENT.md`
- `docs/RELEASE_CHECKLIST.md`
- `docs/CURRENT_STATE.md`
- `docs/PROJECT_ROADMAP.md`
- `docs/RISK_REGISTER.md`
- `CHANGELOG.md`

## 禁止修改範圍

- 不得修改 `src/**`、`prisma/**` 或任何網站功能程式碼。
- 不得改變任何前台版面、文案、動畫、互動或 SEO 內容。
- 不得送出報價、評論或任何其他公開表單。
- 不得登入後台、建立使用者或測試管理員寫入功能。
- 不得連線正式資料庫執行讀寫測試。
- 不得使用正式環境密鑰、正式帳密或真實個人資料。
- 不得修改 Vercel 部署設定、正式環境變數、DNS 或網域。
- 不得以固定等待時間取代可靠的 Playwright locator 與 assertion。
- 不得把失敗測試標記為略過，也不得加入會掩蓋錯誤的廣泛重試。
- 不得直接推送或合併至 `main`。

## 實作要求

### A. Playwright 設定

1. 將 `@playwright/test` 加入 `devDependencies`，並更新 lockfile。
2. 新增 `playwright.config.ts`，只啟用 Chromium，測試目錄指向 `tests/smoke`。
3. 測試必須預設使用 `http://127.0.0.1:3000`，不得指向正式網址或 Vercel Preview。
4. 使用 Playwright `webServer` 啟動本機 Next.js；測試應盡可能針對 production build 執行。
5. CI 必須禁止重用未知的既有伺服器；本機可在安全情況下重用開發者已啟動的同址伺服器。
6. 僅在 CI 啟用一次重試，並保留失敗時的 trace；本機預設不重試。
7. 將 `playwright-report/`、`test-results/` 與必要測試產物加入 `.gitignore`。
8. 在 `package.json` 新增清楚的 smoke test 指令。該指令名稱必須能直接從文件與 CI 使用，例如 `npm run test:smoke`。

### B. 必須涵蓋的唯讀測試

#### 1. 公開頁面可用性

逐頁確認以下路徑回傳成功、具有正確頁面標題、主要內容可見，且頁面沒有 `Application error`：

- `/`
- `/brand`
- `/videos`
- `/partners`
- `/blog`
- `/reviews`
- `/admin`

不得強制要求現況原本沒有的 H1。`/partners`、`/blog` 與 `/reviews` 缺少 H1 是既有 P3 SEO 問題，不屬於本任務修正範圍。

#### 2. 主要導覽

在首頁確認下列導覽入口存在且 href 正確：

- 樂團簡介 → `/brand`
- 演出影音 → `/videos`
- 夥伴列表 → `/partners`
- 深度文章 → `/blog`
- 客戶好評 → `/reviews`
- 後台登入 → `/admin`

至少實際點擊一個內部導覽連結並確認 URL 與頁面標題正確。

#### 3. 報價表單安全驗證

- 確認 Email 輸入框存在且類型為 `email`。
- 確認未填 Email 時，表單不能送出。
- 確認格式錯誤的 Email 無法通過瀏覽器驗證。
- 必須攔截或監看網路請求，證明測試期間沒有對報價 API 發出實際 POST。
- 不得測試成功寄信，不得使用真實 Email。

#### 4. 後台登入頁

- 確認未登入狀態顯示帳號與密碼欄位及登入按鈕。
- 不得填入帳密，不得送出登入表單。
- 不得測試需要身分驗證的後台頁面。

#### 5. SEO 基本端點

- `/robots.txt` 回傳成功且內容包含 sitemap 位置。
- `/sitemap.xml` 回傳成功，內容至少包含正式站首頁及主要公開頁面 URL。

### C. CI 更新

1. 將 `actions/checkout` 與 `actions/setup-node` 更新至 GitHub 官方目前可消除 Node.js 20 Action runtime 淘汰提示的穩定主要版本；預期為 `@v5`，若實際環境不同，必須在回報中附上理由。
2. 應用程式測試使用的 Node.js 版本仍維持目前專案相容的 Node.js 20 LTS，不要擅自升級應用程式執行版本。
3. 在 CI 安裝 Chromium 與必要系統相依套件，僅安裝 smoke tests 需要的瀏覽器。
4. CI 執行順序至少包含：

```text
npm ci
npm run typecheck
npm run lint
npm run build
npm run test:smoke
```

若 Playwright `webServer` 會自行執行 production build，可調整以避免同一個 CI 重複建置，但 Pull Request 上必須仍有一個清楚可辨識且成功的 production build 步驟。

5. CI 只能使用明確的無敏感測試值，不得加入 repository secrets 或正式服務憑證。
6. workflow 權限維持最小化，只允許讀取儲存庫內容。
7. 不得加入部署、資料搬遷、資料庫寫入或表單提交步驟。
8. 若測試失敗，上傳 Playwright report 或 trace 作為短期除錯 artifact；不得上傳環境檔、密鑰或使用者資料。

### D. 文件與狀態更新

1. 在 `docs/DEPLOYMENT.md` 說明本機 smoke test 指令及測試範圍。
2. 在 `docs/RELEASE_CHECKLIST.md` 將可由自動化完成的頁面檢查標示清楚，人工檢查仍須保留。
3. 更新 `docs/CURRENT_STATE.md`、`docs/PROJECT_ROADMAP.md` 與 `docs/RISK_REGISTER.md` 中已過期的 ESLint／CI 狀態，不得繼續記載 32 個錯誤與 17 個警告為現況。
4. 更新 `CHANGELOG.md`。

## 驗收條件

- [ ] `npm run typecheck` 通過。
- [ ] `npm run lint` 為 0 錯誤、0 警告。
- [ ] `npm run build` 通過。
- [ ] `npm run test:smoke` 在本機通過。
- [ ] CI 中的 Chromium smoke tests 通過。
- [ ] CI 不再出現 `actions/checkout@v4` 或 `actions/setup-node@v4` 的 Node.js 20 runtime 淘汰提示。
- [ ] 測試沒有連線正式資料庫、使用正式密鑰或送出任何表單。
- [ ] Vercel Preview 可正常開啟。
- [ ] 前台畫面與既有行為不變。
- [ ] 文件已反映 AG-001 與 AG-002 完成後的實際現況。
- [ ] diff 中沒有 `src/**`、`prisma/**` 或其他規格外修改。

## 必須執行的檢查

```text
npm run typecheck
npm run lint
npm run build
npm run test:smoke
git diff --check
```

若本機 build 因 Google Fonts 等外部網路限制失敗，必須保存完整錯誤並交由 Codex 在具網路環境重跑；不得移除字型或改變前台外觀。

## 資料與正式環境影響

- 是否修改資料庫：否。
- 是否新增正式環境變數：否。
- 是否影響正式資料：否。
- 是否需要資料搬遷：否。
- 是否修改部署流程：否；僅擴充 GitHub Pull Request 品質檢查。

## 分支與交付

1. 從最新 `main` 建立分支：`ag/core-smoke-tests`。
2. 建議分成兩個 commit：
   - `test: add read-only core smoke tests`
   - `ci: run smoke tests with current actions`
3. 推送分支並建立 Pull Request，但不要自行合併。
4. 將 Pull Request 連結交給 Codex 審查。

## 回復方式

- 未合併前：關閉 Pull Request 即可，不影響正式站。
- 合併後若 CI 不穩定：以新 Pull Request 暫時移除 smoke test CI 步驟，但保留測試檔案供本機重現。
- 若測試設定影響建置：回復本任務 commit；本任務沒有資料或正式環境回復需求。

## AG 完成後的回報格式

請逐項提供：

1. 修改摘要。
2. 實際修改檔案清單。
3. smoke tests 涵蓋的路徑與 assertion。
4. 如何證明測試沒有送出表單或寫入資料。
5. 所有測試指令、結果及執行環境。
6. CI 執行連結與各步驟結果。
7. 未完成或無法驗證的項目。
8. 已知風險或可能不穩定因素。
9. 是否偏離本規格；若有，說明原因並等待 Codex 決定。
