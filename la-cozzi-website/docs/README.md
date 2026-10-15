# La Cozzi 官網專案文件

> 狀態：草案，等待專案負責人確認。

這個目錄收錄 La Cozzi 官網的治理、維護與發布規範。現階段原則是保護已正常運作的網站，以小步、可驗證、可回復的方式逐步改善。

## 核心原則

1. 穩定性第一。
2. 合理、容易維護的運作方式第二。
3. 任何改善都不得以正式站中斷作為代價。
4. 不為了追求理想架構而重寫已穩定運作的功能。
5. 所有修改必須能說明風險、驗證方式與回復方式。

## 文件索引

- [目前狀態基準](./CURRENT_STATE.md)
- [專案接管與優化 Roadmap](./PROJECT_ROADMAP.md)
- [系統架構](./ARCHITECTURE.md)
- [環境變數](./ENVIRONMENT.md)
- [資料模型](./DATA_MODEL.md)
- [開發、驗收與發布流程](./DELIVERY_PROCESS.md)
- [部署手冊](./DEPLOYMENT.md)
- [維運手冊](./OPERATIONS.md)
- [專案風險清單](./RISK_REGISTER.md)
- [AG 執行任務範本](./AG_TASK_TEMPLATE.md)
- [AG-001：清理 ESLint 基準並建立 CI](./tasks/AG-001-ESLINT-CI.md)
- [AG-002：核心唯讀 Smoke Tests 與 CI Actions 更新](./tasks/AG-002-SMOKE-TESTS.md)
- [正式上線檢查表](./RELEASE_CHECKLIST.md)

## 文件效力

在專案負責人確認本規劃以前，這些文件僅作為規劃草案，不代表已授權修改正式環境。確認後，Codex 會依 Roadmap 拆分工作，交由 AG 執行，再由 Codex 驗收。
