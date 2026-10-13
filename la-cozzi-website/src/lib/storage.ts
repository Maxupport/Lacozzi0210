import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// 只在伺服器端使用（service role key 擁有最高權限，不可外流到瀏覽器）

export const MEDIA_BUCKET = 'media';

let client: SupabaseClient | null = null;
let bucketReady = false;

function getClient() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 未設定');
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

async function ensureBucket() {
  if (bucketReady) return;
  const supabase = getClient();
  const { data } = await supabase.storage.getBucket(MEDIA_BUCKET);
  if (!data) {
    const { error } = await supabase.storage.createBucket(MEDIA_BUCKET, {
      public: true,
      fileSizeLimit: '10MB',
    });
    if (error && !/already exists/i.test(error.message)) throw error;
  }
  bucketReady = true;
}

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
};

export function extensionFor(contentType: string, fallbackName?: string) {
  if (EXT_BY_TYPE[contentType]) return EXT_BY_TYPE[contentType];
  const m = fallbackName?.match(/\.([a-z0-9]{2,5})$/i);
  return m ? m[1].toLowerCase() : 'bin';
}

/** 上傳檔案並回傳公開網址。path 相同時會覆寫（讓搬移腳本可重複執行） */
export async function uploadMedia(path: string, body: ArrayBuffer | Buffer, contentType: string) {
  await ensureBucket();
  const supabase = getClient();
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, body, { contentType, upsert: true, cacheControl: '31536000' });
  if (error) throw error;
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}
