# 版本變更紀錄

本文件記錄 La Cozzi 官網的重要變更。格式參考 Keep a Changelog，版本規則採語意化版本。

## 尚未發布

### 新增

- 專案接管與優化 Roadmap。
- 現況、風險、協作與正式上線文件。
- 本機環境變數範本。
- GitHub Pull Request 與 Issue 範本。
- `typecheck` npm 指令。
- `test:smoke` npm 指令。
- GitHub Actions CI 工作流程（執行 typecheck、lint、build 與 Playwright Chromium smoke tests，並升級 actions 至 v5）。
- Playwright Chromium 核心唯讀 Smoke Tests（涵蓋 7 大核心路徑可用性、主要導覽、報價安全驗證、後台登入頁與 SEO 端點）。
- 災害回復與備份準備度手冊（`docs/RECOVERY.md`，涵蓋 Vercel 回滾步驟、網域鎖定暫停自動部署機制與解除步驟、Hobby 與 Pro/Enterprise 方案回滾資格、資料庫異動相容性決策、PostgreSQL 與 Storage 備份中繼資料盤點、事故處置順序與還原演練前置條件；準備度評估為「部分完成 / 待確認」，AG-003）。
- 新增通用 AG 任務範本（`docs/tasks/AG-TASK-TEMPLATE.md`，定義 17 項標準章節與授權規則）。
- 新增 AG 任務文件索引（`docs/tasks/README.md`）。
- 完成 AG-007：建立可重複使用的通用 AG 任務範本與任務文件索引。新版 `docs/tasks/AG-TASK-TEMPLATE.md` 已取代舊版 `docs/AG_TASK_TEMPLATE.md`，舊版重複範本已移除，通用範本的唯一正式位置為 `docs/tasks/AG-TASK-TEMPLATE.md`。
- 新增純邏輯單元測試基準（`test:unit` npm 指令，使用 Node.js 內建 `node:test` 與既有 `tsx` 執行 44 項純邏輯單元測試，保護 `utils.ts` 與 `session.ts`，AG-008）。
- 將單元測試納入 GitHub Actions CI 工作流程（於 Lint 後、Build 前執行，AG-008）。
- 新增 AG-008 任務規格文件（`docs/tasks/AG-008-UNIT-TEST-BASELINE.md`，AG-008）。

### 變更

- README 改為 La Cozzi 官網實際開發與維運說明。
- 管理員 seed 改為必須明確提供帳號、密碼與顯示名稱，不再使用內建預設值。
- 清理既有 ESLint 基準問題至 0 錯誤、0 警告，補齊精確 TypeScript 型別並移除未使用項目。
- 更新維運手冊 (`docs/OPERATIONS.md`)、部署手冊 (`docs/DEPLOYMENT.md`)、環境變數手冊 (`docs/ENVIRONMENT.md`)、現況基準 (`docs/CURRENT_STATE.md`)、風險登記冊 (`docs/RISK_REGISTER.md`) 與 Roadmap (`docs/PROJECT_ROADMAP.md`)，精確區分 Vercel Rollback 與 Promote 操作，明定線上版本以 Vercel Current/Rollback 為準（GitHub API 僅供歷程比對），並將「必要環境變數齊全」調整為部分完成／待確認直到核對 Vercel 線上配置。
- 固定 Next.js 專案根目錄：於 `next.config.ts` 明確配置 `turbopack.root` 為專案根目錄（不依賴執行時工作目錄），由 Next.js 16 自動同步 Output File Tracing 根目錄，消除多重 lockfile 結構下的 workspace root 警告，確保本機、CI 與 Vercel 的專案範圍判定一致，且未刪除或修改任何 lockfile、套件或前台功能（AG-005）。
- 修正 GitHub 儲存庫治理檔案位置：將預設 Next.js 根目錄 README 改為專案統一入口與指引，並將 Pull Request 與 Issue 範本移至儲存庫根目錄 `.github/` 有效位置，同步移除 `la-cozzi-website/.github/` 重複範本（AG-006）。
- 更新 Roadmap 與現況基準：明確標示純邏輯單元測試基準已建立（AG-008），並註記登入 API、資料庫存取層與媒體上傳等整合測試仍待後續任務處理。

### 安全

- seed 程式碼中的預設管理員帳密 fallback 已於基礎治理中移除；統一風險清單標示正式環境舊密碼是否需輪替仍待確認。
- 盤點 Preview 與 Production 環境隔離狀態，確認無法證明完全隔離，正式將「禁止 Preview 寫入測試」提升為強制安全規範。
