import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MAX_REVIEW_BODY_BYTES, validateReviewSubmission } from '@/lib/review-submission';

const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    if (!req.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
      return NextResponse.json({ ok: false, error: '請使用正確的送出格式' }, { status: 415 });
    }

    const declaredLength = Number(req.headers.get('content-length') || 0);
    if (declaredLength > MAX_REVIEW_BODY_BYTES) {
      return NextResponse.json({ ok: false, error: '送出內容超出限制' }, { status: 413 });
    }

    const rawBody = await req.text();
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_REVIEW_BODY_BYTES) {
      return NextResponse.json({ ok: false, error: '送出內容超出限制' }, { status: 413 });
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ ok: false, error: '送出內容格式不正確' }, { status: 400 });
    }

    const validation = validateReviewSubmission(body);
    if (!validation.ok) {
      return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
    }

    const { name, comment, tag, stars, email, website } = validation.value;

    // 蜜罐欄位：自動化機器人通常會填入，對外仍回傳成功以避免洩漏規則。
    if (website) {
      return NextResponse.json({
        ok: true,
        message: '感謝您的溫暖回饋！我們在確認後會將您的評價刊登在官網上。',
      });
    }

    const duplicate = await prisma.review.findFirst({
      where: {
        name,
        comment,
        source: 'WEBSITE',
        createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
      },
      select: { id: true },
    });

    if (duplicate) {
      return NextResponse.json({
        ok: true,
        message: '感謝您的溫暖回饋！我們已收到這則評價。',
        id: duplicate.id,
      });
    }

    const review = await prisma.review.create({
      data: {
        name,
        email,
        tag,
        stars,
        comment,
        status: 'PENDING',
        source: 'WEBSITE',
        date: new Date().toISOString().split('T')[0],
      },
    });

    return NextResponse.json({
      ok: true,
      message: '感謝您的溫暖回饋！我們在確認後會將您的評價刊登在官網上。',
      id: review.id,
    });
  } catch (error) {
    console.error('Submit review error:', error);
    return NextResponse.json(
      { ok: false, error: '送出評價時發生錯誤，請稍後再試' },
      { status: 500 }
    );
  }
}
