import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/auth-guard';

export async function POST(req: NextRequest) {
  await requireAdmin();
  const body = await req.json();
  const ref = await db.collection('races').add({
    ...body,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return NextResponse.json({ id: ref.id });
}
