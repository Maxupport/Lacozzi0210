# 資料模型

> 本文件摘要目前的 `prisma/schema.prisma`。Schema 有任何變更時，必須同步更新本文件與 migration。

## User

後台使用者。

- `username`：唯一登入帳號，統一以小寫保存。
- `displayName`：文章作者等公開顯示名稱。
- `passwordHash`：bcrypt 密碼 hash，不得回傳前台。
- `role`：`OWNER` 或 `EDITOR`。
- `isActive`：帳號是否啟用。
- `failedLogins`、`lockedUntil`：登入失敗與鎖定狀態。
- `lastLoginAt`：最後登入時間。

刪除使用者時，其文章作者關係會設為空值，不會連帶刪除文章。

## Post

深度文章內容。

- `slug`：唯一公開網址識別。
- `title`、`excerpt`、`content`：文章主要內容，正文使用 Markdown。
- `cover`、`youtubeUrl`、`externalUrl`：選用媒體與外部連結。
- `tags`：文章標籤。
- `status`：`DRAFT` 或 `PUBLISHED`。
- `publishedAt`：發布時間。
- `authorId`：選用作者關係。
- `notionId`：歷史搬遷識別，讓搬遷腳本可以重複執行。

## Partner

樂團夥伴或成員資料。

- `name`、`role`：姓名與角色。
- `description`：條列式簡介。
- `photo`、`content`：照片與延伸內容。
- `order`：顯示順序。
- `isPublished`：是否顯示於公開網站。
- `notionId`：歷史搬遷識別。

## Review

客戶好評與網站投稿。

- `name`、`email`：投稿者資料；email 不應公開顯示。
- `tag`、`stars`、`comment`：分類、評分與內容。
- `status`：`PENDING`、`APPROVED` 或 `REJECTED`。
- `source`：資料來源，例如網站或人工匯入。
- `date`：顯示日期，目前使用字串保存。

## 變更規則

- 所有 schema 變更必須有 Prisma migration。
- 正式 migration 前必須備份並在非正式資料庫驗證。
- 採先新增、後搬遷、最後移除的向下相容流程。
- 不得在單次發布中直接移除仍可能被上一版本讀取的欄位。
- 涉及個人資料的欄位必須遵循最小存取與最小回傳原則。
