import { NextResponse } from 'next/server';
import { assertUser, AuthError } from '@/lib/auth';
import { uploadMedia, extensionFor } from '@/lib/storage';
import {
  ALLOWED_UPLOAD_FOLDERS,
  ALLOWED_UPLOAD_TYPES,
  hasValidImageSignature,
  MAX_UPLOAD_BYTES,
} from '@/lib/upload-validation';

export async function POST(req: Request) {
  try {
    await assertUser();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json({ ok: false, error: '未提供檔案' }, { status: 400 });
    }

    if (!ALLOWED_UPLOAD_TYPES.has(file.type)) {
      return NextResponse.json(
        { ok: false, error: `不支援的檔案格式 (${file.type})，請上傳 JPG、PNG、WebP、GIF 或 AVIF 圖片` },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ ok: false, error: '檔案內容不可為空白' }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ ok: false, error: '檔案大小超過 10MB 限制' }, { status: 400 });
    }

    if (!ALLOWED_UPLOAD_FOLDERS.has(folder)) {
      return NextResponse.json({ ok: false, error: '不支援的上傳分類' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasValidImageSignature(file.type, buffer)) {
      return NextResponse.json(
        { ok: false, error: '檔案內容與圖片格式不符，請重新選擇圖片' },
        { status: 400 }
      );
    }

    const ext = extensionFor(file.type, file.name);
    const sanitizedName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_') || 'image';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${sanitizedName}.${ext}`;
    const path = `${folder}/${filename}`;

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
