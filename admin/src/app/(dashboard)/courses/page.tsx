import { db } from '@/lib/firebase-admin';
import Link from 'next/link';

export default async function CoursesPage() {
  const snap = await db.collection('races').orderBy('title').get();
  const races = snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Courses</h1>
        <Link
          href="/courses/new"
          className="bg-accent text-background px-4 py-2 rounded-lg text-sm font-semibold"
        >
          + Ajouter
        </Link>
      </div>
      <div className="bg-surface rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-muted/20">
            <tr className="text-left text-muted">
              <th className="px-4 py-3">Titre</th>
              <th className="px-4 py-3">Distance</th>
              <th className="px-4 py-3">Région</th>
              <th className="px-4 py-3">Difficulté</th>
              <th className="px-4 py-3">Actif</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {races.map((r: Record<string, unknown>) => (
              <tr key={r.id as string} className="border-b border-muted/10 hover:bg-background/50">
                <td className="px-4 py-3 font-medium">{r.title as string}</td>
                <td className="px-4 py-3 text-muted">{r.distance as number} km</td>
                <td className="px-4 py-3 text-muted">{r.region as string}</td>
                <td className="px-4 py-3 text-muted">{r.difficulty as string}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${r.isActive ? 'bg-success/20 text-success' : 'bg-muted/20 text-muted'}`}>
                    {r.isActive ? 'Oui' : 'Non'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/courses/${r.id as string}`} className="text-accent hover:underline text-xs">
                    Modifier
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
