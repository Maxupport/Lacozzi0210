// Using native fetch to bypass Turbopack CJS Edge-runtime bundling bugs from the official Notion SDK
export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  status: string;

  tags: string[];
  cover: string;
  date: string;
  youtubeUrl?: string;
}

export interface Partner {
  id: string;
  name: string;
  role: string;
  description: string[];
  photo: string;
  content?: string;
}

export interface NotionRichTextItem {
  plain_text?: string;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    code?: boolean;
  };
  href?: string | null;
}

export interface NotionProperty {
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

export interface NotionPage {
  id: string;
  created_time: string;
  properties: Record<string, NotionProperty | undefined>;
}

export interface NotionBlockContent {
  rich_text?: NotionRichTextItem[];
  checked?: boolean;
  language?: string;
  type?: string;
  external?: { url?: string };
  file?: { url?: string };
  caption?: NotionRichTextItem[];
  icon?: { emoji?: string };
  url?: string;
}

export interface NotionBlock {
  id: string;
  type: string;
  paragraph?: NotionBlockContent;
  heading_1?: NotionBlockContent;
  heading_2?: NotionBlockContent;
  heading_3?: NotionBlockContent;
  bulleted_list_item?: NotionBlockContent;
  numbered_list_item?: NotionBlockContent;
  to_do?: NotionBlockContent;
  toggle?: NotionBlockContent;
  quote?: NotionBlockContent;
  code?: NotionBlockContent;
  divider?: NotionBlockContent;
  image?: NotionBlockContent;
  callout?: NotionBlockContent;
  bookmark?: NotionBlockContent;
  video?: NotionBlockContent;
  [key: string]: unknown;
}

const getPropertyText = (prop: NotionProperty | undefined): string => {
  if (!prop) return '';
  if (prop.type === 'title') return prop.title?.map((t: NotionRichTextItem) => t.plain_text || '').join('') || '';
  if (prop.type === 'rich_text') return prop.rich_text?.map((t: NotionRichTextItem) => t.plain_text || '').join('') || '';
  if (prop.type === 'select') return prop.select?.name || '';
  if (prop.type === 'url') return prop.url || '';
  return '';
};

const getPropertyTags = (prop: NotionProperty | undefined): string[] => {
  if (!prop || prop.type !== 'multi_select' || !prop.multi_select) return [];
  return prop.multi_select.map((s) => s.name || '').filter(Boolean);
};

const getPropertyCover = (prop: NotionProperty | undefined): string => {
  if (!prop || prop.type !== 'files' || !prop.files) return '';
  if (prop.files.length === 0) return '';
  const file = prop.files[0];
  if (file.type === 'external') return file.external?.url || '';
  if (file.type === 'file') return file.file?.url || '';
  return '';
};

export const getPublishedPosts = async (withExcerpts = false): Promise<Post[]> => {
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!databaseId) return [];

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      next: { revalidate: 60 },
      body: JSON.stringify({
        filter: {
          property: '發布狀態',
          select: {
            equals: 'published'
          }
        },
        sorts: [
          {
            timestamp: 'created_time',
            direction: 'descending'
          }
        ]
      })
    });
    
    if (!response.ok) {
      console.error('Notion API Error:', await response.text());
      return [];
    }

    const result = await response.json();
    const postsWithoutBody: Post[] = ((result.results as NotionPage[]) || []).map((page: NotionPage) => {
      const p = page.properties;
      return {
        id: page.id,
        title: getPropertyText(p['標題'] || p.Title || p.Name),
        excerpt: getPropertyText(p['文字'] || p['內文'] || p['簡介'] || p.Text || p.Excerpt || p.Description),
        slug: getPropertyText(p['短網址'] || p.Slug || p.URL).replace(/[?#&/]/g, '').trim(),
        status: getPropertyText(p['發布狀態'] || p.Status),
        tags: getPropertyTags(p['#標籤'] || p.Tags || p['標籤']),
        cover: getPropertyCover(p['封面圖'] || p.Cover || p.Thumbnail),
        youtubeUrl: getPropertyText(p['YouTube'] || p['YouTube 連結'] || p['YouTubeUrl'] || p.Video),
        date: page.created_time,
      };
    }).filter((post: Post) => Boolean(post.title));
    
    if (withExcerpts) {
      for (const post of postsWithoutBody) {
        if (!post.excerpt) {
          try {
            const blocksRes = await fetch(`https://api.notion.com/v1/blocks/${post.id}/children?page_size=10`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
                'Notion-Version': '2022-06-28',
              },
              next: { revalidate: 60 }
            }).then(r => r.json());
            
            if (blocksRes.results) {
              for (const b of (blocksRes.results as NotionBlock[])) {
                if (b.type === 'paragraph' && (b.paragraph?.rich_text?.length || 0) > 0) {
                  post.excerpt = b.paragraph?.rich_text?.map((rt: NotionRichTextItem) => rt.plain_text || '').join('') || '';
                  break; // found the first paragraph
                }
              }
            }
          } catch {
            // gracefully skip if error
          }
        }
      }
    }
    
    return postsWithoutBody;
  } catch (error) {
    console.error("Failed to fetch Notion posts", error);
    return [];
  }
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

const fetchNotionBlocksAsMarkdown = async (blockId: string): Promise<string> => {
  let blocks: NotionBlock[] = [];
  let cursor: string | undefined = undefined;
  let hasMore = true;

  while (hasMore) {
    const url = new URL(`https://api.notion.com/v1/blocks/${blockId}/children`);
    url.searchParams.append('page_size', '100');
    if (cursor) {
      url.searchParams.append('start_cursor', cursor);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
      },
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Failed to fetch Notion blocks', errText);
      if (blocks.length === 0) {
        return `> ⚠️ **無法讀取文章內容** \n> 請確認此文章是否存在於您的 Notion 資料庫中。`;
      }
      break;
    }

    const data = await response.json();
    blocks = [...blocks, ...((data.results as NotionBlock[]) || [])];
    
    hasMore = data.has_more;
    cursor = data.next_cursor;
  }
  
  if (blocks.length === 0) {
    return `*目前作者正在撰寫這篇文章的正文，敬請期待！*`;
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
      case 'to_do':
        markdown += `- [${content.checked ? 'x' : ' '}] ${parseRichText(content.rich_text)}\n`;
        break;
      case 'toggle':
        markdown += `<details><summary>${parseRichText(content.rich_text)}</summary>\n\n</details>\n\n`;
        break;
      case 'quote':
        markdown += `> ${parseRichText(content.rich_text)}\n\n`;
        break;
      case 'code':
        markdown += `\`\`\`${content.language || ''}\n${parseRichText(content.rich_text)}\n\`\`\`\n\n`;
        break;
      case 'divider':
        markdown += `---\n\n`;
        break;
      case 'image': {
        const imgUrl = content.type === 'external' ? content.external?.url || '' : content.file?.url || '';
        const caption = parseRichText(content.caption) || '';
        markdown += `![${caption}](${imgUrl})\n\n`;
        break;
      }
      case 'callout':
        const icon = content.icon?.emoji || '💡';
        markdown += `> ${icon} ${parseRichText(content.rich_text)}\n\n`;
        break;
      case 'bookmark':
        markdown += `[${content.url}](${content.url})\n\n`;
        break;
      case 'video':
        if (content.type === 'external' && content.external?.url) {
          const url = content.external.url;
          // Extract YouTube ID safely
          let youtubeId = '';
          if (url.includes('youtube.com/watch')) {
            youtubeId = new URL(url).searchParams.get('v') || '';
          } else if (url.includes('youtu.be/')) {
            youtubeId = url.split('youtu.be/')[1].split('?')[0];
          }
          if (youtubeId) {
            markdown += `<div className="aspect-video w-full rounded-organic-2 overflow-hidden border-2 border-stone-800 my-8 shadow-lg"><iframe src="https://www.youtube.com/embed/${youtubeId}?rel=0" className="w-full h-full" allowFullScreen></iframe></div>\n\n`;
          } else {
            markdown += `[影片連結](${url})\n\n`;
          }
        }
        break;
      default:
        markdown += `> ℹ️ [不支援的 Notion 區塊類型: ${type}]\n\n`;
        break;
    }
  }

  return markdown;
};

export const getSinglePost = async (slug: string) => {
  const posts = await getPublishedPosts(false);
  
  let targetSlug = slug;
  try {
    targetSlug = decodeURIComponent(slug);
  } catch {
    console.warn("Could not decode slug:", slug);
  }
  
  const normalizedTargetSlug = targetSlug.trim().toLowerCase().replace(/\s+/g, '');
  
  const post = posts.find((p) => {
    if (!p.slug) return false;
    const normalizedPostSlug = p.slug.trim().toLowerCase().replace(/\s+/g, '');
    
    // Direct matches
    if (normalizedPostSlug === normalizedTargetSlug) return true;
    if (encodeURIComponent(normalizedPostSlug) === normalizedTargetSlug) return true;
    
    // Length-safe substring matches (fallback for weird character encodings boundary issues)
    if (normalizedTargetSlug.length >= 2 && normalizedPostSlug.includes(normalizedTargetSlug)) return true;
    if (normalizedPostSlug.length >= 2 && normalizedTargetSlug.includes(normalizedPostSlug)) return true;
    
    return false;
  });
  
  if (!post) return null;

  const markdown = await fetchNotionBlocksAsMarkdown(post.id);
  
  const currentIndex = posts.findIndex(p => p.id === post.id);
  const nextPostData = posts[currentIndex + 1] || posts[0];
  const nextPost = nextPostData ? { slug: nextPostData.slug, title: nextPostData.title } : null;
  
  return {
    post,
    markdown,
    nextPost,
  };
};

export const getPartners = async (): Promise<Partner[]> => {
  const databaseId = process.env.NOTION_PARTNERS_DATABASE_ID;
  if (!databaseId) return [];

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      next: { revalidate: 10 },
      body: JSON.stringify({
        filter: {
          property: '發布狀態',
          select: {
            equals: 'published'
          }
        },
        sorts: [
          {
            property: '排序',
            direction: 'ascending'
          }
        ]
      })
    });

    if (!response.ok) {
      console.error('Notion API Error (Partners):', await response.text());
      return [];
    }

    const data = await response.json();

    const parsedResults: Partner[] = await Promise.all(((data.results as NotionPage[]) || []).map(async (page: NotionPage) => {
      const name = getPropertyText(page.properties['Name']);
      const role = getPropertyText(page.properties['Role']);
      
      let description: string[] = [];
      const descProp = page.properties['簡介'];
      if (descProp && descProp.type === 'multi_select') {
        description = getPropertyTags(descProp);
      } else {
        description = getPropertyText(descProp).split('\n').map((s: string) => s.trim()).filter(Boolean);
      }

      const photo = getPropertyCover(page.properties['Photo']);
      const content = await fetchNotionBlocksAsMarkdown(page.id);

      return {
        id: page.id,
        name,
        role,
        description,
        photo,
        content
      };
    }));
    return parsedResults.filter((p: Partner) => Boolean(p.name)); // 過濾掉空名字的項目
  } catch (error) {
    console.error('Error fetching partners:', error);
    return [];
  }
};
