import { db, Player as DbPlayer } from './supabase';
import { computeRecentForm } from './historyStats';
import { Player, PlayerStats, CreatePlayerData } from '@/types';


// Obtener todos los jugadores activos
export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await db
    .from('players')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching players:', error);
    return [];
  }

  return data
}

// Obtener un jugador por ID
export async function getPlayerById(id: string): Promise<Player | null> {
  const { data, error } = await db
    .from('players')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching player:', error);
    return null;
  }

  return data;
}

// Crear un nuevo jugador
export async function createPlayer(playerData: CreatePlayerData): Promise<Player | null> {
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

  return data;
}

// Datos para actualizar jugador (incluye avatar_url)
export interface UpdatePlayerData extends Partial<CreatePlayerData> {
  avatar_url?: string | null;
}

// Actualizar un jugador
export async function updatePlayer(id: string, updates: UpdatePlayerData): Promise<Player | null> {
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

  return data;
}

// Desactivar un jugador (soft delete)
export async function deactivatePlayer(id: string): Promise<boolean> {
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
  // Obtener el jugador
  const player = await getPlayerById(playerId);
  if (!player) return null;

  // Obtener todas las participaciones del jugador con la fecha de la partida
  const { data: gamePlayersData, error } = await db
    .from('game_players')
    .select('profit, game:games (created_at)')
    .eq('player_id', playerId);

  if (error) {
    console.error('Error fetching player stats:', error);
    return null;
  }

  const gamePlayers = gamePlayersData;

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
      recent_form: [],
    };
  }

  // Profits en orden cronológico para la forma reciente
  const chronological = [...gamePlayers].sort(
    (a, b) =>
      new Date(a.game?.created_at ?? 0).getTime() -
      new Date(b.game?.created_at ?? 0).getTime(),
  );
  const profits = chronological.map(gp => gp.profit);
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
    recent_form: computeRecentForm(profits),
  };
}

// Obtener estadísticas de todos los jugadores, opcionalmente limitadas a un
// rango de fechas de partida (formato YYYY-MM-DD, ambos inclusive)
export async function getAllPlayersStats(
  from?: string,
  to?: string,
): Promise<PlayerStats[]> {
  const [players, { data, error }] = await Promise.all([
    getPlayers(),
    db.from('game_players').select('player_id, profit, game:games (created_at)'),
  ]);

  if (error || !data) {
    console.error('Error fetching players stats:', error);
    return [];
  }

  const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : null;
  const toTime = to ? new Date(`${to}T23:59:59.999`).getTime() : null;

  const rowsByPlayer = new Map<string, { profit: number; time: number }[]>();
  for (const gp of data) {
    if (!gp.player_id || !gp.game) continue;
    const time = new Date(gp.game.created_at).getTime();
    if (fromTime !== null && time < fromTime) continue;
    if (toTime !== null && time > toTime) continue;

    const rows = rowsByPlayer.get(gp.player_id);
    if (rows) rows.push({ profit: gp.profit, time });
    else rowsByPlayer.set(gp.player_id, [{ profit: gp.profit, time }]);
  }

  return players.map(player => {
    const rows = rowsByPlayer.get(player.id) ?? [];
    if (rows.length === 0) {
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
        recent_form: [],
      };
    }
    rows.sort((a, b) => a.time - b.time);
    const profits = rows.map(r => r.profit);

    const totalBalance = profits.reduce((sum, p) => sum + p, 0);
    const wins = profits.filter(p => p > 0).length;
    const losses = profits.filter(p => p < 0).length;

    return {
      player,
      total_games: profits.length,
      total_balance: totalBalance,
      best_game: Math.max(...profits),
      worst_game: Math.min(...profits),
      average_per_game: totalBalance / profits.length,
      wins,
      losses,
      win_rate: (wins / profits.length) * 100,
      recent_form: computeRecentForm(profits),
    };
  });
}

// Obtener estadísticas para la página principal
export interface PlayerSummary {
  name: string;
  avatar_url?: string;
  avatar_color: string;
}

export interface HomeStats {
  leader: { player: PlayerSummary; balance: number } | null;
  rebuyKing: { player: PlayerSummary; avgRebuys: number } | null;
}

export async function getHomeStats(): Promise<HomeStats> {
  // Obtener todos los game_players con info de jugadores
  const { data, error } = await db
    .from('game_players')
    .select(`
      profit,
      rebuys,
      player: players (id, name, avatar_url, avatar_color)
    `);

  if (error || !data) {
    console.error('Error fetching home stats:', error);
    return { leader: null, rebuyKing: null };
  }

  // Calcular balance total por jugador y rebuys (total + count de partidas)
  const playerBalances = new Map<string, { player: PlayerSummary; balance: number }>();
  const playerRebuys = new Map<string, { player: PlayerSummary; totalRebuys: number; gamesCount: number }>();

  data.forEach((gp) => {
    const playerId = gp.player?.id;
    const playerData = gp.player;
    if (!playerId || !playerData) return;

    const playerSummary: PlayerSummary = {
      name: playerData.name,
      avatar_url: playerData.avatar_url || undefined,
      avatar_color: getAvatarColor(playerData.avatar_color),
    };

    // Balance
    const current = playerBalances.get(playerId);
    if (current) {
      current.balance += gp.profit;
    } else {
      playerBalances.set(playerId, { player: playerSummary, balance: gp.profit });
    }

    // Rebuys (acumular total y contar partidas)
    const currentRebuys = playerRebuys.get(playerId);
    if (currentRebuys) {
      currentRebuys.totalRebuys += gp.rebuys || 0;
      currentRebuys.gamesCount += 1;
    } else {
      playerRebuys.set(playerId, { player: playerSummary, totalRebuys: gp.rebuys || 0, gamesCount: 1 });
    }
  });

  // Encontrar líder (mayor balance)
  let leader: { player: PlayerSummary; balance: number } | null = null;
  playerBalances.forEach((value) => {
    if (!leader || value.balance > leader.balance) {
      leader = value;
    }
  });

  // Encontrar rey del rebuy (mayor MEDIA de rebuys por partida)
  let rebuyKing: { player: PlayerSummary; avgRebuys: number } | null = null;
  playerRebuys.forEach((value) => {
    const avgRebuys = value.gamesCount > 0 ? value.totalRebuys / value.gamesCount : 0;
    if (avgRebuys > 0 && (!rebuyKing || avgRebuys > rebuyKing.avgRebuys)) {
      rebuyKing = { player: value.player, avgRebuys };
    }
  });

  return { leader, rebuyKing };
}

// Obtener color de avatar con fallback seguro
export function getAvatarColor(color: string | null | undefined): string {
  return color || '#10B981';
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

