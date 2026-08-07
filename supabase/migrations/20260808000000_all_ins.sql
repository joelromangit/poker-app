-- Registro de all-ins dentro de una partida
CREATE TABLE all_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    -- Jugador que va all-in
    pusher_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    -- Jugador que paga (NULL = varios / la mesa)
    caller_id UUID REFERENCES players(id) ON DELETE SET NULL,
    -- Calle en la que se produce: preflop | flop | turn | river
    street TEXT NOT NULL DEFAULT 'preflop'
        CHECK (street IN ('preflop', 'flop', 'turn', 'river')),
    -- % de equity del que va all-in en el momento del call (0-100, NULL = desconocido)
    pusher_equity NUMERIC CHECK (pusher_equity >= 0 AND pusher_equity <= 100),
    run_it_twice BOOLEAN NOT NULL DEFAULT FALSE,
    -- Resultado para el que va all-in: won | lost | split (split = una y una en run it twice)
    result TEXT NOT NULL CHECK (result IN ('won', 'lost', 'split')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX all_ins_game_id_idx ON all_ins(game_id);

COMMENT ON TABLE all_ins IS 'All-ins registrados durante las partidas';
COMMENT ON COLUMN all_ins.pusher_equity IS '% de equity del pusher cuando se paga el all-in';

ALTER TABLE all_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access" ON all_ins USING (true) WITH CHECK (true);
