import { supabase, DbGame, DbGamePlayer } from './supabase';
import { Game, GamePlayer, GameSummary } from '@/types';

// Verificar que Supabase está configurado
function checkSupabase() {
  if (!supabase) {
    throw new Error('Supabase no está configurado. Añade las credenciales en .env.local');
  }
  return supabase;
}

// Obtener todas las partidas
export async function getGames(): Promise<Game[]> {
  const db = checkSupabase();

  const { data, error } = await db
    .from('games')
    .select(`
      *,
      game_players (
        *,
        players (*)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching games:', error);
    return [];
  }

  return (data || []).map(mapDbGameToGame);
}

// Obtener resumen de partidas para la lista
export async function getGamesSummary(): Promise<GameSummary[]> {
  const db = checkSupabase();

  // Obtener partidas con jugadores
  const { data, error } = await db
    .from('games')
    .select(`
      id,
      created_at,
      total_pot,
      game_players (
        profit,
        players (name)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching games summary:', error);
    return [];
  }

  return (data || []).map(game => {
    const gamePlayers = game.game_players || [];
    const topWinner = gamePlayers.reduce((prev: any, curr: any) => 
      (curr.profit > (prev?.profit || -Infinity)) ? curr : prev
    , null);

    return {
      id: game.id,
      created_at: game.created_at,
      player_count: gamePlayers.length,
      total_pot: game.total_pot,
      top_winner: topWinner?.players?.name || '-',
      top_winner_profit: topWinner?.profit || 0,
    };
  });
}

// Obtener una partida por ID
export async function getGameById(id: string): Promise<Game | null> {
  const db = checkSupabase();

  const { data, error } = await db
    .from('games')
    .select(`
      *,
      game_players (
        *,
        players (*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching game:', error);
    return null;
  }

  return mapDbGameToGame(data);
}

// Crear una nueva partida
export async function createGame(
  chipValue: number,
  buyIn: number,
  players: { player_id: string; final_chips: number }[],
  notes?: string
): Promise<Game | null> {
  const db = checkSupabase();

  const totalPot = players.length * buyIn * chipValue;

  // 1. Crear la partida
  const { data: gameData, error: gameError } = await db
    .from('games')
    .insert({
      chip_value: chipValue,
      buy_in: buyIn,
      total_pot: totalPot,
      notes: notes || null,
      status: 'completed',
    })
    .select()
    .single();

  if (gameError || !gameData) {
    console.error('Error creating game:', gameError);
    return null;
  }

  // 2. Crear los game_players
  const gamePlayers = players.map(p => ({
    game_id: gameData.id,
    player_id: p.player_id,
    initial_chips: buyIn,
    final_chips: p.final_chips,
    profit: (p.final_chips - buyIn) * chipValue,
  }));

  const { error: playersError } = await db
    .from('game_players')
    .insert(gamePlayers);

  if (playersError) {
    console.error('Error creating game_players:', playersError);
    // Rollback: eliminar la partida creada
    await db.from('games').delete().eq('id', gameData.id);
    return null;
  }

  // 3. Obtener la partida completa con jugadores
  return getGameById(gameData.id);
}

// Eliminar una partida
export async function deleteGame(id: string): Promise<boolean> {
  const db = checkSupabase();

  // game_players se elimina automáticamente por ON DELETE CASCADE
  const { error } = await db
    .from('games')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting game:', error);
    return false;
  }

  return true;
}

// Mapear datos de DB a tipo Game
function mapDbGameToGame(dbGame: any): Game {
  const gamePlayers: GamePlayer[] = (dbGame.game_players || []).map((gp: any) => ({
    id: gp.id,
    game_id: gp.game_id,
    player_id: gp.player_id,
    player: gp.players ? {
      id: gp.players.id,
      created_at: gp.players.created_at,
      name: gp.players.name,
      avatar_color: gp.players.avatar_color,
      is_active: gp.players.is_active,
    } : null,
    initial_chips: gp.initial_chips,
    final_chips: gp.final_chips,
    profit: gp.profit,
  }));

  return {
    id: dbGame.id,
    created_at: dbGame.created_at,
    chip_value: dbGame.chip_value,
    buy_in: dbGame.buy_in,
    players: gamePlayers,
    total_pot: dbGame.total_pot,
    notes: dbGame.notes || undefined,
    status: dbGame.status,
  };
}
