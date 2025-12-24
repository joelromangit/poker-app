export interface Player {
  id: string;
  name: string;
  initialChips: number;
  finalChips: number;
  profit: number; // En euros
}

export interface Game {
  id: string;
  created_at: string;
  chip_value: number; // Valor de cada ficha en euros
  buy_in: number; // Fichas iniciales por jugador
  players: Player[];
  total_pot: number; // Total en euros jugados
  notes?: string;
  status: 'active' | 'completed';
}

export interface GameFormData {
  chipValue: number;
  buyIn: number;
  players: PlayerFormData[];
  notes?: string;
}

export interface PlayerFormData {
  id: string;
  name: string;
  finalChips: number;
}

export interface GameSummary {
  id: string;
  created_at: string;
  player_count: number;
  total_pot: number;
  top_winner: string;
  top_winner_profit: number;
}

