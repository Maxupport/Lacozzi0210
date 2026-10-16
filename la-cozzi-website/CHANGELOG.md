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
- 災害回復與備份準備度手冊（`docs/RECOVERY.md`，涵蓋 Vercel 秒級回滾步驟、資料庫異動相容性決策、PostgreSQL 與 Storage 備份中繼資料盤點、事故處置順序與還原演練前置條件，AG-003）。

### 變更

- README 改為 La Cozzi 官網實際開發與維運說明。
- 管理員 seed 改為必須明確提供帳號、密碼與顯示名稱，不再使用內建預設值。
- 清理既有 ESLint 基準問題至 0 錯誤、0 警告，補齊精確 TypeScript 型別並移除未使用項目。
- 更新維運手冊 (`docs/OPERATIONS.md`)、部署手冊 (`docs/DEPLOYMENT.md`)、環境變數手冊 (`docs/ENVIRONMENT.md`)、現況基準 (`docs/CURRENT_STATE.md`)、風險登記冊 (`docs/RISK_REGISTER.md`) 與 Roadmap (`docs/PROJECT_ROADMAP.md`)，同步最新服務依賴、Vercel 部署規則與備份復原狀態。

### 安全

- 移除程式碼中的預設管理員帳密 fallback。
- 盤點 Preview 與 Production 環境隔離狀態，確認無法證明完全隔離，正式將「禁止 Preview 寫入測試」提升為強制安全規範。
