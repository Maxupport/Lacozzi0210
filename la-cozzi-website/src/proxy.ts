import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE } from '@/lib/session';

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 如果存取 /admin（登入頁）：若已持有有效 session，直接導向 /admin/posts
  if (path === '/admin') {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySession(token);
    if (session) {
      return NextResponse.redirect(new URL('/admin/posts', req.nextUrl));
    }
    return NextResponse.next();
  }

  // 保護其他 /admin/* 路由：未通過驗證則重導向至 /admin 登入頁
  if (path.startsWith('/admin/')) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySession(token);
    if (!session) {
      const loginUrl = new URL('/admin', req.nextUrl);
      return NextResponse.redirect(loginUrl);
    }

    // 若非 OWNER 試圖進入 /admin/users，重導向至 /admin/posts
    if (path.startsWith('/admin/users') && session.role !== 'OWNER') {
      return NextResponse.redirect(new URL('/admin/posts', req.nextUrl));
    }
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ['/admin/:path*'],
};
