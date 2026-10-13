import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

export async function GET(req: Request) {
  const url = new URL('/admin', req.url);
  const response = NextResponse.redirect(url);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
