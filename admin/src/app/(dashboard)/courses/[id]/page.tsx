import { db } from '@/lib/firebase-admin';
import RaceForm from '@/components/RaceForm';

interface Props {
  params: { id: string };
}

export default async function RaceEditPage({ params }: Props) {
  const isNew = params.id === 'new';
  let race = null;
  if (!isNew) {
    const doc = await db.collection('races').doc(params.id).get();
    if (doc.exists) race = { id: doc.id, ...doc.data() };
  }
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{isNew ? 'Nouvelle course' : 'Modifier la course'}</h1>
      <RaceForm race={race} raceId={isNew ? null : params.id} />
    </div>
  );
}
