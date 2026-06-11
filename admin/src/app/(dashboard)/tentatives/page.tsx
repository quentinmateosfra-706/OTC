import { db } from '@/lib/firebase-admin';

const STATUS_LABELS: Record<string, string> = {
  valid: 'Validée',
  rejected: 'Rejetée',
  pending: 'En attente',
};

const STATUS_COLORS: Record<string, string> = {
  valid: 'bg-success/20 text-success',
  rejected: 'bg-danger/20 text-danger',
  pending: 'bg-accent/20 text-accent',
};

export default async function TentativesPage() {
  const snap = await db
    .collectionGroup('attempts')
    .orderBy('startedAt', 'desc')
    .limit(50)
    .get();

  const attempts = snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tentatives</h1>
      <div className="bg-surface rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-muted/20">
            <tr className="text-left text-muted">
              <th className="px-4 py-3">Utilisateur</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Durée</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Motif</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a: Record<string, unknown>) => {
              const status = (a.status as string) ?? 'pending';
              const startedAt = a.startedAt as { _seconds?: number } | null;
              const dateStr = startedAt?._seconds
                ? new Date(startedAt._seconds * 1000).toLocaleDateString('fr-FR')
                : '—';
              const duration = a.durationSeconds
                ? `${Math.floor((a.durationSeconds as number) / 3600)}h${String(Math.floor(((a.durationSeconds as number) % 3600) / 60)).padStart(2, '0')}`
                : '—';
              return (
                <tr key={a.id as string} className="border-b border-muted/10 hover:bg-background/50">
                  <td className="px-4 py-3 font-medium">{(a.displayName as string) ?? '—'}</td>
                  <td className="px-4 py-3 text-muted">{(a.raceId as string) ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[status] ?? 'text-muted'}`}>
                      {STATUS_LABELS[status] ?? status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{duration}</td>
                  <td className="px-4 py-3 text-muted">{a.score != null ? `${a.score}/100` : '—'}</td>
                  <td className="px-4 py-3 text-muted">{dateStr}</td>
                  <td className="px-4 py-3 text-muted text-xs max-w-xs truncate">{(a.rejectionReason as string) ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
