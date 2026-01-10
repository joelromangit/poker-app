// Import types from generated database types
import type { Tables } from '../lib/database.types';

export type Player = Tables<'players'>;
export type GamePlayer = Tables<'game_players'> & {
  player: Player;
};

export type Game = Tables<'games'> & {
  game_players: GamePlayer[]; // Lista de jugadores con sus datos
};

// Resumen de partida para la lista
export interface GameSummary {
  id: string;
  created_at: string;
  name?: string; // Nombre/título de la partida
  player_count: number;
  total_pot: number;
  top_winner: string;
  top_winner_profit: number;
  worst_loser: string;
  worst_loser_profit: number;
  participants: string[]; // Lista de nombres de todos los participantes
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
  rebuys: string; // Número de rebuys como string para permitir decimales (0 = solo buy-in inicial)
}

// Para crear jugador
export interface CreatePlayerData {
  name: string;
  avatar_color?: string;
}
