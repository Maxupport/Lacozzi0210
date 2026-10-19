# AG-010：補強登入、密碼與權限純邏輯單元測試

> 本文件為 La Cozzi 官網專案的具體任務執行規格書。依據 `docs/tasks/AG-TASK-TEMPLATE.md` 標準範本建立，完整記錄任務背景、授權邊界、現況基準、測試案例要求、隔離保證、驗收條件與回復流程。

---

## 1. 任務編號與名稱

- **任務編號**：AG-010
- **任務名稱**：補強登入、密碼與權限純邏輯單元測試

---

## 2. 任務狀態

- **優先級**：高
- **風險等級**：低
- **執行角色**：AG
- **規格與驗收角色**：Codex
- **是否允許前台視覺變更**：否（完全不改動任何前台或後台畫面）
- **是否影響正式資料**：否（測試純為記憶體內運算，不存取資料庫與外部網路）
- **資料庫或環境變數影響**：否

---

## 3. 背景與目的

在不改變任何正式網站行為的前提下，為現有管理員登入帳號正規化、密碼長度驗證契約、bcrypt 密碼雜湊與驗證，以及文章編輯權限邏輯建立快速、獨立且可重複執行的單元測試保護。

本次任務目標：
1. 使用 Node.js 內建 `node:test`、`node:assert/strict` 與既有 `tsx` 執行純邏輯測試，不引入新測試框架。
2. 鎖定 `src/lib/auth.ts` 內現有純邏輯契約：`normalizeUsername`、`validatePassword`、`hashPassword`、`verifyPassword`、`canEditPost`、`MAX_FAILED_LOGINS`、`LOCK_MINUTES`。
3. 嚴格落實測試隔離，不連線 PostgreSQL 資料庫、不依賴 `DATABASE_URL` 或 `AUTH_SECRET` 正式環境變數、不輸出密碼或雜湊至測試日誌。
4. 未修改任何正式程式碼（`src/` 內既有檔案完全零改動）。

---

## 4. 專案負責人預先授權

專案負責人已授權 AG 在本任務明確列出的範圍內自主完成下列事項，無需逐項詢問：

- 閱讀專案檔案、治理文件及與修改範圍相關的文件。
- 新增本任務指定的單元測試檔案（`tests/unit/auth.test.ts`）。
- 新增與更新本任務指定的治理文件。
- 執行非破壞性的型別檢查、Lint、單元測試、Build 與冒煙測試。
- 建立短期工作分支、建立 Commit、推送分支至遠端及建立 Pull Request。
- 修正本任務直接造成的測試或 CI 問題，但不得擴大修改範圍。

---

## 5. 必須停止並回報的條件

遇到下列任何情況時，AG 必須立即停止操作並向 Codex 或專案負責人回報，不得自行決策：

1. **正式程式改動**：必須修改 `src/lib/auth.ts` 或其他正式程式才能完成測試。
2. **外部與資料庫連線**：測試會實際嘗試連線資料庫、外部服務，或造成測試無法隔離。
3. **套件與 lockfile**：需要新增、移除或升級套件，或修改 `package-lock.json`。
4. **安全缺陷疑慮**：發現現有登入或權限行為疑似存在安全缺陷。
5. **基準不符**：現有測試或基準在修改前已失敗。
6. **未提交修改**：工作目錄存在來源不明的未提交修改。
7. **Git 歷程不符**：`main` 未包含 PR #12 合併 Commit（`163d251`）。
8. **Git 保護違規**：直接推送至 `main`、強制推送或自行合併 Pull Request 至 `main`。

---

## 6. 執行前必讀文件

在開始動工前，AG 必須完整閱讀下列文件與規範：

1. `AGENTS.md`（遵循 Next.js 16 breaking changes 規範）
2. `docs/PROJECT_ROADMAP.md`
3. `docs/CURRENT_STATE.md`
4. `docs/tasks/AG-TASK-TEMPLATE.md`
5. `docs/tasks/AG-008-UNIT-TEST-BASELINE.md`
6. `src/lib/auth.ts`
7. `src/lib/session.ts`
8. `tests/unit/session.test.ts`
9. `tests/unit/utils.test.ts`
10. `package.json`
11. `.github/workflows/ci.yml`

---

## 7. 開始前的現況基準

執行前的專案現況基準核對（以 Commit `163d251` 為基準）：

- `npm run test:unit`：44 項測試通過（`session.test.ts` 10 項、`utils.test.ts` 34 項）。
- `npm run typecheck`：通過（0 errors）。
- `npm run lint`：通過（0 errors, 0 warnings）。
- `git status --short`：工作目錄完全乾淨。
- 冒煙測試基準：13 項測試通過（含 404 頁面測試）。

---

## 8. 允許修改範圍

本任務僅允許新增或修改下列檔案，不得變更任何其他檔案：

主要新增：
- `la-cozzi-website/tests/unit/auth.test.ts`
- `la-cozzi-website/docs/tasks/AG-010-AUTH-UNIT-TESTS.md`

允許同步更新之治理文件：
- `la-cozzi-website/docs/tasks/README.md`
- `la-cozzi-website/docs/PROJECT_ROADMAP.md`
- `la-cozzi-website/docs/CURRENT_STATE.md`
- `la-cozzi-website/CHANGELOG.md`

---

## 9. 禁止修改範圍

- 嚴禁修改 `src/app/**`、`src/components/**`。
- 嚴禁修改 `src/lib/auth.ts`、`src/lib/session.ts`、`src/lib/db.ts`、`src/lib/storage.ts`、`src/proxy.ts`。
- 嚴禁修改 `prisma/**`。
- 嚴禁修改 `next.config.ts`。
- 嚴禁修改 `package.json` 或 `package-lock.json`。
- 嚴禁修改 `.github/workflows/**`。
- 嚴禁修改任何環境變數檔案（`.env`、`.env.example` 等）。
- 嚴禁連線 PostgreSQL、Supabase、Vercel 或其他外部服務。
- 嚴禁使用正式帳號、密碼、Token、Cookie 或正式密鑰。
- 嚴禁降低密碼雜湊成本（維持 cost 12）或修改安全常數。
- 嚴禁因測試方便而改變正式程式行為。
- 嚴禁刪除、跳過或放寬現有測試。
- 嚴禁直接合併至 `main`。

---

## 10. 實作要求與測試案例

新增 `tests/unit/auth.test.ts`，使用 Node.js 內建 `node:test` 與 `node:assert/strict`，涵蓋 21 項測試：

### A. `normalizeUsername`（4 項測試）
- 移除帳號前後空白字元（含 tab 與換行）。
- 將英文字母轉換為小寫。
- 已正規化帳號維持原值。
- 前後空白與大小寫混合時同時正規化。

### B. `validatePassword`（5 項測試）
- 少於 8 個字元時回傳既有錯誤訊息 `密碼至少需要 8 個字元`。
- 正好 8 個字元時驗證通過回傳 `null`。
- 一般常見合法長度密碼（含 32、64 字元）驗證通過回傳 `null`。
- 正好 128 個字元時驗證通過回傳 `null`。
- 超過 128 個字元時回傳既有錯誤訊息 `密碼過長`。

### C. `hashPassword` 與 `verifyPassword`（4 項測試）
- 雜湊結果不得等於明文字串，且符合 bcrypt 格式開頭。
- 正確密碼可通過 `verifyPassword` 驗證回傳 `true`。
- 錯誤密碼無法通過 `verifyPassword` 驗證回傳 `false`。
- 同一明文多次雜湊產生不同鹽值，不得以固定字串比對，但皆能成功驗證。
- 不輸出假密碼或雜湊至測試日誌。

### D. `canEditPost`（6 項測試）
- `OWNER` 可編輯其他作者的文章。
- `OWNER` 可編輯沒有作者（`authorId: null`）的文章。
- `OWNER` 可編輯自己發布的文章。
- `EDITOR` 可編輯自己建立的文章。
- `EDITOR` 不可編輯其他作者建立的文章。
- `EDITOR` 不可編輯作者為 `null` 的文章。

### E. 安全常數契約（2 項測試）
- `MAX_FAILED_LOGINS` 維持目前值 `5`。
- `LOCK_MINUTES` 維持目前值 `15`。

---

## 11. 測試隔離保證

- **不啟動伺服器**：測試完全在 Node.js process 內執行，未啟動 Next.js 開發或正式伺服器。
- **不連線資料庫**：測試僅調用純記憶體計算函式，不觸發 Prisma Client 查詢或寫入。
- **無正式環境變數相依**：測試不讀取亦不要求正式 `DATABASE_URL`、`DIRECT_URL` 或 `AUTH_SECRET`。
- **無日誌洩漏**：不使用 `console.log` 印出任何測試假密碼或雜湊字串。
- **無狀態殘留**：不建立 Cookie、不寫入檔案系統、不修改全域環境變數。

---

## 12. 驗收條件

- [x] 所有既有 44 項單元測試仍全數通過。
- [x] 新增的 21 項 auth 單元測試全數通過（單元測試總數提升至 65 項）。
- [x] TypeScript 型別檢查通過（0 errors）。
- [x] ESLint 通過（0 errors, 0 warnings）。
- [x] Production build 成功（23/23 靜態與動態路徑建置成功）。
- [x] Playwright 唯讀冒煙測試全數通過（13/13 passed）。
- [x] `git diff --check` 通過無空白錯誤。
- [x] 嚴格沒有修改禁止範圍（`src/` 程式碼完全未修改）。
- [x] 沒有任何資料庫或外部服務操作。
- [x] 所有治理文件均使用繁體中文。

---

## 13. 必須執行的檢查

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

---

## 14. 資料庫、環境變數與正式環境影響

- **是否修改資料庫結構或 migration**：否。
- **是否新增或變更環境變數**：否。
- **是否影響正式環境資料**：否。
- **是否需要資料遷移或腳本**：否。
- **是否修改 Vercel 部署設定**：否。

---

## 15. 分支名稱、Commit 與 Pull Request 規則

1. **分支策略**：
   - 工作分支：`ag/auth-unit-tests`（切自最新 `origin/main`，Commit `163d251`）。
2. **Commit 規範**：
   - 採用 Conventional Commits 格式：`test(auth): add authentication unit coverage`。
3. **Pull Request 規範**：
   - Base：`main`，Head：`ag/auth-unit-tests`。
   - 標題：`test: add authentication and authorization unit coverage`。
   - 完整列出任務目的、測試前後數量、覆蓋案例、隔離保證、未修改聲明與回復方式。
   - **嚴禁 AG 自行合併 Pull Request 至 `main`**。

---

## 16. 回復方式

本任務不修改正式程式、資料庫或正式資料。

- **合併前發現問題**：直接關閉 Pull Request 或在原工作分支補上修正 Commit。
- **合併後發現問題**：透過 Git revert 建立還原 PR 合併至 `main`。不需要操作資料庫還原或 Vercel Rollback。

---

## 17. Codex 審查與正式上線規則

1. **獨立審查**：AG 完成回報後必須停止，交由 Codex 審查完整 Git diff 與測試日誌，不依賴口頭摘要。
2. **Preview 驗證**：Codex 必須確認 Vercel Preview 狀態與 GitHub Actions CI 綠燈。
3. **嚴禁預設合併**：Codex 驗收通過後，必須由專案負責人核准始可合併至 `main`。
4. **上線後確認**：合併後應依照 `docs/RELEASE_CHECKLIST.md` 執行線上確認，並維護 CHANGELOG 與發布紀錄完整性。
