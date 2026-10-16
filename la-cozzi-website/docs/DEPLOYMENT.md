# 部署手冊

> 目前部署於 Vercel（專案名稱：`lacozzi0210`，團隊：`maxupports-projects`，區域：`sin1` 新加坡）。

## 環境

- **Local**：開發者本機，由 `.env.local` 讀取設定。
- **CI**：GitHub Actions（`.github/workflows/ci.yml`），使用隔離 mock 變數執行 typecheck、lint、build 與 smoke tests。
- **Preview**：Pull Request 或非正式分支的 Vercel 部署。
  - **重要隔離警語**：目前 Preview 環境無法證明與正式環境完全隔離（預期共用 Supabase PostgreSQL、`media` Storage bucket 與 GAS 報價 webhook）。因此**嚴禁在 Preview 站點執行任何實質寫入、資料變更或發送詢價測試**。
- **Production**：綁定 `main` 分支觸發的正式站部署，網址為 `https://lacozzi0210.vercel.app`。

## 發布流程

1. 從最新 `main` 建立短期分支。
2. 完成單一目的的修改。
3. 通過型別、Lint、測試與 production build。
4. 建立 Pull Request 與 Vercel Preview。
5. Codex 檢查完整 diff 與 Preview（嚴格僅進行唯讀核對）。
6. 涉及前台內容或重要行為時，由專案負責人確認。
7. 完成正式上線檢查表。
8. 合併至 `main`。
9. 觀察 Vercel Production 部署（由 `vercel[bot]` 自動觸發）。
10. 執行正式站 smoke tests：
    ```bash
    PLAYWRIGHT_TEST_BASE_URL=https://lacozzi0210.vercel.app npm run test:smoke
    ```
11. 更新 CHANGELOG 與版本紀錄。

## 回復方式

詳細操作手冊與停止條件請參閱專門文件：[災害回復與備份準備度手冊 (RECOVERY.md)](./RECOVERY.md)。

### 無資料庫異動時（Vercel 回復）
1. 進入 Vercel 控制台 `https://vercel.com/maxupports-projects/lacozzi0210/deployments`。
2. 找到上一個已驗證正常的 Production Deployment（例如 Commit `9e99dae`）。
3. 點選「...」功能選單，選擇「Instant Rollback」（或「Promote to Production」）並確認。
4. 正式流量將在數秒內切換回該歷史部署。
5. 亦可於本機執行 `git revert <故障SHA>`，經過 CI 與 PR 快速合併回 `main` 重新部署。

### 有資料庫異動時（停止條件與順序）
1. **停止條件**：若新舊 Schema 不相容、migration 中斷或出現未預期的資料損毀，立即停止新的部署。
2. 先評估舊版程式碼是否仍相容於現有 Schema。
3. 若相容，可優先回復應用程式恢復前端瀏覽。
4. 若不相容，必須依預先核准的向下 migration 腳本處理，或進入唯讀維護狀態評估 Supabase 資料庫還原。
5. **嚴禁在事故中臨時手寫資料刪除或結構破壞指令**。

## Smoke tests

### 本機自動化 Smoke Tests 指令

> **重要前提**：Playwright 設定之本機伺服器使用 `npm run start` 針對正式建置產物執行。因此在執行 smoke test 之前，**必須先完成 production build**（或串聯執行）：

```bash
# 完整建置並執行 Smoke Tests（建議）
npm run build && npm run test:smoke

# 若先前已完成 build 且程式碼未變動，可直接執行
npm run test:smoke
```

測試會啟動正式建置伺服器並透過 Playwright Chromium 執行核心唯讀檢查：

- **公開頁面可用性**：`/`, `/brand`, `/videos`, `/partners`, `/blog`, `/reviews`, `/admin`（確保 HTTP 200、標題正確且無錯誤）。
- **主要導覽**：首頁各項核心導覽連結與實際點擊切換。
- **報價表單安全驗證**：Email 必填與格式驗證，全程攔截網路請求以確保絕無對外發出 POST。
- **後台登入頁**：確認欄位與登入按鈕存在，不填入帳密亦不進行提交。
- **SEO 基本端點**：`/robots.txt` 與 `/sitemap.xml` 內容驗證。

### 手動 Smoke Tests（上線後核對）

- `/` 首頁與報價區塊。
- `/brand` 樂團簡介。
- `/videos` 演出影音。
- `/partners` 夥伴列表。
- `/blog` 與至少一篇文章。
- `/reviews` 客戶好評。
- `/admin` 後台登入頁。
- 若修改身分驗證，測試登入與登出。
- 若修改 Storage，測試圖片顯示與上傳。

## 禁止事項

- 不使用正式資料庫進行 Preview 自動化寫入測試。
- 不在未備份時執行正式 migration。
- 不把正式密鑰寫入 Pull Request、Issue、Build log 或對話。
- 不因為 Preview 正常就跳過正式站 smoke tests。
