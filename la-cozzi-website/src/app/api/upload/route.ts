import { NextResponse } from 'next/server';
import { assertUser, AuthError } from '@/lib/auth';
import { uploadMedia, extensionFor } from '@/lib/storage';


const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
]);

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  try {
    await assertUser();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json({ ok: false, error: '未提供檔案' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { ok: false, error: `不支援的檔案格式 (${file.type})，請上傳 JPG、PNG、WebP、GIF 等圖片` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ ok: false, error: '檔案大小超過 10MB 限制' }, { status: 400 });
    }

    const ext = extensionFor(file.type, file.name);
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${sanitizedName}.${ext}`;
    const cleanFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'uploads';
    const path = `${cleanFolder}/${filename}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const publicUrl = await uploadMedia(path, buffer, file.type);

    return NextResponse.json({ ok: true, url: publicUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    }
    console.error('Upload failed:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : '上傳失敗，請確認 Supabase 設定' },
      { status: 500 }
    );
  }
}
