// Jugador permanente (tabla players)
export interface Player {
  id: string;
  created_at: string;
  name: string;
  avatar_color: string;
  is_active: boolean;
}

// Jugador en una partida específica (tabla game_players)
export interface GamePlayer {
  id: string;
  game_id: string;
  player_id: string;
  player: Player; // Datos del jugador
  initial_chips: number;
  final_chips: number;
  profit: number;
}

// Partida
export interface Game {
  id: string;
  created_at: string;
  chip_value: number;
  buy_in: number;
  players: GamePlayer[];
  total_pot: number;
  notes?: string;
  status: 'active' | 'completed';
}

// Resumen de partida para la lista
export interface GameSummary {
  id: string;
  created_at: string;
  player_count: number;
  total_pot: number;
  top_winner: string;
  top_winner_profit: number;
}

// Estadísticas de un jugador
export interface PlayerStats {
  player: Player;
  total_games: number;
  total_balance: number;
  best_game: number;
  worst_game: number;
  average_per_game: number;
  wins: number;
  losses: number;
  win_rate: number;
}

// Para el formulario de nueva partida
export interface GameFormPlayer {
  player_id: string;
  player: Player;
  final_chips: string;
}

// Para crear jugador
export interface CreatePlayerData {
  name: string;
  avatar_color?: string;
}
