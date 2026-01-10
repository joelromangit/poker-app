import { db } from './supabase';
import { Game, GameSummary } from '@/types';

// Obtener resumen de partidas para la lista
export async function getGamesSummary(): Promise<GameSummary[]> {
  // Obtener partidas con jugadores
  const { data, error } = await db
    .from('games')
    .select(`
      id,
      created_at,
      name,
      status,
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

  return data.map(game => {
    const gamePlayers = game.game_players || [];

    // Mejor resultado (mayor profit)
    const topWinner = gamePlayers.reduce((prev: typeof gamePlayers[0] | null, curr: typeof gamePlayers[0]) =>
      (curr.profit > (prev?.profit || -Infinity)) ? curr : prev
      , null);

    // Peor resultado (menor profit)
    const worstLoser = gamePlayers.reduce((prev: typeof gamePlayers[0] | null, curr: typeof gamePlayers[0]) =>
      (curr.profit < (prev?.profit || Infinity)) ? curr : prev
      , null);

    // Lista de participantes
    const participants = gamePlayers
      .map((gp: typeof gamePlayers[0]) => gp.players?.name)
      .filter((name: string | undefined): name is string => !!name);

    return {
      id: game.id,
      created_at: game.created_at,
      name: game.name || undefined,
      status: (game.status === 'in_progress' ? 'in_progress' : 'completed') as 'in_progress' | 'completed',
      player_count: gamePlayers.length,
      total_pot: game.total_pot,
      top_winner: topWinner?.players?.name || '-',
      top_winner_profit: topWinner?.profit || 0,
      worst_loser: worstLoser?.players?.name || '-',
      worst_loser_profit: worstLoser?.profit || 0,
      participants,
    };
  });
}

// Obtener una partida por ID
export async function getGameById(id: string): Promise<Game | null> {
  const { data, error } = await db
    .from('games')
    .select(`
      *,
      game_players (
        *,
        player:players (*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching game:', error);
    return null;
  }

  return data;
}

// Crear una nueva partida
export async function createGame(
  chipValue: number,
  buyIn: number,
  players: { player_id: string; final_chips: number; rebuys: number }[],
  notes?: string,
  gameDate?: Date,
  name?: string
): Promise<Game | null> {
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
      name: name || null,
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

// Crear un borrador de partida (sin fichas finales)
export async function createGameDraft(
  chipValue: number,
  buyIn: number,
  playerIds: string[],
  notes?: string,
  gameDate?: Date,
  name?: string
): Promise<string | null> {
  // El bote inicial es el buy-in de cada jugador (sin rebuys)
  const totalPot = playerIds.length * buyIn * chipValue;

  // 1. Crear la partida con status 'in_progress'
  const { data: gameData, error: gameError } = await db
    .from('games')
    .insert({
      name: name || null,
      chip_value: chipValue,
      buy_in: buyIn,
      total_pot: totalPot,
      notes: notes || null,
      status: 'in_progress',
      created_at: gameDate ? gameDate.toISOString() : new Date().toISOString(),
    })
    .select()
    .single();

  if (gameError || !gameData) {
    console.error('Error creating game draft:', gameError);
    return null;
  }

  // 2. Crear los game_players con fichas finales en 0
  const gamePlayers = playerIds.map(playerId => ({
    game_id: gameData.id,
    player_id: playerId,
    initial_chips: buyIn,
    final_chips: 0,
    rebuys: 0,
    profit: 0,
  }));

  const { error: playersError } = await db
    .from('game_players')
    .insert(gamePlayers);

  if (playersError) {
    console.error('Error creating game_players for draft:', playersError);
    // Rollback: eliminar la partida creada
    await db.from('games').delete().eq('id', gameData.id);
    return null;
  }

  // Retornar solo el ID para la redirección
  return gameData.id;
}

// Actualizar una partida existente
// status: 'in_progress' para guardar como borrador, 'completed' para completar
export async function updateGame(
  gameId: string,
  chipValue: number,
  buyIn: number,
  players: { player_id: string; final_chips: number; rebuys: number }[],
  notes?: string,
  gameDate?: Date,
  name?: string,
  status: 'in_progress' | 'completed' = 'completed'
): Promise<Game | null> {
  // Calcular el bote total incluyendo rebuys
  const totalPot = players.reduce((sum, p) => {
    const totalChipsBought = buyIn * (1 + p.rebuys);
    return sum + (totalChipsBought * chipValue);
  }, 0);

  // 1. Actualizar la partida
  const updateData: Partial<Game> = {
    name: name || null,
    chip_value: chipValue,
    buy_in: buyIn,
    total_pot: totalPot,
    notes: notes || null,
    status: status,
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


// Actualizar foto del perdedor
export async function updateGameLoserPhoto(gameId: string, loserPhotoUrl: string | null): Promise<boolean> {
  const { error } = await db
    .from('games')
    .update({ loser_photo_url: loserPhotoUrl })
    .eq('id', gameId);

  if (error) {
    console.error('Error updating loser photo:', error);
    return false;
  }

  return true;
}
