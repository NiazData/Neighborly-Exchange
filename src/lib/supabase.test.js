import { describe, it, expect } from 'vitest';
import { supabase } from './supabase';

describe('supabase client', () => {
  it('exports a configured client with auth and from()', () => {
    expect(supabase).toBeDefined();
    expect(typeof supabase.from).toBe('function');
    expect(supabase.auth).toBeDefined();
  });
});
