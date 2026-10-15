# 系統架構

> 最後更新：2026-10-15

## 架構概要

La Cozzi 官網是一個部署於 Vercel 的 Next.js 全端應用程式。公開網站與內部管理後台位於同一個程式庫，共用 PostgreSQL 資料庫與 Supabase Storage。

```text
瀏覽器
  ├─ 公開網站 ───────────────┐
  └─ 管理後台 ─ Session 驗證 ┤
                              ▼
                     Next.js / Vercel
                       ├─ Server Components
                       ├─ Server Actions
                       ├─ Route Handlers
                       └─ Proxy 路由保護
                              │
                  ┌───────────┴───────────┐
                  ▼                       ▼
          PostgreSQL / Prisma       Supabase Storage
          文章、夥伴、評論、帳號      公開媒體檔案
```

報價表單會從瀏覽器呼叫 `NEXT_PUBLIC_QUOTE_WEBHOOK_URL` 指定的外部服務。這個端點屬於公開設定，不得依賴網址本身作為授權機制。

## 路由邊界

- `src/app/(site)`：公開網站。
- `src/app/admin`：內部管理後台。
- `src/app/api`：登入、登出、評論與檔案上傳等 Route Handlers。
- `src/app/admin/actions`：後台資料異動 Server Actions。
- `src/proxy.ts`：管理後台路由的初步 Session 檢查。

Proxy 只負責提早阻擋明顯未登入請求。Server Action 與 Route Handler 仍必須自行執行身分與權限檢查，不能只依賴 Proxy。

## 資料存取

- `src/lib/db.ts` 建立 Prisma Client。
- `src/lib/content.ts` 提供公開內容需要的最小資料形狀。
- 後台頁面與 Server Actions 目前會直接使用 Prisma。
- 長期方向是維持清楚的伺服器端資料存取邊界，不讓敏感資料傳入 Client Component。

## 身分驗證

- 帳號與密碼儲存於 PostgreSQL。
- 密碼使用 bcrypt hash。
- 登入成功後建立 JWT Session Cookie。
- Session Cookie 設定為 `httpOnly`、`sameSite=lax`，正式環境使用 `secure`。
- OWNER 可管理帳號及完整內容；EDITOR 的文章權限受作者關係限制。

## 媒體檔案

- 後台透過 `/api/upload` 上傳至 Supabase Storage。
- Service Role Key 只能存在伺服器端環境變數。
- 目前 bucket 為公開讀取；後續需確認檔案驗證、SVG 策略與生命週期管理。

## 快取與更新

- 公開文章、夥伴與評論頁使用 Next.js revalidation。
- 後台異動成功後以 `revalidatePath` 更新相關公開頁面。
- 後台頁面採動態渲染，避免顯示過時的管理資料。

## 歷史整合

程式庫仍包含 Notion 讀取與資料搬遷程式。移除前必須先確認正式功能、排程與人工流程都不再依賴這些程式。
