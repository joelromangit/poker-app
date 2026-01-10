import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database, Tables, TablesInsert, TablesUpdate } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Solo crear cliente si hay credenciales
export const db: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Export types for convenience
export type Player = Tables<'players'>;
export type Game = Tables<'games'>;
export type GamePlayer = Tables<'game_players'>;

// Insert types
export type PlayerInsert = TablesInsert<'players'>;
export type GameInsert = TablesInsert<'games'>;
export type GamePlayerInsert = TablesInsert<'game_players'>;

// Update types
export type PlayerUpdate = TablesUpdate<'players'>;
export type GameUpdate = TablesUpdate<'games'>;
export type GamePlayerUpdate = TablesUpdate<'game_players'>;
