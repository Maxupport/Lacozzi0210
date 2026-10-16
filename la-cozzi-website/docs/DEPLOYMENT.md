# 部署手冊

> 目前部署於 Vercel。GitHub 與 Vercel 的實際管理設定仍待擁有者確認。

## 環境

- Local：開發者本機。
- Preview：Pull Request 或非正式分支的 Vercel 部署。
- Production：預期由 `main` 觸發的正式站部署，實際設定仍待確認。

## 發布流程

1. 從最新 `main` 建立短期分支。
2. 完成單一目的的修改。
3. 通過型別、Lint、測試與 production build。
4. 建立 Pull Request 與 Vercel Preview。
5. Codex 檢查完整 diff 與 Preview。
6. 涉及前台內容或重要行為時，由專案負責人確認。
7. 完成正式上線檢查表。
8. 合併至 `main`。
9. 觀察 Vercel Production 部署。
10. 執行正式站 smoke tests。
11. 更新 CHANGELOG 與版本紀錄。

## 回復方式

沒有資料庫異動時，優先使用 Vercel 回復至上一個已驗證的 Production Deployment。

有資料庫異動時：

1. 先判斷上一版應用程式是否仍與新 schema 相容。
2. 若相容，先回復應用程式。
3. 若不相容，依預先核准的 migration 回復方案處理。
4. 不得在事故中臨時設計資料刪除指令。

Vercel 實際回復權限、資料庫備份位置與還原步驟仍待確認，確認後補入本文件。

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
