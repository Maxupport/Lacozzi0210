# 目前狀態基準

> 盤點日期：2026-10-15  
> 狀態：草案，等待專案負責人確認。

## 產品現況

La Cozzi 官網目前已上線，主要功能足以支援日常使用。這次接管不以重做網站為目標，而是先保存現有成果，再補上專案治理、測試與發布護欄。

正式站：<https://lacozzi0210.vercel.app/>

已確認可開啟的主要頁面：

- 首頁與報價表單
- 樂團簡介
- 演出影音
- 夥伴列表
- 深度文章
- 客戶好評
- 後台登入

## 技術組成

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- PostgreSQL 與 Prisma
- Supabase Storage
- Vercel 部署，主要區域為新加坡
- 自建後台、JWT Session、OWNER／EDITOR 權限
- 部分 Notion 搬遷與舊整合程式仍保留於程式庫

## 已有優點

- 前台與後台功能已具備可用基礎。
- 公開內容與後台路由已有基本分區。
- Server Action 與部分 Route Handler 會再次檢查身分，不完全依賴路由攔截。
- 資料庫無法讀取時，部分公開內容會採降級處理，避免整站直接中斷。
- `main` 與 `origin/main` 在盤點當下同步，工作目錄乾淨。
- TypeScript 型別檢查通過。

## 目前缺口

### 專案治理

- README 仍為建立 Next.js 專案時的預設內容。
- 缺少架構、環境、部署、備份、回復與事故處理文件。
- 缺少 Pull Request 與 Issue 範本。
- 尚未建立一致的版本號、Release 與 CHANGELOG 流程。
- 尚未確認 `main` 分支保護與必要檢查。

### 品質保證

- 已建立 Playwright Chromium 核心唯讀 smoke tests（`npm run test:smoke`）。
- 已建立 GitHub Actions 持續整合流程 (CI)，涵蓋 typecheck、lint、build 與 smoke tests。
- ESLint 已完成清理（0 錯誤、0 警告，AG-001）。
- production build 已驗證可正常建置通過。
- Next.js 偵測到上層目錄還有另一個 lockfile，造成 workspace root 警告。

### 資料與發布

- 已有 Prisma schema，但尚未看到可追蹤的 migration 歷史。
- 正式環境備份與回復準備度已完成盤點與文件化（AG-003 完成，詳見 `docs/RECOVERY.md`）。
- Vercel 具備秒級 Instant Rollback 與 Git Revert 能力。
- Preview 與 Production 的環境隔離狀態已完成盤點，確認無法證明隔離，並已確立「禁止 Preview 寫入測試」安全規則。
- 正式上線後的 smoke test 與回復停止條件已制度化。

### 安全與營運

- seed 程式存在預設管理員帳號與密碼的 fallback，必須優先移除；若該組密碼曾用於正式環境，必須輪替。
- 公開評論 API 尚未看到 rate limit 或防垃圾訊息措施。
- 圖片上傳目前主要依賴 MIME type，仍需評估檔案內容驗證與 SVG 風險。
- 尚未看到集中式錯誤監控、稽核紀錄或服務可用性監測。
- 正式環境密鑰輪替與權限最小化原則尚未文件化。

### 搜尋與使用體驗

- 部分列表頁沒有明確的 H1。
- 尚未看到 canonical 設定。
- Open Graph 圖片與社群分享呈現仍可補強。
- 影音頁目前仍是內容建置中狀態。

## 基準驗證結果

| 檢查項目 | 結果 | 說明 |
| --- | --- | --- |
| Git 狀態 | 通過 | 盤點時 `main` 與遠端同步 |
| TypeScript | 通過 | `npx tsc --noEmit` 無錯誤 |
| ESLint | 通過 | 0 錯誤、0 警告（AG-001 完成） |
| Production build | 通過 | 本機與 CI 均編譯成功 |
| 自動化測試 | 通過 | Playwright Chromium 核心唯讀 smoke tests（AG-002 完成） |
| 備份與回復準備度 | 通過 | 完成唯讀盤點並建立專門手冊 `docs/RECOVERY.md`（AG-003 完成） |
| 正式站主要頁面 | 可用 | 已進行唯讀頁面檢查 |

## 尚待確認事項

- [x] Vercel 專案名稱 (`lacozzi0210`)、團隊 (`maxupports-projects`)、Production Branch (`main`) 與自動部署規則（已確認）。
- [x] 正式資料庫供應商（確認為 Supabase PostgreSQL，包含 Port 6543 連線池與 5432 直接連線）。
- [x] Supabase Storage bucket 名稱 (`media`) 與存取權限 (`public: true`)（已確認）。
- [x] Preview 與 Production 隔離狀態（確認無法證明隔離，嚴格維持「禁止 Preview 寫入測試」）。
- [ ] Supabase 專案方案等級（Free 方案僅內部快照無 UI 還原；Pro 方案具每日自動備份）。
- [ ] Supabase 備份保留天數與 PITR (時間點還原) 是否啟用。
- [ ] Supabase 最近一次成功備份時間點（需專案負責人至控制台查閱）。
- [ ] Supabase 與 Vercel 的專案擁有者與災難還原權限名單。
- [ ] GitHub Repository 管理權限與分支保護狀態。
- [ ] 正式管理員密碼是否曾使用 seed fallback。
- [ ] 報價 webhook 的擁有者、監控與失敗補送機制。
