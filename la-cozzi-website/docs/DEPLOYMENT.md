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
