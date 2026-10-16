# 環境變數

> 不得將任何真實密鑰提交至 Git。範例值請放在 `.env.example`，本機值請放在被 Git 忽略的 `.env.local`。

## 必要變數

| 變數 | 可見範圍 | 用途 |
| --- | --- | --- |
| `DATABASE_URL` | 伺服器 | Prisma 應用程式資料庫連線，通常使用 connection pool |
| `DIRECT_URL` | 伺服器 | Prisma 直接資料庫連線，供 schema 與 migration 使用 |
| `AUTH_SECRET` | 伺服器 | JWT Session 簽章，至少 32 個字元 |
| `SUPABASE_URL` | 伺服器 | Supabase 專案網址 |
| `SUPABASE_SERVICE_ROLE_KEY` | 伺服器 | Storage 管理權限，屬於高敏感密鑰 |
| `NEXT_PUBLIC_QUOTE_WEBHOOK_URL` | 瀏覽器 | 報價表單送出端點，會被打包進瀏覽器程式 |

## 建議或選用變數

| 變數 | 可見範圍 | 用途 |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 瀏覽器 | Metadata、sitemap 與 robots 使用的網站基準網址 |
| `NEXT_PUBLIC_YOUTUBE_PLAYLIST_ID` | 瀏覽器 | 演出影音頁的 YouTube 播放清單 |
| `INITIAL_OWNER_USERNAME` | seed 指令 | 建立第一位管理員的登入帳號 |
| `INITIAL_OWNER_PASSWORD` | seed 指令 | 建立第一位管理員的密碼，至少 12 個字元 |
| `INITIAL_OWNER_DISPLAY_NAME` | seed 指令 | 第一位管理員的顯示名稱 |

## 歷史搬遷變數

以下變數只供 Notion 搬遷工具使用，一般網站執行不需要：

- `NOTION_TOKEN`
- `NOTION_DATABASE_ID`
- `NOTION_PARTNERS_DATABASE_ID`

## 環境隔離盤點現況

依據 AG-003 唯讀盤點結果，各環境之配置與隔離狀態如下：

| 環境 | 變數注入來源 | 資料庫連線目標 | Storage 目標 | 報價 Webhook 目標 | 隔離驗證結論 |
| --- | --- | --- | --- | --- | --- |
| **Local (本機開發)** | `.env.local` (Git 忽略) | 正式 Supabase DB (共用) | 正式 `media` Bucket (共用) | 正式 GAS Webhook (共用) | **未隔離**（本機寫入操作會直接異動線上資料） |
| **CI (GitHub Actions)** | `.github/workflows/ci.yml` 寫死 mock 變數 | 虛擬 `localhost:5432` | 未配置（測試中攔截） | 未配置（測試中攔截） | **完全隔離**（無正式密鑰，絕不接觸正式環境） |
| **Preview (Vercel PR)** | Vercel Project 變數 | 預期繼承專案環境變數（未分離） | 預期繼承專案環境變數（未分離） | 預期繼承專案環境變數（未分離） | **無法證明隔離**（預期直接連上正式環境） |
| **Production (正式站)** | Vercel Project 變數 | 正式 Supabase DB | 正式 `media` Bucket | 正式 GAS Webhook | **正式營運目標** |

### 核心安全規範：強制維持「禁止 Preview 寫入測試」
- **證據支持**：Vercel 專案環境變數若未設定分流，Preview 部署預設將繼承專案中所有共用變數。目前程式庫內未配置任何環境切換邏輯，前端 `LandingPage.tsx` 直接發送至 `NEXT_PUBLIC_QUOTE_WEBHOOK_URL`，`src/lib/storage.ts` 固定寫入 `media` bucket。
- **嚴格禁令**：**在未建立獨立 Staging/Dev 專案並證明完全隔離以前，嚴禁在 Preview 站點進行任何實質寫入、資料變更、使用者登入測試或表單送出測試！** 所有 Preview 驗收必須嚴格維持唯讀。

## 輪替原則

- `AUTH_SECRET` 輪替會使既有 Session 失效，必須安排並通知後台使用者。
- `SUPABASE_SERVICE_ROLE_KEY` 輪替後要立即驗證圖片上傳。
- 資料庫密碼輪替後要同時更新應用程式與 migration 連線設定。
- 疑似密鑰外洩時，先輪替，再進行 Git 歷史與影響範圍調查。
