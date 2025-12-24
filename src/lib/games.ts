import { supabase, isSupabaseConfigured, DbGame } from './supabase';
import { Game, Player, GameSummary } from '@/types';

const LOCAL_STORAGE_KEY = 'poker_nights_games';

// Helper para localStorage
function getLocalGames(): Game[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setLocalGames(games: Game[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(games));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
}

// Obtener todas las partidas
export async function getGames(): Promise<Game[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getLocalGames();
  }

  const { data, error } = await supabase
    .from('games')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching games:', error);
    return [];
  }

  return (data as DbGame[]).map(mapDbGameToGame);
}

// Obtener resumen de partidas para la lista
export async function getGamesSummary(): Promise<GameSummary[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getGamesSummaryFromLocal();
  }

  const { data, error } = await supabase.rpc('get_games_summary');

  if (error) {
    console.error('Error fetching games summary:', error);
    // Fallback: obtener datos directamente
    return getGamesSummaryFallback();
  }

  return data || [];
}

// Resumen desde localStorage
function getGamesSummaryFromLocal(): GameSummary[] {
  const games = getLocalGames();
  
  return games.map(game => {
    const topWinner = game.players.reduce((prev, curr) => 
      curr.profit > prev.profit ? curr : prev
    , game.players[0] || { name: '-', profit: 0 });
    
    return {
      id: game.id,
      created_at: game.created_at,
      player_count: game.players.length,
      total_pot: game.total_pot,
      top_winner: topWinner?.name || '-',
      top_winner_profit: topWinner?.profit || 0,
    };
  });
}

// Fallback si la función RPC no existe
async function getGamesSummaryFallback(): Promise<GameSummary[]> {
  const games = await getGames();
  
  return games.map(game => {
    const topWinner = game.players.reduce((prev, curr) => 
      curr.profit > prev.profit ? curr : prev
    , game.players[0] || { name: '-', profit: 0 });
    
    return {
      id: game.id,
      created_at: game.created_at,
      player_count: game.players.length,
      total_pot: game.total_pot,
      top_winner: topWinner?.name || '-',
      top_winner_profit: topWinner?.profit || 0,
    };
  });
}

// Obtener una partida por ID
export async function getGameById(id: string): Promise<Game | null> {
  if (!isSupabaseConfigured || !supabase) {
    const games = getLocalGames();
    return games.find(g => g.id === id) || null;
  }

  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching game:', error);
    return null;
  }

  return mapDbGameToGame(data as DbGame);
}

// Crear una nueva partida
export async function createGame(
  chipValue: number,
  buyIn: number,
  players: { name: string; finalChips: number }[],
  notes?: string
): Promise<Game | null> {
  const processedPlayers: Player[] = players.map((p, index) => ({
    id: `player-${index}-${Date.now()}`,
    name: p.name,
    initialChips: buyIn,
    finalChips: p.finalChips,
    profit: (p.finalChips - buyIn) * chipValue,
  }));

  const totalPot = players.length * buyIn * chipValue;

  const newGame: Game = {
    id: `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    chip_value: chipValue,
    buy_in: buyIn,
    players: processedPlayers,
    total_pot: totalPot,
    notes: notes || undefined,
    status: 'completed',
  };

  if (!isSupabaseConfigured || !supabase) {
    const games = getLocalGames();
    games.unshift(newGame);
    setLocalGames(games);
    return newGame;
  }

  const { data, error } = await supabase
    .from('games')
    .insert({
      chip_value: chipValue,
      buy_in: buyIn,
      players: processedPlayers,
      total_pot: totalPot,
      notes: notes || null,
      status: 'completed',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating game:', error);
    return null;
  }

  return mapDbGameToGame(data as DbGame);
}

// Eliminar una partida
export async function deleteGame(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    const games = getLocalGames();
    const filtered = games.filter(g => g.id !== id);
    setLocalGames(filtered);
    return true;
  }

  const { error } = await supabase
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
function mapDbGameToGame(dbGame: DbGame): Game {
  return {
    id: dbGame.id,
    created_at: dbGame.created_at,
    chip_value: dbGame.chip_value,
    buy_in: dbGame.buy_in,
    players: dbGame.players,
    total_pot: dbGame.total_pot,
    notes: dbGame.notes || undefined,
    status: dbGame.status,
  };
}
