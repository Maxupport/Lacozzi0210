# La Cozzi 拉釦子樂團官方網站

La Cozzi 拉釦子樂團的官方網站與內容管理後台。專案包含演出報價入口、品牌介紹、演出影音、樂團夥伴、深度文章、客戶好評，以及供內部成員使用的管理後台。

正式站：<https://lacozzi0210.vercel.app/>

## 維護原則

1. 穩定性第一，合理且容易維護的運作方式第二。
2. 不直接在 `main` 開發。
3. 所有修改先經過型別、Lint、測試、Build 與 Preview 驗證。
4. 資料庫修改必須可向下相容，並在執行前確認備份與回復方式。
5. 不為了追求理想架構而重寫已正常運作的功能。

完整規範請參閱 [專案文件索引](./docs/README.md)。

## 技術組成

- Next.js 16 App Router
- React 19 與 TypeScript
- Tailwind CSS 4
- PostgreSQL 與 Prisma
- Supabase Storage
- Vercel

## 本機需求

- Node.js 20 以上版本
- npm
- 可使用的 PostgreSQL 開發資料庫
- Supabase 專案，僅在測試圖片上傳時需要

## 開始使用

1. 安裝相依套件：

   ```bash
   npm ci
   ```

2. 建立本機環境檔：

   ```bash
   cp .env.example .env.local
   ```

3. 依照 [環境變數說明](./docs/ENVIRONMENT.md)填入開發環境設定。不得使用正式資料庫作為日常開發資料庫。

4. 產生 Prisma Client：

   ```bash
   npx prisma generate
   ```

5. 啟動開發伺服器：

   ```bash
   npm run dev
   ```

6. 開啟 <http://localhost:3000>。

## 常用指令

```bash
npm run dev          # 啟動本機開發環境
npm run typecheck    # TypeScript 型別檢查
npm run lint         # ESLint 檢查
npm run build        # Production build
npm run start        # 啟動 production build
npm run db:seed      # 建立第一位管理員，必須提供 INITIAL_OWNER_* 變數
```

Notion 搬遷指令屬於歷史資料搬遷用途，執行前必須閱讀腳本並使用 dry-run：

```bash
npm run migrate:notion:dry
```

## 目錄

```text
src/app/                 Next.js 路由、Route Handlers 與 Server Actions
src/components/          前台與後台 React 元件
src/lib/                 身分驗證、資料存取、Storage 與共用工具
prisma/                  Prisma schema 與 seed
scripts/                 一次性資料搬遷工具
public/                  公開靜態檔案
docs/                    架構、維運、發布與專案治理文件
```

## 發布

網站由 Vercel 部署。所有變更應先建立 Pull Request 與 Preview，完成 [正式上線檢查表](./docs/RELEASE_CHECKLIST.md)後才可合併至 `main`。

詳細流程請參閱 [開發、驗收與發布流程](./docs/DELIVERY_PROCESS.md)及 [部署手冊](./docs/DEPLOYMENT.md)。

## 安全提醒

- 不得提交 `.env`、密碼、Token、Cookie、資料庫連線字串或私密金鑰。
- `NEXT_PUBLIC_` 開頭的變數會進入瀏覽器端程式，不得放入秘密資料。
- 不得在正式資料庫執行未經驗證的 seed、migration 或搬遷腳本。
- 發現疑似密鑰外洩時，優先輪替密鑰，而不是只刪除 Git 中的文字。
