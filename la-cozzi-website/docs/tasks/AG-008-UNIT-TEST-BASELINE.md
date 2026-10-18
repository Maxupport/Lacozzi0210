# AG-008：建立純邏輯單元測試基準並納入 CI

> 本文件為 La Cozzi 官網專案的具體任務執行規格書。依據 `docs/tasks/AG-TASK-TEMPLATE.md` 標準範本建立，完整記錄任務背景、授權邊界、現況基準、修改範圍、驗收條件與回復流程。

---

## 1. 任務編號與名稱

- **任務編號**：AG-008
- **任務名稱**：建立純邏輯單元測試基準並納入 CI

---

## 2. 任務狀態

- **優先級**：高
- **風險等級**：低
- **執行角色**：AG
- **規格與驗收角色**：Codex
- **是否允許前台視覺變更**：否（嚴禁任何視覺外觀或互動變更）
- **是否影響正式資料**：否（單元測試完全不存取資料庫與外部網路）

---

## 3. 背景與目的

專案目前已有 Playwright Chromium 核心唯讀冒煙測試（Smoke Tests），保護主要公開路由、導覽列、報價表單前台驗證、後台登入頁與 SEO 端點。

然而，專案 Roadmap 中規劃的「建立核心單元與整合測試」先前尚未展開。`src/lib/utils.ts`（網址代稱處理、YouTube 網址與播放清單解析、台北時區日期格式化）與 `src/lib/session.ts`（JWT 簽署與驗證契約、Cookie 安全設定）等重要純邏輯，過去欠缺快速、獨立且不依賴外部服務的自動化單元測試。

本次任務目標：
1. 使用 Node.js 內建 `node:test`、`node:assert/strict` 與專案既有的 `tsx` 建立純邏輯單元測試基準。
2. 保護網址代稱、YouTube 網址/播放清單解析、台北時區日期格式化及 Session JWT 簽署/驗證純邏輯。
3. 將單元測試指令 `npm run test:unit` 納入 GitHub Actions CI 工作流程（於 Lint 後、Build 前執行）。
4. 不新增任何相依套件、不修改 `package-lock.json`、不啟動 Next.js 伺服器、不連線資料庫或外部服務，亦不改變任何網站既有行為。

---

## 4. 專案負責人預先授權

專案負責人已授權 AG 在本任務明確列出的範圍內自主完成下列事項，無需逐項詢問：

- 閱讀專案、測試與治理文件。
- 新增本任務指定的單元測試檔案（`tests/unit/utils.test.ts`、`tests/unit/session.test.ts`）。
- 在 `la-cozzi-website/package.json` 加入單元測試指令 `test:unit`。
- 在既有 GitHub Actions CI（`.github/workflows/ci.yml`）中加入單元測試步驟。
- 更新本任務指定的治理文件。
- 執行非破壞性的型別檢查、Lint、單元測試、Build 與冒煙測試。
- 建立短期工作分支、建立 Commit、推送分支至遠端及建立 Pull Request。
- 修正本任務直接造成的測試或 CI 問題，但不得擴大修改範圍。

---

## 5. 必須停止並回報的條件

遇到下列任何情況時，AG 必須立即停止操作並向 Codex 或專案負責人回報，不得自行決策：

1. **涉及機密**：需要讀取、顯示、提交或要求提供正式密碼、Token、Cookie、私密金鑰或正式連線字串。
2. **正式環境與資料異動**：需要修改正式資料庫、正式環境變數、DNS、網域或 Vercel Production 設定。
3. **正式程式碼改動**：必須修改 `src/` 內的正式程式才能讓測試通過。
4. **現有行為歧異**：發現現有行為疑似錯誤，且測試預期需要改變正式程式邏輯。
5. **相依套件與 lockfile**：必須新增相依套件或修改 `package-lock.json`。
6. **範圍外檔案**：必須修改本任務允許範圍以外的檔案。
7. **現況基準不符**：實際專案狀況與本任務基準明顯不符。
8. **Git 保護違規**：直接推送至 `main`、強制推送或自行合併 Pull Request 至 `main`。

---

## 6. 執行前必讀文件

在開始動工前，AG 必須完整閱讀下列文件與規範：

1. `AGENTS.md`（遵循 Next.js 16 breaking changes 規範）
2. `README.md` 與 `la-cozzi-website/README.md`
3. `la-cozzi-website/docs/DELIVERY_PROCESS.md`（開發、驗收與發布流程）
4. `la-cozzi-website/docs/RELEASE_CHECKLIST.md`（正式上線檢查表）
5. `la-cozzi-website/docs/tasks/AG-TASK-TEMPLATE.md`（標準 AG 任務範本）
6. `la-cozzi-website/src/lib/utils.ts`
7. `la-cozzi-website/src/lib/session.ts`
8. `la-cozzi-website/package.json`
9. `.github/workflows/ci.yml`
10. `la-cozzi-website/node_modules/next/dist/docs/01-app/02-guides/testing/index.md`

> 附註：本任務不修改 Next.js 頁面、Route Handler 或設定；不得因閱讀測試文件而改用需要新增相依套件之工具。

---

## 7. 開始前的現況基準

執行前的專案現況基準核對：

- `la-cozzi-website/package.json` 只有 `test:smoke`，尚未包含 `test:unit` 指令。
- `la-cozzi-website/tests/` 目錄下僅有 `tests/smoke/` 唯讀冒煙測試，無單元測試。
- 專案 `devDependencies` 中已具備 `tsx`（版本 `^4.23.15`）。
- GitHub Actions CI 工作流程（`.github/workflows/ci.yml`）目前依序執行 Typecheck、Lint、Build 與 Smoke Tests。
- `src/lib/utils.ts` 與 `src/lib/session.ts` 尚無自動化單元測試。
- GitHub Actions CI 環境使用 Node.js 20。

---

## 8. 允許修改範圍

本任務僅允許新增或修改下列檔案，不得變更任何其他檔案：

- `.github/workflows/ci.yml`
- `la-cozzi-website/package.json`
- `la-cozzi-website/tests/unit/utils.test.ts`
- `la-cozzi-website/tests/unit/session.test.ts`
- `la-cozzi-website/docs/tasks/AG-008-UNIT-TEST-BASELINE.md`
- `la-cozzi-website/docs/tasks/README.md`
- `la-cozzi-website/docs/PROJECT_ROADMAP.md`
- `la-cozzi-website/docs/CURRENT_STATE.md`
- `la-cozzi-website/CHANGELOG.md`

---

## 9. 禁止修改範圍

嚴格禁止觸及下列項目：

- 嚴禁修改 `src/` 內任何正式程式碼。
- 嚴禁修改 `prisma/` 結構或 seed 程式碼。
- 嚴禁修改 `public/` 靜態資產。
- 嚴禁修改既有 Playwright 冒煙測試（`tests/smoke/`）。
- 嚴禁修改 `playwright.config.ts`。
- 嚴禁修改 Next.js 設定檔（`next.config.ts`）。
- 嚴禁修改任何環境變數檔案（`.env`、`.env.example` 等）。
- 嚴禁修改 `package-lock.json`。
- 嚴禁新增、移除或升級任何相依套件（如 Vitest、Jest 等）。
- 嚴禁連線或寫入任何資料庫。
- 嚴禁呼叫任何外部網路 API（包含 YouTube、Supabase、Vercel 等）。
- 嚴禁修改 Vercel、Supabase、DNS 或網域設定。
- 嚴禁修改 CI 權限設定、觸發條件或既有環境變數值。
- 嚴禁重新命名既有 CI workflow 或 job 顯示名稱。
- 嚴禁直接合併至 `main`。
- 嚴禁順便修正測試過程中發現的正式程式問題。

---

## 10. 實作要求

### A. 使用既有工具建立單元測試指令
- 修改 `la-cozzi-website/package.json`，新增：
  `"test:unit": "tsx --test tests/unit/*.test.ts"`
- 使用 Node.js 內建 `node:test` 與 `node:assert/strict`。
- 使用專案既有的 `tsx` 執行 TypeScript 測試。
- 不得讓 `test:unit` 啟動 Next.js 伺服器，亦不得連線至外部服務。

### B. 建立 utils 單元測試
- 新增 `la-cozzi-website/tests/unit/utils.test.ts`，測試 `src/lib/utils.ts`：
  - `slugify`：英文大寫轉小寫、中文字元保留、空白與一般符號轉連字號、危險字元移除、前後不留連字號、長度限制（<=80）、Unicode NFKC 正規化。
  - `isValidSlug`：合法英數 slug、合法中文 slug、空字串失敗、含空白失敗、含特殊/危險字元失敗、超過 100 字元失敗。
  - `getYouTubeId`：涵蓋 watch 網址、短網址、embed 網址、shorts 網址、live 網址、nocookie 網址、www/m 子網域、空值、無效網址、非 YouTube 網域、外觀相似惡意網域阻擋；使用假 ID，不呼叫外部網路。
  - `getYouTubePlaylistId`：原始播放清單 ID、playlist 網址 list 參數、watch 網址 list 參數、空值、無效網址、缺少 list 參數網址。
  - `formatDate`：空值回傳空字串、ISO 字串、Date 物件、嚴格以 Asia/Taipei 時區處理（不受主機本地時區影響）。

### C. 建立 Session 單元測試
- 新增 `la-cozzi-website/tests/unit/session.test.ts`，測試 `src/lib/session.ts`：
  - `OWNER` 與 `EDITOR` Session 簽署與還原驗證。
  - 未提供 Token 回傳 `null`。
  - 被竄改之 Token 回傳 `null`。
  - 使用錯誤密鑰之 Token 回傳 `null`。
  - 不合法角色或無效 payload 之 Token 回傳 `null`。
  - 缺少 `AUTH_SECRET` 時簽署必須拋出錯誤。
  - `AUTH_SECRET` 少於 32 字元時簽署必須拋出錯誤。
  - `SESSION_COOKIE` 與 `SESSION_MAX_AGE` 維持既有公開契約。
  - Cookie 設定包含 `httpOnly`、`sameSite: 'lax'`、根路徑與既有有效期限。
  - 測試使用假密鑰（長度 >= 32 字元），不讀取 `.env`，不輸出 Token 或密鑰至日誌，測試結束後完整還原 `AUTH_SECRET`。

### D. 將單元測試納入 CI
- 修改 `.github/workflows/ci.yml`，在 Lint 通過後、Build 前加入 `Run unit tests` 步驟（執行 `npm run test:unit`）。
- 保持 job 名稱、觸發條件、權限與環境變數完全不變。

### E. 治理文件同步更新
- 同步更新 `docs/tasks/README.md`、`docs/PROJECT_ROADMAP.md`、`docs/CURRENT_STATE.md` 與 `CHANGELOG.md`。
- Roadmap 中「建立核心單元與整合測試」不得整項標記完成，應拆分標明純邏輯單元測試基準已完成（AG-008），整合測試仍待後續處理。
- 所有文件均使用繁體中文。

---

## 11. 驗收條件

- [x] `npm run test:unit` 可在 `la-cozzi-website/` 目錄獨立執行。
- [x] 單元測試不需啟動 Next.js 伺服器。
- [x] 單元測試不連線資料庫或外部服務。
- [x] `utils.test.ts` 涵蓋所有指定函式與邊界條件。
- [x] `session.test.ts` 涵蓋有效、缺失、竄改、錯誤密鑰與不合法角色。
- [x] 測試不輸出 Token 或密鑰至日誌。
- [x] 測試結束後完整還原 `process.env.AUTH_SECRET`。
- [x] CI 在 Lint 後、Build 前執行 `npm run test:unit`。
- [x] CI workflow、job 名稱、權限與觸發條件保持不變。
- [x] `package-lock.json` 未受任何變更。
- [x] `src/` 未受任何變更。
- [x] Roadmap 未把尚未完成的整合測試標示完成。
- [x] 所有文件均使用繁體中文。
- [x] 沒有正式資料、資料庫、環境變數或前台行為變更。

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
- `git diff --name-only origin/main...HEAD` 僅包含允許修改的檔案。
- `package-lock.json` 未變更。
- `src/` 未變更。
- GitHub Actions CI 的 Unit Tests 步驟通過。
- GitHub Actions CI 所有既有步驟全數通過。
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
   - 工作分支：`ag/unit-test-baseline`（切自最新 `origin/main`）。
2. **Commit 規範**：
   - 採用 Conventional Commits 格式：`test: add pure logic unit test baseline`。
3. **Pull Request 規範**：
   - 指向 `main` 分支。
   - 完整列出任務目的、測試檔案與涵蓋範圍、單元測試總數與結果、CI 修改內容、未修改範圍保證、本地檢查結果、CI/Preview 狀態與回復方式。
   - **嚴禁 AG 自行合併 Pull Request 至 `main`**。

---

## 15. 回復方式

本任務不修改正式程式與正式資料。

- **合併前發現問題**：直接關閉 Pull Request 或在原工作分支補上修正 Commit。
- **合併後發現問題**：透過 Git revert 建立還原 PR 合併至 `main`。不需要操作 Vercel Rollback，亦不需要執行資料庫還原。

---

## 16. AG 完成後的回報格式

AG 完成實作、本地檢查、推送與 PR 建立後，必須停止進一步操作，並以繁體中文提供下列結構化回報：

1. **Pull Request 連結**
2. **Commit ID**
3. **實際新增及修改的檔案**
4. **單元測試總數**
5. **`utils.test.ts` 的測試範圍**
6. **`session.test.ts` 的測試範圍**
7. **`npm run test:unit` 結果**
8. **Typecheck、Lint、Build 與 Smoke Tests 結果**
9. **GitHub Actions CI 結果**
10. **Vercel Preview 狀態**
11. **確認 `src/`、`package-lock.json`、資料庫與環境變數均未修改**
12. **未完成項目、已知限制或偏離規格之處**

---

## 17. Codex 審查與正式上線規則

1. **獨立審查**：AG 完成回報後必須停止，交由 Codex 審查完整 Git diff 與測試日誌，不依賴口頭摘要。
2. **Preview 驗證**：Codex 必須確認 Vercel Preview 狀態與 GitHub Actions CI 綠燈。
3. **嚴禁預設合併**：Codex 驗收通過後，必須由專案負責人核准始可合併至 `main`。
4. **上線後確認**：合併後應依照 `docs/RELEASE_CHECKLIST.md` 執行線上確認，並維護 CHANGELOG 與發布紀錄完整性。
