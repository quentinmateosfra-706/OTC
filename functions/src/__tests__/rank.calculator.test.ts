import { recalculateRanks } from '../leaderboard/rank.calculator';

interface Entry {
  durationSeconds: number;
  rank?: number;
}

function buildMockDb(entries: Entry[]) {
  const docs = entries.map((data, idx) => {
    const stored = { ...data };
    return {
      ref: {
        _idx: idx,
        _store: stored,
      },
      data: () => stored,
    };
  });

  const sorted = [...docs].sort(
    (a, b) => a.data().durationSeconds - b.data().durationSeconds,
  );

  const updates: Array<{ ref: { _idx: number }; fields: Record<string, unknown> }> = [];

  const batch = {
    update: (ref: { _idx: number }, fields: Record<string, unknown>) => {
      updates.push({ ref, fields });
    },
    commit: jest.fn().mockResolvedValue(undefined),
    _updates: updates,
  };

  const colRef = {
    orderBy: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ docs: sorted }),
  };

  const db = {
    collection: jest.fn().mockReturnValue(colRef),
    batch: jest.fn().mockReturnValue(batch),
    _docs: docs,
    _batch: batch,
  };

  return db;
}

jest.mock('firebase-admin', () => ({
  firestore: jest.fn(),
}));

import * as admin from 'firebase-admin';

describe('recalculateRanks', () => {
  it('assigns ranks 1,2,3 sorted by durationSeconds ascending', async () => {
    const entries: Entry[] = [
      { durationSeconds: 7200 },
      { durationSeconds: 3600 },
      { durationSeconds: 5400 },
    ];

    const mockDb = buildMockDb(entries);
    (admin.firestore as unknown as jest.Mock).mockReturnValue(mockDb);

    await recalculateRanks('race1', '2024');

    const updates = mockDb._batch._updates;
    expect(updates).toHaveLength(3);

    const rankValues = updates.map((u) => u.fields.rank as number);
    expect(rankValues).toEqual([1, 2, 3]);
  });

  it('assigns rank 1 for a single entry', async () => {
    const entries: Entry[] = [{ durationSeconds: 3600 }];

    const mockDb = buildMockDb(entries);
    (admin.firestore as unknown as jest.Mock).mockReturnValue(mockDb);

    await recalculateRanks('race1', '2024');

    const updates = mockDb._batch._updates;
    expect(updates).toHaveLength(1);
    expect(updates[0].fields.rank).toBe(1);
  });
});
