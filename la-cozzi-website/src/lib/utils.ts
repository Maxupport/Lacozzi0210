// 共用小工具（前後端皆可用）

/** 依標題產生網址代稱：保留英數與中文，其餘轉成連字號 */
export function slugify(input: string) {
  return input
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/[?#&/\\%'"<>]/g, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function isValidSlug(slug: string) {
  return slug.length > 0 && slug.length <= 100 && !/[?#&/\\%\s'"<>]/.test(slug);
}

export function getYouTubeId(url: string | null | undefined): string {
  if (!url) return '';
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] ?? '';
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname === '/watch') return u.searchParams.get('v') ?? '';
      const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/);
      if (m) return m[1];
    }
  } catch {
    // 不是合法網址
  }
  return '';
}

export function getYouTubePlaylistId(urlOrId: string | null | undefined): string {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();
  if (!trimmed.includes('http')) {
    return trimmed;
  }
  try {
    const u = new URL(trimmed);
    return u.searchParams.get('list') ?? '';
  } catch {
    return '';
  }
}

export function formatDate(iso: string | Date | null | undefined) {
  if (!iso) return '';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Taipei' });
}
