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
- 正式資料庫備份、還原演練與保留週期尚未文件化。
- Preview 與 Production 的環境隔離方式尚未文件化。
- 正式上線後的 smoke test 與回復條件尚未制度化。

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
| 正式站主要頁面 | 可用 | 已進行唯讀頁面檢查 |

## 尚待確認事項

- Vercel 專案擁有者、Production Branch 與自動部署規則。
- 正式 PostgreSQL 的供應商、備份方式與還原權限。
- Supabase 專案擁有者、Storage 備份與 bucket 權限。
- GitHub Repository 管理權限與分支保護狀態。
- 正式管理員密碼是否曾使用 seed fallback。
- 報價 webhook 的擁有者、監控與失敗補送機制。
