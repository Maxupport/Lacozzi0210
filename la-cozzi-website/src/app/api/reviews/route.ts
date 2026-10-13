import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || '').trim();
    const comment = String(body.comment || '').trim();
    const tag = String(body.tag || '婚禮晚宴').trim();
    const stars = Math.min(5, Math.max(1, Number(body.stars) || 5));
    const email = body.email ? String(body.email).trim() : null;

    if (!name) {
      return NextResponse.json({ ok: false, error: '請填寫您的稱呼' }, { status: 400 });
    }
    if (!comment) {
      return NextResponse.json({ ok: false, error: '請填寫您的回饋心得' }, { status: 400 });
    }
    if (name.length > 50) {
      return NextResponse.json({ ok: false, error: '稱呼長度過長' }, { status: 400 });
    }
    if (comment.length > 2000) {
      return NextResponse.json({ ok: false, error: '評論長度超出限制' }, { status: 400 });
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
