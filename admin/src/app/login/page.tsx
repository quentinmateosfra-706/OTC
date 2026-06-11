'use client';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { clientAuth } from '@/lib/firebase-client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const cred = await signInWithEmailAndPassword(clientAuth, email, password);
      const token = await cred.user.getIdToken();
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Accès refusé');
      }
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-surface p-8 rounded-xl w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-accent">OTC Admin</h1>
        {error && <p className="text-danger text-sm">{error}</p>}
        <div className="space-y-1">
          <label className="text-sm text-muted">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full bg-background border border-muted/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-muted">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full bg-background border border-muted/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-background font-semibold rounded-lg py-2 text-sm disabled:opacity-50"
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
