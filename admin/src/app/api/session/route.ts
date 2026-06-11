import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  const { idToken } = await req.json();
  try {
    const decoded = await auth.verifyIdToken(idToken);
    if (!decoded.admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const res = NextResponse.json({ ok: true });
    res.cookies.set('admin_token', idToken, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('admin_token');
  return res;
}
