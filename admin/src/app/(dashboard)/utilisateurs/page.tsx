import { db } from '@/lib/firebase-admin';

export default async function UtilisateursPage() {
  const snap = await db.collection('users').orderBy('createdAt', 'desc').limit(25).get();
  const users = snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Utilisateurs</h1>
      <div className="bg-surface rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-muted/20">
            <tr className="text-left text-muted">
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Sexe</th>
              <th className="px-4 py-3">Année</th>
              <th className="px-4 py-3">Strava</th>
              <th className="px-4 py-3">Inscription</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: Record<string, unknown>) => {
              const createdAt = u.createdAt as { _seconds?: number } | null;
              const dateStr = createdAt?._seconds
                ? new Date(createdAt._seconds * 1000).toLocaleDateString('fr-FR')
                : '—';
              return (
                <tr key={u.id as string} className="border-b border-muted/10 hover:bg-background/50">
                  <td className="px-4 py-3 font-medium">{u.displayName as string}</td>
                  <td className="px-4 py-3 text-muted">{u.gender as string}</td>
                  <td className="px-4 py-3 text-muted">{u.birthYear as number}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${u.stravaConnected ? 'bg-success/20 text-success' : 'bg-muted/20 text-muted'}`}>
                      {u.stravaConnected ? 'Connecté' : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{dateStr}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
