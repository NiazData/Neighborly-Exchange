import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = { lastTable: null, q: null };

function makeQuery(rows = []) {
  const q = {
    select: vi.fn(() => q),
    insert: vi.fn(() => q),
    update: vi.fn(() => q),
    delete: vi.fn(() => q),
    eq: vi.fn(() => q),
    in: vi.fn(() => q),
    order: vi.fn(() => q),
    limit: vi.fn(() => q),
    single: vi.fn(() => Promise.resolve({ data: rows[0] ?? { id: 'x' }, error: null })),
    then: (resolve, reject) =>
      Promise.resolve({ data: rows, error: null }).then(resolve, reject),
  };
  return q;
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      state.lastTable = table;
      state.q = makeQuery([{ id: '1' }]);
      return state.q;
    }),
  },
}));

import { Skill, User } from './entities';

beforeEach(() => { state.lastTable = null; state.q = null; });

describe('entity adapter', () => {
  it('filter() applies eq per key, desc order, and limit', async () => {
    const rows = await Skill.filter({ status: 'active' }, '-created_date', 50);
    expect(state.lastTable).toBe('skills');
    expect(state.q.eq).toHaveBeenCalledWith('status', 'active');
    expect(state.q.order).toHaveBeenCalledWith('created_date', { ascending: false });
    expect(state.q.limit).toHaveBeenCalledWith(50);
    expect(rows).toEqual([{ id: '1' }]);
  });

  it('filter() uses IN for array values', async () => {
    await Skill.filter({ status: ['active', 'paused'] });
    expect(state.q.in).toHaveBeenCalledWith('status', ['active', 'paused']);
  });

  it('create() inserts and returns the single row', async () => {
    const row = await Skill.create({ title: 't' });
    expect(state.q.insert).toHaveBeenCalledWith({ title: 't' });
    expect(row).toEqual({ id: '1' });
  });

  it('User.filter reads the public_profiles view', async () => {
    await User.filter({ id: 'abc' });
    expect(state.lastTable).toBe('public_profiles');
  });

  it('User.update writes to profiles', async () => {
    await User.update('abc', { is_verified: true });
    expect(state.lastTable).toBe('profiles');
  });
});
