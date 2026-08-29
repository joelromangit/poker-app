-- Ciegas configurables por partida (en fichas).
-- Default 5/10: es lo que asumía la app hasta ahora, así las partidas
-- antiguas de los presets 5€/10€ conservan sus BBs correctas.
ALTER TABLE games ADD COLUMN IF NOT EXISTS small_blind NUMERIC NOT NULL DEFAULT 5
    CHECK (small_blind > 0);
ALTER TABLE games ADD COLUMN IF NOT EXISTS big_blind NUMERIC NOT NULL DEFAULT 10
    CHECK (big_blind > 0);

COMMENT ON COLUMN games.small_blind IS 'Ciega pequeña en fichas';
COMMENT ON COLUMN games.big_blind IS 'Ciega grande en fichas (base de las stats en BB)';

-- Backfill: las partidas de 20€ (2000 fichas de entrada a 0.01€/ficha) se
-- jugaron con ciegas 0.10€/0.20€ = 10/20 fichas.
-- OJO: si se relanza esta migración tras editar ciegas a mano en alguna de
-- esas partidas, este UPDATE las volvería a poner a 10/20.
UPDATE games SET small_blind = 10, big_blind = 20
WHERE buy_in = 2000 AND chip_value = 0.01;
