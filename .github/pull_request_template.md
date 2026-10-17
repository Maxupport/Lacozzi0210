## 目的

<!-- 為什麼需要這項修改？請簡述背景與欲達成的目標。 -->

## 修改範圍

<!-- 列出本次 PR 修改的檔案或功能模組。 -->
-

## 不修改範圍

<!-- 明確列出本 PR 刻意不改動的範圍，防止範疇蔓延。 -->
-

## 驗證結果

<!-- 請在 la-cozzi-website/ 目錄下執行下列檢查，並標記結果： -->
- [ ] `cd la-cozzi-website && npm run typecheck`
- [ ] `cd la-cozzi-website && npm run lint`
- [ ] `cd la-cozzi-website && npm run build`
- [ ] `cd la-cozzi-website && npm run test:smoke`
- [ ] GitHub Actions CI 檢查通過
- [ ] Vercel Preview 部署成功與人工驗證

## 正式環境與架構影響確認

- 資料庫異動（Schema / Migration / Data）：否
- 新增或修改環境變數：否
- 前台訪客行為或畫面異動：否
- 外部服務整合變更（Supabase / Vercel 等）：否

*若任一項為「是」，請於下方詳細說明影響、執行順序與向下相容措施。*

## 風險與回復計畫

<!-- 如果上線或合併後發生異常，具體的回復方式為何？（例如：Vercel Instant Rollback、Git Revert、資料庫回復方案） -->

## 畫面或變更前後比對

<!-- 涉及視覺或前台變更時，請提供 Preview 網址或截圖前後比對。若無視覺變更請填「無」。 -->
