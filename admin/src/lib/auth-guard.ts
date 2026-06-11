import { cookies } from 'next/headers';
import { auth } from './firebase-admin';
import { redirect } from 'next/navigation';

export async function requireAdmin() {
  const token = cookies().get('admin_token')?.value;
  if (!token) redirect('/login');
  try {
    const decoded = await auth.verifyIdToken(token);
    if (!decoded.admin) redirect('/login');
    return decoded;
  } catch {
    redirect('/login');
  }
}
