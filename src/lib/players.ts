import { supabase, DbPlayer } from './supabase';
import { Player, PlayerStats, CreatePlayerData } from '@/types';

// Verificar que Supabase está configurado
function checkSupabase() {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  return supabase;
}

// Obtener todos los jugadores activos
export async function getPlayers(): Promise<Player[]> {
  const db = checkSupabase();

  const { data, error } = await db
    .from('players')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching players:', error);
    return [];
  }

  return data as Player[];
}

// Obtener un jugador por ID
export async function getPlayerById(id: string): Promise<Player | null> {
  const db = checkSupabase();

  const { data, error } = await db
    .from('players')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching player:', error);
    return null;
  }

  return data as Player;
}

// Crear un nuevo jugador
export async function createPlayer(playerData: CreatePlayerData): Promise<Player | null> {
  const db = checkSupabase();

  const { data, error } = await db
    .from('players')
    .insert({
      name: playerData.name.trim(),
      avatar_color: playerData.avatar_color || getRandomColor(),
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating player:', error);
    return null;
  }

  return data as Player;
}

// Actualizar un jugador
export async function updatePlayer(id: string, updates: Partial<CreatePlayerData>): Promise<Player | null> {
  const db = checkSupabase();

  const { data, error } = await db
    .from('players')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating player:', error);
    return null;
  }

  return data as Player;
}

// Desactivar un jugador (soft delete)
export async function deactivatePlayer(id: string): Promise<boolean> {
  const db = checkSupabase();

  const { error } = await db
    .from('players')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deactivating player:', error);
    return false;
  }

  return true;
}

// Obtener estadísticas de un jugador
export async function getPlayerStats(playerId: string): Promise<PlayerStats | null> {
  const db = checkSupabase();

  // Obtener el jugador
  const player = await getPlayerById(playerId);
  if (!player) return null;

  // Obtener todas las participaciones del jugador
  const { data: gamePlayersData, error } = await db
    .from('game_players')
    .select('*')
    .eq('player_id', playerId);

  if (error) {
    console.error('Error fetching player stats:', error);
    return null;
  }

  const gamePlayers = gamePlayersData || [];
  
  if (gamePlayers.length === 0) {
    return {
      player,
      total_games: 0,
      total_balance: 0,
      best_game: 0,
      worst_game: 0,
      average_per_game: 0,
      wins: 0,
      losses: 0,
      win_rate: 0,
    };
  }

  const profits = gamePlayers.map(gp => gp.profit);
  const totalBalance = profits.reduce((sum, p) => sum + p, 0);
  const wins = profits.filter(p => p > 0).length;
  const losses = profits.filter(p => p < 0).length;

  return {
    player,
    total_games: gamePlayers.length,
    total_balance: totalBalance,
    best_game: Math.max(...profits),
    worst_game: Math.min(...profits),
    average_per_game: totalBalance / gamePlayers.length,
    wins,
    losses,
    win_rate: (wins / gamePlayers.length) * 100,
  };
}

// Obtener estadísticas de todos los jugadores
export async function getAllPlayersStats(): Promise<PlayerStats[]> {
  const players = await getPlayers();
  const statsPromises = players.map(p => getPlayerStats(p.id));
  const stats = await Promise.all(statsPromises);
  return stats.filter((s): s is PlayerStats => s !== null);
}

// Colores aleatorios para avatares
const AVATAR_COLORS = [
  '#10B981', // Verde esmeralda
  '#3B82F6', // Azul
  '#8B5CF6', // Púrpura
  '#F59E0B', // Ámbar
  '#EF4444', // Rojo
  '#EC4899', // Rosa
  '#06B6D4', // Cyan
  '#84CC16', // Lima
];

function getRandomColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

