-- Bote ganado y foto de la mesa en los all-ins (ambos opcionales)
ALTER TABLE all_ins ADD COLUMN IF NOT EXISTS pot_eur NUMERIC CHECK (pot_eur IS NULL OR pot_eur >= 0);
ALTER TABLE all_ins ADD COLUMN IF NOT EXISTS photo_url TEXT;

COMMENT ON COLUMN all_ins.pot_eur IS 'Bote total de la mano en € (incluye lo que ya había en la mesa)';
COMMENT ON COLUMN all_ins.photo_url IS 'Foto de la mesa en el momento del all-in';
