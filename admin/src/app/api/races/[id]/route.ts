import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/auth-guard';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();
  const body = await req.json();
  await db.collection('races').doc(params.id).update({ ...body, updatedAt: new Date() });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();
  await db.collection('races').doc(params.id).update({ isActive: false, updatedAt: new Date() });
  return NextResponse.json({ ok: true });
}
