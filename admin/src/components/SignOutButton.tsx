'use client';
import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const router = useRouter();
  async function handleSignOut() {
    await fetch('/api/session', { method: 'DELETE' });
    router.push('/login');
  }
  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-muted hover:text-text-primary px-3 py-2 rounded-lg hover:bg-background transition-colors text-left"
    >
      Déconnexion
    </button>
  );
}
