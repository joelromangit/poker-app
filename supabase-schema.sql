-- =============================================
-- POKER NIGHTS - Esquema de Base de Datos
-- =============================================
-- Ejecuta este SQL en el SQL Editor de Supabase
-- https://supabase.com/dashboard/project/TU_PROYECTO/sql

-- =============================================
-- TABLAS
-- =============================================

-- Tabla de jugadores permanentes
CREATE TABLE IF NOT EXISTS players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL UNIQUE,
  avatar_color TEXT DEFAULT '#10B981',
  is_active BOOLEAN DEFAULT true
);

-- Tabla de partidas
CREATE TABLE IF NOT EXISTS games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  chip_value DECIMAL(10,4) NOT NULL,
  buy_in INTEGER NOT NULL,
  total_pot DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('active', 'completed'))
);

-- Tabla de relación jugadores-partidas (con rebuys)
CREATE TABLE IF NOT EXISTS game_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
  initial_chips INTEGER NOT NULL,
  final_chips INTEGER NOT NULL,
  rebuys INTEGER NOT NULL DEFAULT 0,  -- Número de rebuys (compras adicionales)
  profit DECIMAL(10,2) NOT NULL,
  UNIQUE(game_id, player_id)
);

-- =============================================
-- ÍNDICES
-- =============================================

CREATE INDEX IF NOT EXISTS players_name_idx ON players(name);
CREATE INDEX IF NOT EXISTS players_is_active_idx ON players(is_active);
CREATE INDEX IF NOT EXISTS games_created_at_idx ON games(created_at DESC);
CREATE INDEX IF NOT EXISTS games_status_idx ON games(status);
CREATE INDEX IF NOT EXISTS game_players_game_id_idx ON game_players(game_id);
CREATE INDEX IF NOT EXISTS game_players_player_id_idx ON game_players(player_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;

-- Políticas para acceso público (sin autenticación)
-- En producción, añadir autenticación

CREATE POLICY "Allow public access to players" ON players
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public access to games" ON games
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public access to game_players" ON game_players
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- FUNCIONES
-- =============================================

-- Función para obtener estadísticas de un jugador
CREATE OR REPLACE FUNCTION get_player_stats(p_player_id UUID)
RETURNS TABLE (
  total_games INTEGER,
  total_balance DECIMAL,
  best_game DECIMAL,
  worst_game DECIMAL,
  average_per_game DECIMAL,
  wins INTEGER,
  losses INTEGER,
  win_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_games,
    COALESCE(SUM(gp.profit), 0)::DECIMAL as total_balance,
    COALESCE(MAX(gp.profit), 0)::DECIMAL as best_game,
    COALESCE(MIN(gp.profit), 0)::DECIMAL as worst_game,
    COALESCE(AVG(gp.profit), 0)::DECIMAL as average_per_game,
    COUNT(*) FILTER (WHERE gp.profit > 0)::INTEGER as wins,
    COUNT(*) FILTER (WHERE gp.profit < 0)::INTEGER as losses,
    CASE 
      WHEN COUNT(*) > 0 
      THEN (COUNT(*) FILTER (WHERE gp.profit > 0)::DECIMAL / COUNT(*)::DECIMAL * 100)
      ELSE 0 
    END as win_rate
  FROM game_players gp
  WHERE gp.player_id = p_player_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- MIGRACIÓN: Añadir columna rebuys si no existe
-- =============================================
-- Ejecuta esto si ya tienes la tabla game_players creada

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'game_players' AND column_name = 'rebuys'
  ) THEN
    ALTER TABLE game_players ADD COLUMN rebuys INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- =============================================
-- NOTAS SOBRE REBUYS
-- =============================================
-- 
-- Un rebuy es una compra adicional de fichas durante la partida.
-- 
-- Cálculo del profit con rebuys:
--   total_fichas_compradas = buy_in × (1 + rebuys)
--   profit = (fichas_finales - total_fichas_compradas) × valor_ficha
--
-- Ejemplo:
--   - Buy-in: 100 fichas × 0.05€ = 5€
--   - Rebuys: 2 (compra 200 fichas más = 10€)
--   - Total invertido: 300 fichas = 15€
--   - Fichas finales: 400
--   - Profit: (400 - 300) × 0.05€ = +5€
--
-- El bote total se calcula sumando todas las inversiones:
--   total_pot = Σ (buy_in × (1 + rebuys_jugador) × chip_value)

-- =============================================
-- MIGRACIÓN: Fotos de perfil y del perdedor
-- =============================================
-- Ejecuta esto para añadir soporte de fotos

-- Añadir avatar_url a players
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'players' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE players ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- Añadir loser_photo_url a games (foto del perdedor)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'games' AND column_name = 'loser_photo_url'
  ) THEN
    ALTER TABLE games ADD COLUMN loser_photo_url TEXT;
  END IF;
END $$;

-- =============================================
-- CONFIGURACIÓN DE SUPABASE STORAGE
-- =============================================
-- 
-- 1. Ve a Storage en el panel de Supabase
-- 2. Crea un bucket llamado "avatars" (público)
-- 3. Crea un bucket llamado "loser-photos" (público)
-- 4. Configura las políticas de acceso:

-- Política para bucket 'avatars' (ir a Storage > Policies):
-- Permite lectura pública y escritura pública
-- 
-- INSERT Policy:
--   Nombre: Allow public uploads
--   Target roles: anon, authenticated
--   USING expression: true
--   WITH CHECK expression: true
--
-- SELECT Policy:
--   Nombre: Allow public read
--   Target roles: anon, authenticated  
--   USING expression: true
--
-- UPDATE Policy:
--   Nombre: Allow public update
--   Target roles: anon, authenticated
--   USING expression: true
--   WITH CHECK expression: true
--
-- DELETE Policy:
--   Nombre: Allow public delete
--   Target roles: anon, authenticated
--   USING expression: true

-- Repetir las mismas políticas para 'loser-photos'
