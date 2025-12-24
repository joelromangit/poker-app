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
  players: { player_id: string; final_chips: number; rebuys: number }[],
  notes?: string,
  gameDate?: Date
): Promise<Game | null> {
  const db = checkSupabase();

  // Calcular el bote total incluyendo rebuys
  // totalPot = Σ (buy_in × (1 + rebuys)) × chip_value
  const totalPot = players.reduce((sum, p) => {
    const totalChipsBought = buyIn * (1 + p.rebuys);
    return sum + (totalChipsBought * chipValue);
  }, 0);

  // 1. Crear la partida
  const { data: gameData, error: gameError } = await db
    .from('games')
    .insert({
      chip_value: chipValue,
      buy_in: buyIn,
      total_pot: totalPot,
      notes: notes || null,
      status: 'completed',
      created_at: gameDate ? gameDate.toISOString() : new Date().toISOString(),
    })
    .select()
    .single();

  if (gameError || !gameData) {
    console.error('Error creating game:', gameError);
    return null;
  }

  // 2. Crear los game_players con rebuys
  const gamePlayers = players.map(p => {
    // Total de fichas compradas = buy_in × (1 + rebuys)
    const totalChipsBought = buyIn * (1 + p.rebuys);
    // Profit = (fichas_finales - fichas_compradas) × valor_ficha
    const profit = (p.final_chips - totalChipsBought) * chipValue;
    
    return {
      game_id: gameData.id,
      player_id: p.player_id,
      initial_chips: buyIn,
      final_chips: p.final_chips,
      rebuys: p.rebuys,
      profit: profit,
    };
  });

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

// Actualizar una partida existente
export async function updateGame(
  gameId: string,
  chipValue: number,
  buyIn: number,
  players: { player_id: string; final_chips: number; rebuys: number }[],
  notes?: string,
  gameDate?: Date
): Promise<Game | null> {
  const db = checkSupabase();

  // Calcular el bote total incluyendo rebuys
  const totalPot = players.reduce((sum, p) => {
    const totalChipsBought = buyIn * (1 + p.rebuys);
    return sum + (totalChipsBought * chipValue);
  }, 0);

  // 1. Actualizar la partida
  const updateData: any = {
    chip_value: chipValue,
    buy_in: buyIn,
    total_pot: totalPot,
    notes: notes || null,
  };
  
  if (gameDate) {
    updateData.created_at = gameDate.toISOString();
  }

  const { error: gameError } = await db
    .from('games')
    .update(updateData)
    .eq('id', gameId);

  if (gameError) {
    console.error('Error updating game:', gameError);
    return null;
  }

  // 2. Eliminar los game_players existentes
  const { error: deleteError } = await db
    .from('game_players')
    .delete()
    .eq('game_id', gameId);

  if (deleteError) {
    console.error('Error deleting old game_players:', deleteError);
    return null;
  }

  // 3. Crear los nuevos game_players
  const gamePlayers = players.map(p => {
    const totalChipsBought = buyIn * (1 + p.rebuys);
    const profit = (p.final_chips - totalChipsBought) * chipValue;
    
    return {
      game_id: gameId,
      player_id: p.player_id,
      initial_chips: buyIn,
      final_chips: p.final_chips,
      rebuys: p.rebuys,
      profit: profit,
    };
  });

  const { error: playersError } = await db
    .from('game_players')
    .insert(gamePlayers);

  if (playersError) {
    console.error('Error creating new game_players:', playersError);
    return null;
  }

  // 4. Obtener la partida actualizada
  return getGameById(gameId);
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
    rebuys: gp.rebuys || 0,
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
