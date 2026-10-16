# 災害回復與備份準備度手冊 (Disaster Recovery & Backup Readiness Runbook)

> 文件版本：v1.1.0<br>
> 盤點日期：2026-10-16<br>
> 任務編號：AG-003<br>
> 狀態：草案，等待專案負責人確認與補充權限（準備度狀態：**部分完成 / 待確認**）。<br>
> 原則宣告：**嚴格禁止將「平台可能有備份」視為「已驗證可還原」。在專案負責人確認方案等級前，視為「沒有可依賴的正式備份」；未經隔離環境實際演練通過前，資料復原能力均列為「待確認」。**

---

## 1. 服務清單與回復狀態總表

| 服務名稱 | 用途說明 | 供應商 / 託管平台 | 擁有者 / 管理入口 | 備份現況 | 回復狀態評估 |
| --- | --- | --- | --- | --- | --- |
| **前端與 API 運算** | 官網前台展示、Server Actions、後台管理介面 | Vercel (`sin1` 新加坡區域) | 待確認<br>`https://vercel.com/maxupports-projects/lacozzi0210` | 保存歷史 Deployments（不可變構建產物） | **已具備回滾機制（部分完成 / 待確認）**（Hobby 方案支援回滾至前一個正式部署，Pro/Enterprise 可選其他歷史部署；需注意 Rollback 後會鎖定網域並暫停自動部署，需 Undo 或 Promote 解除） |
| **關聯式資料庫** | 帳號、文章、夥伴、評論等系統結構化資料 | Supabase (PostgreSQL 15+) | 待確認<br>`https://supabase.com/dashboard/project/<project-ref>/database/backups` | **方案未確認前視為無可依賴備份**；Free 方案不具備可依賴備份與 UI 還原點；Pro 方案提供每日備份。**注意：資料庫備份不包含 Storage 實體檔案** | **未確認**（方案等級待確認，缺少控制台查閱權限，且尚未執行非正式環境演練） |
| **物件儲存 (Storage)** | 文章封面、夥伴照片等靜態媒體檔案 | Supabase Storage (`media` bucket) | 待確認<br>`https://supabase.com/dashboard/project/<project-ref>/storage/buckets` | 無自動備份；無物件版本控制；歷史內容可由 Notion 重建；**資料庫備份不包含此處實體檔案** | **尚未具備**（後台直接上傳之媒體無異地備份，僅歷史資料可部分重建） |
| **報價 Webhook** | 官網詢價表單接收端點 | Google Apps Script (GAS) | 待確認<br>`https://script.google.com/` | GAS 內建版本歷史（由指令碼擁有者維護） | **未確認**（無法由本專案管理端點可用性與備份） |
| **原始碼與版本控制** | 程式碼、CI 流程、核心測試、文件 | GitHub (`Maxupport/Lacozzi0210`) | 專案負責人 (`Maxupport`)<br>`https://github.com/Maxupport/Lacozzi0210` | Git 分散式版本紀錄 + GitHub 託管 | **已具備能力**（完整 Commit 歷史與 GitHub Deployments 記錄；僅供歷史紀錄與交叉比對） |

---

## 2. Vercel 回復流程（無資料庫異動時）

當發布新版應用程式後發現前台樣式崩壞、路由錯誤、Client Component 例外或嚴重前端缺陷，但**未涉及資料庫 Schema 或資料變更**時，應立即執行 Vercel 回復。

### 專案基本資訊
- **Vercel 專案名稱**：`lacozzi0210`
- **團隊 / 組織名稱**：`maxupports-projects`
- **專案管理入口**：`https://vercel.com/maxupports-projects/lacozzi0210`
- **Production Branch**：`main`
- **正式網址**：`https://lacozzi0210.vercel.app`
- **自動部署規則**：推送到 `main` 或 PR 合併至 `main` 時，GitHub App (`vercel[bot]`) 自動觸發 Production Deployment。

### 最新成功 Production Deployment 與目前線上版本辨識方式
1. **唯一權威標準：Vercel 控制台 Current / Rollback 狀態**：
   - 進入專案「Deployments」頁面，篩選 Environment 為 `Production`。
   - 頂端標記有 `Current` 標籤且狀態為綠色勾選 (`Ready`) 的項目，或於頂部橫幅顯示為作用中回滾 (`Rollback`) 的部署，**為唯一能判定正式網域 (`lacozzi0210.vercel.app`) 當前實際指向的權威版本**。
2. **GitHub Deployments API 之定位與重要限制**：
   - 執行 `gh api repos/Maxupport/Lacozzi0210/deployments?environment=Production`。
   - **功能定位**：GitHub Deployments API **僅能作為歷史部署事件紀錄與 Commit SHA 之交叉比對之用**。
   - **限制警告**：GitHub API **無法感知** Vercel 控制台內部發生的 Instant Rollback 路由覆蓋！若線上已執行 Instant Rollback，GitHub API 仍會顯示原本 push 到 `main` 的部署為成功，**絕對不能以 GitHub Deployments API 判定目前正式網域運作中的版本**，必須一律以 Vercel 控制台狀態為準。

### 如何找到上一個已驗證版本
1. 在 Vercel 控制台 Deployments 列表中，尋找目前 Production Deployment 前一個狀態為 `Ready` 的項目（例如 Commit `9e99dae`，Deployment ID `7096927605`，專屬網址 `https://lacozzi0210-48cjx3m5s-maxupports-projects.vercel.app`）。
2. 可先點擊該 Deployment 專屬不可變網址（Immutable URL），確認頁面顯示與核心功能皆正常。

### 回復操作步驟

#### 方法 A：Vercel Instant Rollback（秒級生效）

> **方案支援範圍**：
> - **Hobby 方案**：支援 Instant Rollback，但**僅限回復至緊鄰的前一個正式部署 (Immediately preceding production deployment)**。
> - **Pro 與 Enterprise 方案**：支援選擇**其他符合資格的歷史正式部署**進行回滾。
> - 目前專案團隊方案待專案負責人確認。

1. 登入 Vercel Dashboard 並進入 `maxupports-projects/lacozzi0210`。
2. 點選上方頁籤「Deployments」。
3. 找到要回復的歷史 Production Deployment（Hobby 方案為緊鄰的前一個 Ready 部署，例如 Commit `9e99dae`；Pro 方案可選擇更早的符合資格部署）。
4. 點選該項目右側的「...」選單按鈕。
5. 點選「Instant Rollback」（注意：此為專屬應急回滾操作，與一般發布的 Promote to Production 不同）。
6. 在確認對話框中點選「Rollback」。Vercel 會在 2~5 秒內將正式網域 (`lacozzi0210.vercel.app`) 的路由指標直接切換至該不可變產物，無需重新執行 build。

##### 重要機制：網域鎖定與自動部署暫停 (Automatic Production Domain Assignment Paused)
- **回滾鎖定狀態**：一旦執行 Instant Rollback，Vercel 會進入「Rollback Active」狀態，**並自動停用後續 push/merge 到 `main` 分支時對正式網域的自動指派**！
- **設計原因**：避免未修復的後續提交或自動化流程覆蓋緊急回滾狀態。
- **影響**：此時即使有新的 PR 合併至 `main`，雖然會產生 Production build，但**不會自動上線到正式網域**。

##### 解除鎖定與恢復正常發布必要步驟 (Undo Rollback / Promote to Production)
當緊急狀況解除或已修復問題準備發布新版本時，必須執行下列任一操作以解除鎖定：
- **途徑 1（撤銷回滾 / Undo Rollback）**：若發現不需要回滾，或欲直接回到回滾前的原版本，點擊 Vercel Dashboard 頂端橫幅中的「Undo Rollback」，即可取消鎖定並恢復原狀態。
- **途徑 2（發布新版修復 / Promote to Production）**：
  1. 將修復程式碼透過 PR 合併至 `main`。
  2. 確認該次 Production Deployment 建置成功且驗證通過。
  3. 進入該次最新部署詳情頁，或在列表點選「...」功能選單。
  4. 點選「Promote to Production」（或在 Rollback 橫幅上確認指派新版本）。
  5. 點擊確認後，正式網域即重新綁定至最新部署，並**正式解除 Rollback 鎖定，恢復未來 Git 自動部署行為**。

#### 方法 B：Git Revert 流程（推薦需跨多版本回滾或需完整 Git 審查追蹤時）
1. 本機切換至最新 `main` 分支並更新：`git checkout main && git pull origin main`。
2. 建立回復分支：`git checkout -b revert/emergency-rollback`。
3. 產生還原 Commit：`git revert <故障 Commit SHA>`。
4. 本機驗證：`npm run typecheck && npm run lint && npm run build && npm run test:smoke`。
5. 推送分支並建立緊急 PR：`git push origin revert/emergency-rollback`。
6. 經檢視後快速合併入 `main`，Vercel CI/CD 自動建置並部署還原版本。

### 執行權限需求
- **Vercel**：`maxupports-projects` 團隊的 `Owner`、`Admin` 或具備正式環境部署權限之 `Member`。
- **GitHub**：`Maxupport/Lacozzi0210` 之 `Write` / `Admin` 權限（若使用 Git Revert）。

### 回復後驗證（Smoke Tests）
- 立即執行自動化唯讀測試：
  ```bash
  PLAYWRIGHT_TEST_BASE_URL=https://lacozzi0210.vercel.app npm run test:smoke
  ```
- 執行人工煙霧核對（詳見本手冊第 6 節）。

---

## 3. 資料庫異動回復流程（有 Schema / 資料變更時）

當發布包含 Prisma Schema、欄位遷移或資料庫異動，且造成線上故障時，**絕對禁止**盲目執行 Vercel 單純代碼回滾，因為可能導致舊版應用程式因無法讀取新 Schema 或缺欄位而全面崩潰。

### 停止條件 (Stop Conditions)
遇到下列狀況，必須**立即停止**部署並凍結變更：
1. **Schema 不向下相容**：舊程式碼無法在新 Schema 上正常執行（例如必要欄位改名或類型變更）。
2. **Migration 執行失敗或中途終止**：造成資料庫處於不一致狀態。
3. **資料損毀或遺失**：發現任何不可預期之既有資料遺失、截斷或空值化。
4. **缺少正式備份**：在未事先確認具有完整資料庫可還原點之前，禁止進行任何修正性 migration。

### 處理決策與順序

```text
[線上發生資料庫相關故障]
       │
       ▼
1. 立即停止任何進行中的部署與 migration
       │
       ▼
2. 評估相容性：舊版程式是否相容於現有資料庫？
      ├─►【相容】：執行 Vercel Instant Rollback，保留資料庫結構，恢復網站連線。
      │
      └─►【不相容】：
             │
             ▼
       3. 判斷是否具備預先核准的向下 Migration 腳本？
             ├─►【具備】：依審查過之腳本執行反向遷移，再執行應用程式回滾。
             │
             └─►【不具備】：
                   │
                   ▼
             4. 進入緊急維護狀態（或降級唯讀），聯絡專案負責人。
                評估是否需要透過 Supabase 還原點進行資料庫還原。
                嚴禁在未備份狀態下臨時手寫 DROP / ALTER 指令！
```

### 資料庫變更黃金法則 (Expand and Contract)
- **先擴充，後收縮**：所有資料庫變更必須拆成至少兩階段（階段一：新增 nullable/有預設值欄位並雙寫；階段二：應用程式穩定後，再移除舊欄位）。
- **絕不在同一次發布直接刪除或重命名既有欄位**。

---

## 4. PostgreSQL (Supabase) 備份中繼資料盤點

> **安全警語**：本專案嚴格落實安全隔離，本文件絕不記錄或輸出任何帳號、密碼、Token、主機連線字串或完整的 `DATABASE_URL`。

| 項目 | 目前盤點結果 | 說明與後續動作 |
| --- | --- | --- |
| **資料庫服務供應商** | **Supabase** (PostgreSQL 15+) | 依連線特性，應用程式透過 Port 6543 (Supavisor 連線池) 連線，直接連線使用 Port 5432。 |
| **自動備份功能啟用狀態** | **方案未確認前視為無可依賴備份** | 移除「Free 具備內部備份」之未確認假設。在專案負責人確認方案前，**一律視為目前沒有任何可依賴的正式備份**。 |
| **自動備份頻率** | **未確認（視為無）** | 若為 Free Plan，Supabase 官方不提供自助備份下載、無 UI 還原點且無備份 SLA 保證；若為 Pro Plan，預設提供每日自動備份。需專案負責人登入確認。 |
| **備份保存期限** | **未確認（視為無）** | Free Plan 無任何 UI 自助還原保存承諾；Pro Plan 預設保留 7 天；加購 PITR 則保留 7 至 30 天。 |
| **最近一次成功備份時間** | **未確認** | 本機環境無 Supabase Management API 權限，需專案負責人登入控制台查閱。 |
| **還原管理入口** | `https://supabase.com/dashboard/project/<project-ref>/database/backups` | 僅具備管理員權限之帳號可見。 |
| **執行還原所需權限** | **Supabase Project Owner / Administrator** | 一般開發者或唯讀 Token 無法觸發還原。 |
| **是否支援時間點還原 (PITR)** | **未確認（預設不支援）** | PITR 為 Supabase Pro 方案的加購擴充功能，尚未確認本專案是否付費啟用。 |
| **非正式環境還原演練方式** | **建議 Staging 專案演練** | 嚴禁在正式環境嘗試還原！應建立一個全新的測試專案，使用 `pg_dump` 匯出或控制台備份檔進行匯入驗證。 |

> ### ⚠️ 重要架構邊界：資料庫備份不包含 Storage 實體檔案
> **PostgreSQL 資料庫備份（無論是 `pg_dump` 或 Supabase 平台資料庫備份）僅包含資料表結構、資料列、以及 Storage 系統資料表紀錄（例如 `storage.objects` 中繼資料），完全不包含 Supabase Storage 儲存桶內的實體媒體圖檔！**
> 若發生 Storage 檔案遺失或損壞，單純執行資料庫還原**絕對無法復原實體媒體檔案**。兩者必須視為獨立儲存系統分別規劃備份與回復策略。

---

## 5. Supabase Storage (媒體儲存) 準備度盤點

| 項目 | 盤點結果 | 詳細說明 |
| --- | --- | --- |
| **使用中 Bucket 名稱** | `media` | 定義於 `src/lib/storage.ts` (`export const MEDIA_BUCKET = 'media'`)。 |
| **Bucket 存取權限** | **公開 (Public: true)** | 允許匿名讀取，檔案直接透過 Supabase 公開 CDN URL 提供服務，單檔上限 10MB。 |
| **版本控制 (Versioning)** | **無** | Supabase Storage 預設不支援檔案版本歷程，同名上傳時會直接覆寫 (`upsert: true`)。 |
| **自動備份機制** | **無** | 目前無跨區域或定期快照備份機制。**注意：資料庫備份不包含此處實體檔案**。 |
| **可重建來源分析** | **部分可重建** | 1. 歷史文章與夥伴照片：可由 Notion 資料庫重新執行 `scripts/migrate-from-notion.ts` 批次下載並上傳重建。<br>2. 後台手動新增媒體：無任何重建來源，一旦遺失需人工重新上傳。 |
| **媒體遺失回復流程** | **混合程序** | 1. 歷史內容：執行搬移指令碼重建。<br>2. 使用者上傳內容：無法自動回復，需向內容提供者索取原始圖檔手動補正。 |
| **管理與操作權限** | **Service Role Key / Storage Admin** | 需具備專案 `SUPABASE_SERVICE_ROLE_KEY` 或 Supabase Dashboard Storage 管理權限。 |
| **後續任務建議** | **建立 Storage 冷備份工作** | 建議開立獨立技術任務：規劃定時腳本將 `media` bucket 同步備份至獨立物件儲存（例如 AWS S3 或 Cloudflare R2）。本任務依規範不進行修改。 |

---

## 6. 環境隔離現況與風險盤點

### 各環境設定與隔離證明

| 環境 | 變數來源 | 資料庫連線目標 | Storage 目標 | 報價 Webhook 目標 | 隔離驗證結論 |
| --- | --- | --- | --- | --- | --- |
| **Local (本機開發)** | `.env.local` (Git 忽略) | 正式 Supabase DB (共用) | 正式 `media` Bucket (共用) | 正式 GAS Webhook (共用) | **未隔離**（本機寫入操作會直接影響線上正式資料） |
| **CI (GitHub Actions)** | `.github/workflows/ci.yml` 寫死 mock 連線 | 本機虛擬 `localhost:5432` | 未配置（測試中攔截） | 未配置（測試中攔截） | **完全隔離**（CI 無正式密鑰，絕不接觸正式環境） |
| **Preview (Vercel PR)** | Vercel Project Environment Variables | 預期繼承專案環境變數（未分離） | 預期繼承專案環境變數（未分離） | 預期繼承專案環境變數（未分離） | **無法證明隔離**（極可能直連正式資源） |
| **Production (正式站)** | Vercel Project Environment Variables | 正式 Supabase DB | 正式 `media` Bucket | 正式 GAS Webhook | **正式營運目標** |

### 核心安全結論：強制維持「禁止 Preview 寫入測試」
1. **證據支持**：Vercel 的環境變數設定若未針對 Environment (`Production` / `Preview` / `Development`) 單獨指定，Preview 部署將預設使用專案通用變數。程式庫內無環境分流邏輯。
2. **潛在危害**：在 Preview 站點進行後台新增文章、修改密碼或於首頁填寫送出報價表單，將會**直接污染正式資料庫、覆寫正式 Storage 圖檔，並向業務人員發送垃圾詢價信**。
3. **強制規範**：
   - **嚴禁在 Preview 站點執行任何實質寫入、更新或刪除操作**。
   - 自動化 Smoke Tests 必須維持唯讀性質（唯讀檢查或在請求發出前攔截）。
   - 若未來需在 Preview 進行端對端完整寫入測試，必須先完成獨立 Staging 專案之建立。

---

## 7. 緊急事故處理順序 (Incident Response Sequence)

在發生嚴重線上事故時，團隊應遵循以下 5 步驟依序處置：

```text
[步驟 1：評估與凍結]
   - 確認受影響層面（全站無法連線、僅後台故障、報價異常）。
   - 立即凍結 main 分支合併與任何正在進行中的部署。
   │
   ▼
[步驟 2：保護資料與密鑰]
   - 若涉及帳號遭駭或密鑰外洩，立即通知專案負責人更換密鑰。
   - 若涉及資料庫錯誤寫入，立即暫停應用程式服務，避免壞資料持續擴大。
   │
   ▼
[步驟 3：執行適當層級回復]
   - 無資料庫異動：執行 Vercel Instant Rollback 至上一穩定版本。
   - 有資料庫異動：依照第 3 節決策流程，先評估應用程式相容性與資料庫狀態。
   │
   ▼
[步驟 4：執行驗證清單]
   - 執行自動化 Smoke Tests 與人工驗證，確認主要頁面恢復正常。
   │
   ▼
[步驟 5：事後復盤與證據留存]
   - 保存 Vercel Runtime Logs、Prisma 錯誤與 GitHub Deployment 歷程。
   - 更新 RISK_REGISTER 與 CHANGELOG，分析根因並安排後續預防措施。
```

---

## 8. 回復後的驗證清單 (Post-Recovery Verification Checklist)

每次執行回復完成後，必須完整確認以下清單並記錄結果：

- [ ] **自動化 Smoke Tests 通過**：
  ```bash
  PLAYWRIGHT_TEST_BASE_URL=https://lacozzi0210.vercel.app npm run test:smoke
  ```
- [ ] **首頁與導覽正常**：`/` 成功載入，無 500/502 錯誤，頂部與頁尾導覽點擊跳轉正常。
- [ ] **公開核心頁面正常**：
  - [ ] 樂團簡介 (`/brand`) 圖文正常。
  - [ ] 影音專區 (`/videos`) 正常載入。
  - [ ] 夥伴列表 (`/partners`) 內容卡片正常渲染。
  - [ ] 深度文章 (`/blog`) 列表與內頁文章正常顯示。
  - [ ] 客戶好評 (`/reviews`) 評價內容與星級正常。
- [ ] **後台介面正常**：`/admin` 登入頁輸入框與按鈕正常呈現。
- [ ] **報價表單防護正常**：表單驗證機制正常運作，無腳本未定義錯誤。
- [ ] **靜態資源與 SEO 正常**：`/robots.txt` 與 `/sitemap.xml` 可正常存取。
- [ ] **錯誤監控無異常飆升**：確認無持續產生的 unhandled promise rejection 或資料庫連線失敗紀錄。

---

## 9. 已確認與尚未確認事項清單

### 準備度評估總結：**部分完成 / 待確認**
- **已建立完整手冊**：Vercel 回滾流程、資料庫相容性決策樹、事故處理順序與環境隔離規範皆已齊備。
- **能力待確認**：在專案負責人確認 Supabase 方案與實際備份時間點前，正式資料庫視為無可依賴備份；且備份不含 Storage 實體圖檔；尚未在非正式環境完成還原演練。

### 已確認事項 (Confirmed)
1. **Vercel 管理與自動部署機制**：確認專案名稱 (`lacozzi0210`)、所屬團隊 (`maxupports-projects`)、Production Branch (`main`) 與 GitHub App 自動化觸發規則。
2. **最新與歷史部署辨識管道**：**確認正式網域當前指向之版本一律以 Vercel 控制台 Current / Rollback 狀態為唯一權威依據**；GitHub Deployments API 僅能作為歷史部署歷程與 Commit SHA 交叉比對，無法感知線上回滾狀態。
3. **無資料庫異動時的回復路徑與限制**：確認 Vercel Instant Rollback 在 Hobby 方案支援回滾至緊鄰的前一個正式部署，Pro/Enterprise 方案可選其他歷史正式部署。明確區分 Rollback（回滾至前一版本並進入鎖定狀態）與 Promote to Production（發布新版本或解除鎖定），並文件化 Instant Rollback 暫停自動部署之機制與 Undo / Promote 解除步驟。
4. **關聯資料庫供應商**：確認底層資料庫為託管於 Supabase 之 PostgreSQL，且透過 Port 6543 連線池與 Port 5432 直接連線運作。
5. **Storage 儲存桶與特性**：確認儲存桶名稱為 `media`，為公開讀取設定，且目前無自動版本控制或備份機制；資料庫備份不含 Storage 實體檔案。
6. **環境隔離現況**：確認 CI 環境完全隔離；確認本機與 Preview 目前無法證明與正式環境隔離，明確強化「禁止 Preview 寫入測試」規則。
7. **seed 程式碼 fallback 移除**：程式碼中之預設管理員帳密 fallback 已於基礎治理中徹底移除。

### 尚未確認及需要專案負責人處理的事項 (Pending / Unconfirmed)
1. **Vercel 各環境環境變數實際配置**：本機與 CI 範本已盤點，但 Vercel 控制台中 Production、Preview 與 Development 實際配置的變數名稱與套用範圍，仍待專案負責人登入控制台核對；在此之前「必要環境變數齊全」列為**部分完成 / 待確認**。
2. **Supabase 專案方案等級**：需專案負責人確認目前 Supabase 專案為 Free 還是 Pro 方案（未確認前直接視為無可依賴備份；Free 方案無 UI 還原點與下載功能）。
3. **PostgreSQL 自動備份與保留週期**：需登入 Supabase 控制台確認實際每日備份時間、保留天數，以及是否啟用了 PITR (Point-in-Time Recovery)。
4. **最近一次成功備份時間點**：需自 Supabase Dashboard 讀取確切備份時間並記錄於維運日誌。
5. **正式管理員舊密碼輪替狀態**：程式碼 fallback 雖已移除，但正式環境既有管理員帳號是否曾使用過預設密碼且需要輪替，仍待專案負責人確認與執行。
6. **資料庫與 Storage 還原權限名單**：需確認團隊中誰具備 Supabase Owner / Admin 權限可在事故時執行資料庫與檔案還原。
7. **Google Apps Script Webhook 擁有者**：需確認報價表單接收端點的 GAS 專案維護人員與失敗補償機制。
8. **非正式環境還原演練**：尚未在隔離環境中完成實際備份還原演練。

---

## 10. 下一次非正式環境還原演練的前置條件

為了達到真實的「已驗證可還原」狀態，未來進行非正式環境還原演練前，必須滿足以下所有前置條件：

1. **環境完全隔離**：
   - 必須使用獨立的 Supabase Staging/Dev 專案或本地 Docker PostgreSQL 容器。
   - 絕不允許在包含正式資料的專案中執行任何還原測試。
2. **取得專案負責人書面/明確核准**：
   - 演練計畫（包含時間、範圍、目標、還原步驟與驗收指標）必須事先經專案負責人簽核。
3. **備份中繼資料完整取得**：
   - 已確認來源備份檔案之校驗碼 (hash)、產生時間與檔案大小。
4. **回復後驗證腳本準備就緒**：
   - 演練環境需具備獨立的測試網址或本地伺服器，並能全自動執行 `npm run test:smoke` 與資料完整性檢查（比對 table row count、user 表與 post 表筆數）。
5. **專屬任務單一追蹤**：
   - 實際演練必須開立獨立的技術任務與分支，演練過程詳實記錄於日誌並由審查者簽署。
