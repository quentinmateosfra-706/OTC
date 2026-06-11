import { db } from '@/lib/firebase-admin';

export default async function RevenusPage() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const snap = await db
    .collectionGroup('purchases')
    .where('purchasedAt', '>=', thirtyDaysAgo)
    .orderBy('purchasedAt', 'desc')
    .limit(100)
    .get();

  const purchases = snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));

  const total = purchases.reduce((s, p) => s + ((p.amount as number) ?? 0), 0);
  const units = purchases.filter(p => p.type === 'unit').length;
  const subs = purchases.filter(p => p.type === 'monthly' || p.type === 'annual').length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Revenus (30 derniers jours)</h1>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: `${total.toFixed(2)} €` },
          { label: 'Achats unitaires', value: String(units) },
          { label: 'Abonnements', value: String(subs) },
        ].map(card => (
          <div key={card.label} className="bg-surface rounded-xl p-5 space-y-1">
            <p className="text-muted text-sm">{card.label}</p>
            <p className="text-2xl font-bold text-accent">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-muted/20">
            <tr className="text-left text-muted">
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p: Record<string, unknown>) => {
              const purchasedAt = p.purchasedAt as { _seconds?: number } | null;
              const dateStr = purchasedAt?._seconds
                ? new Date(purchasedAt._seconds * 1000).toLocaleDateString('fr-FR')
                : '—';
              return (
                <tr key={p.id as string} className="border-b border-muted/10 hover:bg-background/50">
                  <td className="px-4 py-3">{p.type as string}</td>
                  <td className="px-4 py-3 text-muted">{(p.raceId as string) ?? '—'}</td>
                  <td className="px-4 py-3 text-muted">{p.amount != null ? `${(p.amount as number).toFixed(2)} €` : '—'}</td>
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
