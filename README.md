# La Cozzi 拉釦子樂團官方網站

La Cozzi 拉釦子樂團官方網站與內容管理後台的 Git 儲存庫。本專案包含樂團演出報價入口、品牌介紹、影音作品、合作夥伴、深度專欄、客戶好評，以及供內部管理使用的後台系統。

正式網站：<https://lacozzi0210.vercel.app/>

## 儲存庫結構與應用程式目錄

本儲存庫的核心應用程式與主要程式碼位於 [`la-cozzi-website/`](./la-cozzi-website/) 目錄。

> [!IMPORTANT]
> 本機相依套件安裝、型別檢查、測試、建置與伺服器啟動指令，**均必須先切換至 `la-cozzi-website/` 目錄後執行**。請勿直接在儲存庫根目錄執行 Next.js 或 npm 應用程式指令。

```bash
cd la-cozzi-website
npm ci
npm run dev
```

完整本機開發環境建置、環境變數配置與指令清單，請參閱 [la-cozzi-website/README.md](./la-cozzi-website/README.md)。

## 專案治理與發布規範

- **分支策略**：`main` 分支為正式部署分支，與 Vercel Production Deployment 連動。嚴禁直接修改或推送至 `main`。
- **提交流程**：所有修改必須建立短期工作分支，經由 Pull Request、GitHub Actions CI 檢查與 Vercel Preview 驗收後合併。
- **文件導覽**：
  - [專案文件索引](./la-cozzi-website/docs/README.md)
  - [開發、驗收與發布流程](./la-cozzi-website/docs/DELIVERY_PROCESS.md)
  - [部署手冊](./la-cozzi-website/docs/DEPLOYMENT.md)
  - [維運手冊](./la-cozzi-website/docs/OPERATIONS.md)
  - [目前狀態基準](./la-cozzi-website/docs/CURRENT_STATE.md)
  - [災害回復與備份手冊](./la-cozzi-website/docs/RECOVERY.md)
  - [正式上線檢查表](./la-cozzi-website/docs/RELEASE_CHECKLIST.md)

## 安全守則

- 嚴禁提交任何 `.env` 檔案、密碼、Token、Cookie、資料庫連線字串或私密金鑰至儲存庫。
- 若發現疑似密鑰外洩，應立即輪替密鑰與撤銷權限，而非僅從 Git 歷程中刪除文字。
