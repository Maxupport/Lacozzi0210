# 維運手冊

## 服務依賴

| 服務 | 用途 | 擁有者／管理入口 | 備份或回復狀態 |
| --- | --- | --- | --- |
| GitHub | 程式碼、CI 流程與版本管理 | 專案負責人 (`Maxupport`)<br>`https://github.com/Maxupport/Lacozzi0210` | 已具備（完整 Git 歷程與 GitHub Deployments） |
| Vercel | Next.js 應用程式部署 (`sin1`) | 待確認<br>`https://vercel.com/maxupports-projects/lacozzi0210` | 已具備回滾機制（支援 Instant Rollback 或 Git Revert；注意 Instant Rollback 具方案限制且會鎖定網域暫停自動部署） |
| PostgreSQL | 主要內容與帳號資料 (Supabase 託管) | 待確認<br>`https://supabase.com/dashboard/project/<project-ref>/database/backups` | 未確認（方案未確認前視為無可依賴備份；且**資料庫備份不包含 Storage 實體檔案**） |
| Supabase Storage | 公開媒體檔案 (`media` bucket) | 待確認<br>`https://supabase.com/dashboard/project/<project-ref>/storage/buckets` | 尚未具備（無自動備份，僅歷史文章圖檔可由 Notion 重建；資料庫備份不含此處檔案） |
| 報價 webhook | 報價表單處理 (Google Apps Script) | 待確認<br>`https://script.google.com/` | 未確認（由外部 GAS 專案維護） |
| Notion | 歷史文章與夥伴資料來源 | 待確認 | 僅供歷史資料重建與搬遷 |

> 詳細回復操作、Vercel 回滾步驟、解除網域鎖定、資料庫異動處理、備份清單與驗證標準，請參閱專門手冊：[災害回復與備份準備度手冊 (RECOVERY.md)](./RECOVERY.md)（目前準備度狀態：**部分完成 / 待確認**）。

## 事故優先順序

1. 保護帳號、個人資料與正式資料。
2. 恢復首頁與報價等核心公開功能。
3. 恢復後台內容管理。
4. 保存錯誤證據與時間線。
5. 系統恢復後再進行原因分析與長期修正。

## 基本處理流程

1. 確認影響範圍與開始時間。
2. 暫停新的正式部署與 migration。
3. 檢查最近一次部署、環境變數與外部服務狀態。
4. 若最近部署與事故高度相關：
   - 無資料庫異動：使用 Vercel Instant Rollback（或 Git Revert）切回上一個已驗證版本；若使用 Instant Rollback，修復後需手動 Promote 解除鎖定。
   - 有資料庫異動：依 [RECOVERY.md](./RECOVERY.md) 評估向下相容性與回復順序，嚴禁臨時手寫刪除指令。
5. 執行核心 smoke tests：`npm run test:smoke` 與手動路徑核對。
6. 記錄原因、影響、處理方式與預防措施。

## 備份要求

- PostgreSQL：確認 Supabase 專案方案等級（未確認前視為無可依賴備份）、自動備份頻率、保存期限、還原入口與權限負責人。**注意：資料庫備份不包含 Storage 實體圖檔**。
- Supabase Storage：確認媒體檔案是否有獨立備份或冷儲存同步機制；後台直接上傳之媒體須建立備份管道。
- Vercel：確認不可變 Deployment 的保存範圍與團隊回復權限名單。
- GitHub：確認 Repository 管理權不依賴單一帳號，具備適當協作者備援。

**重要原則：尚未完成一次非正式隔離環境實際還原驗證以前，嚴禁將「平台有備份」視為已具備可回復能力。目前全站備份準備度列為「部分完成 / 待確認」。**

## 密鑰事件

若密碼、Token、Cookie、資料庫網址或 Service Role Key 疑似外洩：

1. 立即停止使用該密鑰。
2. 在原服務建立新密鑰並更新正式環境。
3. 驗證服務恢復後撤銷舊密鑰。
4. 檢查 Git 歷史、Build log 與存取紀錄。
5. 記錄受影響範圍與後續措施。

只從目前檔案刪除密鑰並不足以處理外洩事件。
