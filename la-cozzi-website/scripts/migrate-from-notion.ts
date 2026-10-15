import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

// 載入本地 .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();
const isDryRun = process.argv.includes('--dry-run');

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const POSTS_DB_ID = process.env.NOTION_DATABASE_ID;
const PARTNERS_DB_ID = process.env.NOTION_PARTNERS_DATABASE_ID;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
  : null;

async function ensureBucket(bucketName = 'media') {
  if (!supabase || isDryRun) return;
  try {
    const { data } = await supabase.storage.getBucket(bucketName);
    if (!data) {
      await supabase.storage.createBucket(bucketName, { public: true });
    }
  } catch (e) {
    console.warn(`[Storage] Warning checking bucket:`, e);
  }
}

async function downloadAndUploadImage(
  url: string,
  storagePath: string,
  bucketName = 'media'
): Promise<string> {
  if (!url || isDryRun || !supabase) return url;
  if (!url.startsWith('http')) return url;

  // 如果已經是 Supabase 網址則不重複上傳
  if (SUPABASE_URL && url.includes(SUPABASE_URL)) return url;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[Download] Failed to download image ${url}: status ${res.status}`);
      return url;
    }
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await res.arrayBuffer());

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, buffer, {
        contentType,
        upsert: true,
        cacheControl: '31536000',
      });

    if (error) {
      console.warn(`[Storage] Upload error for ${storagePath}:`, error.message);
      return url;
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(storagePath);
    return data.publicUrl;
  } catch (err) {
    console.warn(`[Storage] Error re-hosting image ${url}:`, err);
    return url;
  }
}

interface NotionRichTextItem {
  plain_text?: string;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    code?: boolean;
  };
  href?: string | null;
}

interface NotionProperty {
  type?: string;
  title?: NotionRichTextItem[];
  rich_text?: NotionRichTextItem[];
  select?: { name?: string } | null;
  url?: string | null;
  multi_select?: Array<{ name?: string }>;
  files?: Array<{
    type?: 'external' | 'file' | string;
    external?: { url?: string };
    file?: { url?: string };
  }>;
}

interface NotionBlockContent {
  rich_text?: NotionRichTextItem[];
  type?: string;
  external?: { url?: string };
  file?: { url?: string };
  caption?: NotionRichTextItem[];
}

interface NotionBlock {
  type: string;
  [key: string]: unknown;
}

// 輔助函式：解析 Notion 屬性文字
const getPropText = (prop: NotionProperty | undefined): string => {
  if (!prop) return '';
  if (prop.type === 'title') return prop.title?.map((t: NotionRichTextItem) => t.plain_text || '').join('') || '';
  if (prop.type === 'rich_text') return prop.rich_text?.map((t: NotionRichTextItem) => t.plain_text || '').join('') || '';
  if (prop.type === 'select') return prop.select?.name || '';
  if (prop.type === 'url') return prop.url || '';
  return '';
};

const getPropTags = (prop: NotionProperty | undefined): string[] => {
  if (!prop || prop.type !== 'multi_select' || !prop.multi_select) return [];
  return prop.multi_select.map((s) => s.name || '').filter(Boolean);
};

const getPropCover = (prop: NotionProperty | undefined): string => {
  if (!prop || prop.type !== 'files' || !prop.files || prop.files.length === 0) return '';
  const file = prop.files[0];
  if (file.type === 'external') return file.external?.url || '';
  if (file.type === 'file') return file.file?.url || '';
  return '';
};

const parseRichText = (richTextArr: NotionRichTextItem[] | undefined) => {
  if (!richTextArr) return '';
  return richTextArr.map((rt) => {
    let text = rt.plain_text || '';
    if (rt.annotations) {
      if (rt.annotations.bold) text = `**${text}**`;
      if (rt.annotations.italic) text = `*${text}*`;
      if (rt.annotations.strikethrough) text = `~~${text}~~`;
      if (rt.annotations.code) text = `\`${text}\``;
    }
    if (rt.href) text = `[${text}](${rt.href})`;
    return text;
  }).join('');
};

async function fetchNotionBlocks(blockId: string): Promise<string> {
  let blocks: NotionBlock[] = [];
  let cursor: string | undefined = undefined;
  let hasMore = true;

  while (hasMore) {
    const url = new URL(`https://api.notion.com/v1/blocks/${blockId}/children`);
    url.searchParams.append('page_size', '100');
    if (cursor) url.searchParams.append('start_cursor', cursor);

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
      },
    });

    if (!res.ok) break;
    const data = await res.json();
    blocks = [...blocks, ...((data.results as NotionBlock[]) || [])];
    hasMore = data.has_more;
    cursor = data.next_cursor;
  }

  let markdown = '';
  for (const block of blocks) {
    const type = block.type;
    const content = (block[type] || {}) as NotionBlockContent;

    switch (type) {
      case 'paragraph':
        markdown += `${parseRichText(content.rich_text)}\n\n`;
        break;
      case 'heading_1':
        markdown += `# ${parseRichText(content.rich_text)}\n\n`;
        break;
      case 'heading_2':
        markdown += `## ${parseRichText(content.rich_text)}\n\n`;
        break;
      case 'heading_3':
        markdown += `### ${parseRichText(content.rich_text)}\n\n`;
        break;
      case 'bulleted_list_item':
        markdown += `- ${parseRichText(content.rich_text)}\n`;
        break;
      case 'numbered_list_item':
        markdown += `1. ${parseRichText(content.rich_text)}\n`;
        break;
      case 'quote':
        markdown += `> ${parseRichText(content.rich_text)}\n\n`;
        break;
      case 'divider':
        markdown += `---\n\n`;
        break;
      case 'image': {
        const imgUrl = content.type === 'external' ? content.external?.url || '' : content.file?.url || '';
        const caption = parseRichText(content.caption) || '圖片';
        markdown += `![${caption}](${imgUrl})\n\n`;
        break;
      }
      case 'video':
        if (content.type === 'external' && content.external?.url) {
          markdown += `\n${content.external.url}\n\n`;
        }
        break;
      default:
        break;
    }
  }

  return markdown.trim();
}

async function migratePosts(ownerId: string | null) {
  if (!POSTS_DB_ID || !NOTION_TOKEN) {
    console.log('[Posts] No NOTION_DATABASE_ID or NOTION_TOKEN found, skipping.');
    return [];
  }

  console.log(`[Posts] Querying Notion database ${POSTS_DB_ID}...`);
  const res = await fetch(`https://api.notion.com/v1/databases/${POSTS_DB_ID}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
    }),
  });

  if (!res.ok) {
    console.error('[Posts] Notion query error:', await res.text());
    return [];
  }

  const data = await res.json();
  const results = data.results || [];
  console.log(`[Posts] Found ${results.length} total posts in Notion.`);

  const migrated = [];

  for (const page of results) {
    const p = page.properties;
    const title = getPropText(p['標題'] || p.Title || p.Name);
    if (!title) continue;

    const rawSlug = getPropText(p['短網址'] || p.Slug || p.URL).replace(/[?#&/]/g, '').trim();
    const slug = rawSlug || `post-${page.id.slice(0, 8)}`;
    const statusVal = getPropText(p['發布狀態'] || p.Status).toLowerCase();
    const isPublished = statusVal === 'published' || statusVal === '已發布';
    const status = isPublished ? 'PUBLISHED' : 'DRAFT';
    const rawCover = getPropCover(p['封面圖'] || p.Cover || p.Thumbnail);
    const youtubeUrl = getPropText(p['YouTube'] || p['YouTube 連結'] || p['YouTubeUrl'] || p.Video);
    const tags = getPropTags(p['#標籤'] || p.Tags || p['標籤']);
    const createdAt = new Date(page.created_time);

    console.log(`[Posts] Processing: "${title}" (slug: ${slug}, status: ${status})`);

    // 重新上傳封面圖
    let coverUrl = rawCover;
    if (rawCover && supabase && !isDryRun) {
      coverUrl = await downloadAndUploadImage(rawCover, `covers/${slug}-cover.jpg`);
    }

    // 抓取內文 Markdown
    let content = await fetchNotionBlocks(page.id);

    // 重新上傳內文圖片
    if (supabase && !isDryRun && content) {
      const imgRegex = /!\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g;
      let match;
      let counter = 1;
      while ((match = imgRegex.exec(content)) !== null) {
        const originalUrl = match[2];
        const newUrl = await downloadAndUploadImage(
          originalUrl,
          `articles/${slug}/inline-${counter++}.jpg`
        );
        if (newUrl !== originalUrl) {
          content = content.replace(originalUrl, newUrl);
        }
      }
    }

    // 摘要（若無則取首段）
    let excerpt = getPropText(p['文字'] || p['內文'] || p['簡介'] || p.Text || p.Excerpt || p.Description);
    if (!excerpt && content) {
      const firstLine = content.split('\n').find((l) => l.trim() && !l.startsWith('#') && !l.startsWith('!'));
      if (firstLine) excerpt = firstLine.slice(0, 150);
    }

    if (!isDryRun) {
      await prisma.post.upsert({
        where: { notionId: page.id },
        update: {
          title,
          slug,
          excerpt: excerpt || null,
          content,
          cover: coverUrl || null,
          youtubeUrl: youtubeUrl || null,
          tags,
          status,
          publishedAt: isPublished ? createdAt : null,
          authorId: ownerId,
        },
        create: {
          notionId: page.id,
          title,
          slug,
          excerpt: excerpt || null,
          content,
          cover: coverUrl || null,
          youtubeUrl: youtubeUrl || null,
          tags,
          status,
          publishedAt: isPublished ? createdAt : null,
          createdAt,
          authorId: ownerId,
        },
      });
    }

    migrated.push({
      notionId: page.id,
      title,
      slug,
      status,
      tagsCount: tags.length,
      hasCover: !!coverUrl,
      contentLength: content.length,
    });
  }

  return migrated;
}

async function migratePartners() {
  if (!PARTNERS_DB_ID || !NOTION_TOKEN) {
    console.log('[Partners] No NOTION_PARTNERS_DATABASE_ID, skipping.');
    return [];
  }

  console.log(`[Partners] Querying Notion database ${PARTNERS_DB_ID}...`);
  const res = await fetch(`https://api.notion.com/v1/databases/${PARTNERS_DB_ID}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sorts: [{ property: '排序', direction: 'ascending' }],
    }),
  });

  if (!res.ok) {
    console.error('[Partners] Notion query error:', await res.text());
    return [];
  }

  const data = await res.json();
  const results = data.results || [];
  console.log(`[Partners] Found ${results.length} total partners in Notion.`);

  const migrated = [];
  let orderIndex = 0;

  for (const page of results) {
    const p = page.properties;
    const name = getPropText(p['Name'] || p['姓名'] || p['名稱']);
    if (!name) continue;

    const role = getPropText(p['Role'] || p['身分'] || p['職稱']);
    const descProp = p['簡介'] || p['Description'];
    let description: string[] = [];
    if (descProp && descProp.type === 'multi_select') {
      description = getPropTags(descProp);
    } else {
      description = getPropText(descProp).split('\n').map((s) => s.trim()).filter(Boolean);
    }

    const rawPhoto = getPropCover(p['Photo'] || p['照片']);
    let photoUrl = rawPhoto;
    if (rawPhoto && supabase && !isDryRun) {
      const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_');
      photoUrl = await downloadAndUploadImage(rawPhoto, `partners/${sanitizedName}.jpg`);
    }

    const content = await fetchNotionBlocks(page.id);
    const isPublished = getPropText(p['發布狀態'] || p.Status).toLowerCase() !== 'draft';

    console.log(`[Partners] Processing: "${name}" (${role})`);

    if (!isDryRun) {
      await prisma.partner.upsert({
        where: { notionId: page.id },
        update: {
          name,
          role,
          description,
          photo: photoUrl || null,
          content: content || null,
          order: orderIndex++,
          isPublished,
        },
        create: {
          notionId: page.id,
          name,
          role,
          description,
          photo: photoUrl || null,
          content: content || null,
          order: orderIndex++,
          isPublished,
        },
      });
    }

    migrated.push({
      notionId: page.id,
      name,
      role,
      hasPhoto: !!photoUrl,
      descCount: description.length,
      hasBio: !!content,
    });
  }

  return migrated;
}

async function main() {
  console.log(`=== La Cozzi Notion Migration Script ${isDryRun ? '(DRY-RUN 模擬模式)' : '(正式寫入模式)'} ===`);

  await ensureBucket('media');

  // 取得或確認第一個 OWNER 使用者
  let ownerId: string | null = null;
  if (!isDryRun) {
    const owner = await prisma.user.findFirst({
      where: { role: 'OWNER' },
      orderBy: { createdAt: 'asc' },
    });
    ownerId = owner?.id || null;
    console.log(`[Owner] Assigned posts author to: ${owner?.displayName || 'None'} (ID: ${ownerId})`);
  }

  const posts = await migratePosts(ownerId);
  const partners = await migratePartners();

  // 產生報告
  const report = `# La Cozzi Notion 搬移報告 (${isDryRun ? 'DRY-RUN 模擬' : '正式執行'})

- **執行時間**：${new Date().toISOString()}
- **模式**：${isDryRun ? '模擬模式（未寫入資料庫）' : '正式寫入模式'}
- **文章總數**：${posts.length} 篇
- **夥伴總數**：${partners.length} 位

## 搬移文章一覽
| 標題 | 網址代稱 (Slug) | 狀態 | 標籤數 | 封面圖 | 內文字數 |
| :--- | :--- | :---: | :---: | :---: | :---: |
${posts.map((p) => `| ${p.title} | \`${p.slug}\` | ${p.status} | ${p.tagsCount} | ${p.hasCover ? '✅' : '❌'} | ${p.contentLength} |`).join('\n')}

## 搬移夥伴一覽
| 夥伴姓名 | 稱號 | 照片 | 簡介要點數 | 詳細自介 |
| :--- | :--- | :---: | :---: | :---: |
${partners.map((pt) => `| ${pt.name} | ${pt.role} | ${pt.hasPhoto ? '✅' : '❌'} | ${pt.descCount} | ${pt.hasBio ? '✅' : '❌'} |`).join('\n')}
`;

  fs.writeFileSync(path.resolve(process.cwd(), 'migration-report.md'), report, 'utf-8');
  console.log(`\n✅ 搬移完成！已將報告輸出至 migration-report.md`);
}

main()
  .catch((e) => {
    console.error('Fatal error during migration:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
