import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Solo crear cliente si hay credenciales
export const supabase: SupabaseClient | null = 
  supabaseUrl && supabaseAnonKey 
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Database types
export interface DbPlayer {
  id: string;
  created_at: string;
  name: string;
  avatar_color: string;
  is_active: boolean;
}

export interface DbGamePlayer {
  id: string;
  game_id: string;
  player_id: string;
  initial_chips: number;
  final_chips: number;
  profit: number;
  players?: DbPlayer; // Join con players
}

export interface DbGame {
  id: string;
  created_at: string;
  chip_value: number;
  buy_in: number;
  total_pot: number;
  notes: string | null;
  status: 'active' | 'completed';
  game_players?: DbGamePlayer[]; // Join con game_players
}
