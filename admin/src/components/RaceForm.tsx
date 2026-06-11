'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { clientAuth } from '@/lib/firebase-client';
import { getApp } from 'firebase/app';

interface Checkpoint {
  name: string;
  lat: string;
  lng: string;
  radius: string;
}

interface RaceData {
  title?: string;
  distance?: number;
  elevationGain?: number;
  region?: string;
  difficulty?: string;
  description?: string;
  gpxUrl?: string;
  season?: string;
  isActive?: boolean;
  checkpoints?: Checkpoint[];
}

interface Props {
  race: (RaceData & { id?: string }) | null;
  raceId: string | null;
}

const EMPTY_CP: Checkpoint = { name: '', lat: '', lng: '', radius: '30' };

export default function RaceForm({ race, raceId }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(race?.title ?? '');
  const [distance, setDistance] = useState(String(race?.distance ?? ''));
  const [elevationGain, setElevationGain] = useState(String(race?.elevationGain ?? ''));
  const [region, setRegion] = useState(race?.region ?? '');
  const [difficulty, setDifficulty] = useState(race?.difficulty ?? 'medium');
  const [description, setDescription] = useState(race?.description ?? '');
  const [gpxUrl, setGpxUrl] = useState(race?.gpxUrl ?? '');
  const [season, setSeason] = useState(race?.season ?? String(new Date().getFullYear()));
  const [isActive, setIsActive] = useState(race?.isActive ?? true);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(
    (race?.checkpoints as Checkpoint[]) ?? [EMPTY_CP],
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleGpxUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const storage = getStorage(getApp());
      const path = `gpx/${raceId ?? 'new_' + Date.now()}.gpx`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setGpxUrl(url);
    } catch (err) {
      setError('Erreur upload GPX');
    } finally {
      setUploading(false);
    }
  }

  function addCheckpoint() {
    setCheckpoints(prev => [...prev, { ...EMPTY_CP }]);
  }

  function removeCheckpoint(i: number) {
    setCheckpoints(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateCheckpoint(i: number, field: keyof Checkpoint, value: string) {
    setCheckpoints(prev => prev.map((cp, idx) => (idx === i ? { ...cp, [field]: value } : cp)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        title,
        distance: parseFloat(distance),
        elevationGain: parseFloat(elevationGain),
        region,
        difficulty,
        description,
        gpxUrl,
        season,
        isActive,
        checkpoints: checkpoints.map(cp => ({
          name: cp.name,
          lat: parseFloat(cp.lat),
          lng: parseFloat(cp.lng),
          radius: parseFloat(cp.radius),
        })),
      };
      const url = raceId ? `/api/races/${raceId}` : '/api/races';
      const method = raceId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erreur serveur');
      router.push('/courses');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full bg-background border border-muted/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent';
  const labelCls = 'block text-sm text-muted mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="text-danger text-sm">{error}</p>}

      <div>
        <label className={labelCls}>Titre</label>
        <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Distance (km)</label>
          <input type="number" step="0.1" className={inputCls} value={distance} onChange={e => setDistance(e.target.value)} required />
        </div>
        <div>
          <label className={labelCls}>Dénivelé+ (m)</label>
          <input type="number" className={inputCls} value={elevationGain} onChange={e => setElevationGain(e.target.value)} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Région</label>
          <input className={inputCls} value={region} onChange={e => setRegion(e.target.value)} required />
        </div>
        <div>
          <label className={labelCls}>Difficulté</label>
          <select className={inputCls} value={difficulty} onChange={e => setDifficulty(e.target.value)}>
            <option value="easy">Facile</option>
            <option value="medium">Moyen</option>
            <option value="hard">Difficile</option>
            <option value="extreme">Extrême</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea className={inputCls} rows={3} value={description} onChange={e => setDescription(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Saison</label>
          <input className={inputCls} value={season} onChange={e => setSeason(e.target.value)} required />
        </div>
        <div className="flex items-end pb-1 gap-2">
          <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="accent-accent" />
          <label htmlFor="isActive" className="text-sm">Course active</label>
        </div>
      </div>

      <div>
        <label className={labelCls}>Fichier GPX</label>
        <input type="file" accept=".gpx" onChange={handleGpxUpload} className="text-sm text-muted" />
        {uploading && <p className="text-xs text-muted mt-1">Upload en cours…</p>}
        {gpxUrl && <p className="text-xs text-success mt-1 truncate">✓ {gpxUrl}</p>}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Checkpoints</span>
          <button type="button" onClick={addCheckpoint} className="text-xs text-accent hover:underline">+ Ajouter</button>
        </div>
        {checkpoints.map((cp, i) => (
          <div key={i} className="bg-background rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">#{i + 1}</span>
              {checkpoints.length > 1 && (
                <button type="button" onClick={() => removeCheckpoint(i)} className="text-xs text-danger hover:underline">Supprimer</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Nom" className={inputCls} value={cp.name} onChange={e => updateCheckpoint(i, 'name', e.target.value)} />
              <input placeholder="Rayon (m)" type="number" className={inputCls} value={cp.radius} onChange={e => updateCheckpoint(i, 'radius', e.target.value)} />
              <input placeholder="Latitude" type="number" step="any" className={inputCls} value={cp.lat} onChange={e => updateCheckpoint(i, 'lat', e.target.value)} />
              <input placeholder="Longitude" type="number" step="any" className={inputCls} value={cp.lng} onChange={e => updateCheckpoint(i, 'lng', e.target.value)} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="bg-accent text-background px-6 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" onClick={() => router.back()} className="px-6 py-2 rounded-lg text-sm border border-muted/30 hover:bg-surface">
          Annuler
        </button>
      </div>
    </form>
  );
}
