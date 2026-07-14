import { describe, it, expect, vi } from 'vitest';

const profileRow = { id: 'u1', full_name: 'Test User' };

function makeQuery(row) {
  const q = {
    select: vi.fn(() => q), update: vi.fn(() => q), eq: vi.fn(() => q),
    single: vi.fn(() => Promise.resolve({ data: row, error: null })),
  };
  return q;
}

const getUserMock = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: (...a) => getUserMock(...a),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
    from: vi.fn(() => makeQuery(profileRow)),
  },
}));

import { auth } from './auth';

describe('auth.me', () => {
  it('returns the profile row when signed in', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'u1' } } });
    await expect(auth.me()).resolves.toEqual(profileRow);
  });
  it('throws a 401-shaped error when signed out', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    await expect(auth.me()).rejects.toMatchObject({ status: 401 });
  });
});
