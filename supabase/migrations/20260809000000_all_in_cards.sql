-- Cartas de los all-ins: mano del que empuja, mano del que paga y board.
-- Formato compacto tipo "AsKd" (rango + palo por carta, T = 10).
ALTER TABLE all_ins ADD COLUMN IF NOT EXISTS pusher_cards TEXT;
ALTER TABLE all_ins ADD COLUMN IF NOT EXISTS caller_cards TEXT;
ALTER TABLE all_ins ADD COLUMN IF NOT EXISTS board_cards TEXT;

COMMENT ON COLUMN all_ins.pusher_cards IS 'Mano del que va all-in, p. ej. "AsKd"';
COMMENT ON COLUMN all_ins.caller_cards IS 'Mano del que paga, p. ej. "QhQc"';
COMMENT ON COLUMN all_ins.board_cards IS 'Cartas comunes al momento del all-in (3-5 según calle)';
