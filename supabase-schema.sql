-- =============================================
-- POKER NIGHTS - Esquema de Base de Datos
-- =============================================
-- Ejecuta este SQL en el SQL Editor de Supabase
-- https://supabase.com/dashboard/project/TU_PROYECTO/sql

-- Crear tabla de partidas
CREATE TABLE IF NOT EXISTS games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  chip_value DECIMAL(10,4) NOT NULL,
  buy_in INTEGER NOT NULL,
  players JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_pot DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('active', 'completed'))
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS games_created_at_idx ON games(created_at DESC);
CREATE INDEX IF NOT EXISTS games_status_idx ON games(status);

-- Habilitar Row Level Security (RLS)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Política para permitir acceso público (sin autenticación)
-- En producción, querrías añadir autenticación
CREATE POLICY "Allow public access" ON games
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Función para obtener resumen de partidas
CREATE OR REPLACE FUNCTION get_games_summary()
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  player_count INTEGER,
  total_pot DECIMAL,
  top_winner TEXT,
  top_winner_profit DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.created_at,
    jsonb_array_length(g.players)::INTEGER as player_count,
    g.total_pot,
    (
      SELECT p->>'name' 
      FROM jsonb_array_elements(g.players) p 
      ORDER BY (p->>'profit')::DECIMAL DESC 
      LIMIT 1
    ) as top_winner,
    (
      SELECT (p->>'profit')::DECIMAL 
      FROM jsonb_array_elements(g.players) p 
      ORDER BY (p->>'profit')::DECIMAL DESC 
      LIMIT 1
    ) as top_winner_profit
  FROM games g
  ORDER BY g.created_at DESC;
END;
$$ LANGUAGE plpgsql;

