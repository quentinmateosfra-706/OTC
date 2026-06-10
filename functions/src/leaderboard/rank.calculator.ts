import * as admin from 'firebase-admin';

export async function recalculateRanks(
  raceId: string,
  season: string,
): Promise<void> {
  const db = admin.firestore();
  const colRef = db.collection(`leaderboard/${raceId}_${season}/entries`);

  const snap = await colRef.orderBy('durationSeconds', 'asc').get();

  const batch = db.batch();
  snap.docs.forEach((document, i) => {
    batch.update(document.ref, { rank: i + 1 });
  });
  await batch.commit();
}
