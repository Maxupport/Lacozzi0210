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

## 環境隔離

- Local：只連接開發資料庫與開發用 Storage。
- Preview：應使用獨立測試資料，禁止寫入正式資料庫。
- Production：只有正式部署可使用正式密鑰。

目前 Preview 與 Production 是否已完整隔離仍待確認。在確認以前，任何會寫入資料的 Preview 測試都必須暫停。

## 輪替原則

- `AUTH_SECRET` 輪替會使既有 Session 失效，必須安排並通知後台使用者。
- `SUPABASE_SERVICE_ROLE_KEY` 輪替後要立即驗證圖片上傳。
- 資料庫密碼輪替後要同時更新應用程式與 migration 連線設定。
- 疑似密鑰外洩時，先輪替，再進行 Git 歷史與影響範圍調查。
