# 版本變更紀錄

本文件記錄 La Cozzi 官網的重要變更。格式參考 Keep a Changelog，版本規則採語意化版本。

## 尚未發布

### 新增

- 專案接管與優化 Roadmap。
- 現況、風險、協作與正式上線文件。
- 本機環境變數範本。
- GitHub Pull Request 與 Issue 範本。
- `typecheck` npm 指令。

### 變更

- README 改為 La Cozzi 官網實際開發與維運說明。
- 管理員 seed 改為必須明確提供帳號、密碼與顯示名稱，不再使用內建預設值。
- 清理既有 ESLint 基準問題至 0 錯誤、0 警告，補齊精確 TypeScript 型別並移除未使用項目。

### 安全

- 移除程式碼中的預設管理員帳密 fallback。
