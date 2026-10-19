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

- 儲存庫根目錄與網站目錄 README 均已完成，提供清晰的專案入口與開發指引（AG-006）。
- 缺少架構、環境、部署、備份、回復與事故處理文件。
- Pull Request 與 Issue 範本已移至儲存庫根目錄 .github/ 有效位置（AG-006）。
- 尚未建立一致的版本號、Release 與 CHANGELOG 流程。
- 尚未確認 `main` 分支保護與必要檢查。

### 品質保證

- 已建立全站錯誤頁面與 404 降級處理（AG-009）：包含一般路由錯誤降級頁面（`src/app/error.tsx`，使用 Next.js 16.2.1 `unstable_retry()`）、Root Layout 錯誤最後防線（`src/app/global-error.tsx`，具備自足行內樣式與獨立 html/body 結構）、404 頁面（`src/app/not-found.tsx`，提供首頁與影音頁導覽連結），以及 404 自動化冒煙測試（`tests/smoke/error-pages.spec.ts`）。外部集中式錯誤監控或告警服務尚未導入，待後續任務評估。
- 已建立純邏輯單元測試基準（`npm run test:unit`，AG-008）：涵蓋 `src/lib/utils.ts`（網址代稱、YouTube 網址/播放清單解析、台北時區日期格式化）與 `src/lib/session.ts`（JWT 簽署與還原驗證、Token 竄改/金鑰/角色防護、Cookie 契約）。
- 已補強登入、密碼與權限純邏輯單元測試（`tests/unit/auth.test.ts`，AG-010）：涵蓋 `src/lib/auth.ts`（帳號正規化、密碼長度與邊界驗證、bcrypt 密碼雜湊與驗證、文章編輯權限矩陣、安全常數鎖定）。
- 尚未涵蓋的整合測試：包含管理員登入 API（`/api/auth/login`）、登出 API、資料庫存取層、媒體上傳（`/api/upload`）與其他 Server Actions / Route Handlers 整合測試仍待後續任務建立。
- 已建立 Playwright Chromium 核心唯讀 smoke tests（`npm run test:smoke`，共 13 項測試）。
- 已建立 GitHub Actions 持續整合流程 (CI)，涵蓋 typecheck、lint、unit tests、build 與 smoke tests。
- ESLint 已完成清理（0 錯誤、0 警告，AG-001）。
- production build 已驗證可正常建置通過。
- 已於 next.config.ts 明確設定 turbopack.root 為專案根目錄，由 Next.js 16 自動對齊追蹤根目錄，消除 workspace root 與多重 lockfile 警告（AG-005 完成）。

### 資料與發布

- 已有 Prisma schema，但尚未看到可追蹤的 migration 歷史。
- 正式環境備份與回復準備度已完成盤點與文件化（AG-003 部分完成 / 待確認，詳見 `docs/RECOVERY.md`）。
- Vercel 具備 Instant Rollback（Hobby 方案支援前一個正式部署，Pro/Enterprise 可選其他歷史部署）與 Git Revert 能力；需注意 Instant Rollback 會鎖定網域並暫停自動部署，需透過 Undo Rollback 或修復後 Promote 解除鎖定。
- 正式網域當前指向版本一律以 Vercel 控制台 Current / Rollback 為準，GitHub Deployments API 僅供歷程交叉比對。
- Supabase 方案未確認前視為無可依賴備份，且資料庫備份不包含 Storage 實體檔案。
- Preview 與 Production 的環境隔離狀態已完成盤點，確認無法證明隔離，並已確立「禁止 Preview 寫入測試」安全規則。
- 正式上線後的 smoke test 與回復停止條件已制度化。

### 安全與營運

- seed 程式碼中的預設管理員帳密 fallback 已於基礎治理中移除；但正式環境既有管理員密碼是否曾使用過 fallback 且需要輪替，仍待確認。
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
| 自動化測試 | 通過 | Playwright 唯讀 smoke tests（13 項測試全數通過，涵蓋核心公開頁面與 404 頁面，AG-002/AG-009 完成）與純邏輯單元測試（65 項測試全數通過，涵蓋 `utils.ts`、`session.ts` 與 `auth.ts`，AG-008/AG-010 完成；Route Handler、資料層等整合測試待後續補齊） |
| 備份與回復準備度 | 部分完成 / 待確認 | 已完成流程盤點並建立專門手冊 `docs/RECOVERY.md`；但 Supabase 方案未確認前視為無可依賴備份，且尚未進行非正式環境還原演練 |
| 環境變數與隔離準備度 | 部分完成 / 待確認 | 本機範本已齊全，確立「禁止 Preview 寫入」；直到實際核對 Vercel 各環境變數名稱與套用範圍前維持待確認 |
| 正式站主要頁面 | 可用 | 已進行唯讀頁面檢查 |

## 尚待確認事項

- [x] Vercel 專案名稱 (`lacozzi0210`)、團隊 (`maxupports-projects`)、Production Branch (`main`) 與自動部署規則（已確認）。
- [x] 正式資料庫供應商（確認為 Supabase PostgreSQL，包含 Port 6543 連線池與 5432 直接連線）。
- [x] Supabase Storage bucket 名稱 (`media`) 與存取權限 (`public: true`)（已確認；資料庫備份不含實體圖檔）。
- [x] Preview 與 Production 隔離狀態（確認無法證明隔離，嚴格維持「禁止 Preview 寫入測試」）。
- [x] seed 程式碼預設帳密 fallback（已於基礎治理移除）。
- [ ] 確認正式管理員密碼是否曾使用 seed fallback 並安排輪替。
- [ ] Vercel 各環境環境變數實際配置與套用範圍核對（待專案負責人登入控制台查驗）。
- [ ] Supabase 專案方案等級（未確認前視為無可依賴備份；若為 Free 方案無可依賴備份與 UI 還原點；若為 Pro 方案具每日自動備份）。
- [ ] Supabase 備份保留天數與 PITR (時間點還原) 是否啟用。
- [ ] Supabase 最近一次成功備份時間點（需專案負責人至控制台查閱）。
- [ ] Supabase 與 Vercel 的專案擁有者與災難還原權限名單。
- [ ] GitHub Repository 管理權限與分支保護狀態。
- [ ] 報價 webhook 的擁有者、監控與失敗補送機制。
- [ ] 非正式環境備份還原演練（尚未在隔離環境中實際驗證）。
