import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Solo crear cliente si hay credenciales
export const supabase: SupabaseClient | null = 
  supabaseUrl && supabaseAnonKey 
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Database types
export interface DbGame {
  id: string;
  created_at: string;
  chip_value: number;
  buy_in: number;
  players: DbPlayer[];
  total_pot: number;
  notes: string | null;
  status: 'active' | 'completed';
}

export interface DbPlayer {
  id: string;
  name: string;
  initialChips: number;
  finalChips: number;
  profit: number;
}
