-- Create chip_sets table for storing custom chip configurations
CREATE TABLE IF NOT EXISTS chip_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    denominations JSONB NOT NULL DEFAULT '[]',
    is_preset BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comment to describe the denominations structure
COMMENT ON COLUMN chip_sets.denominations IS 'Array of {value: number, color: string, quantity: number, name?: string}';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_chip_sets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chip_sets_updated_at
    BEFORE UPDATE ON chip_sets
    FOR EACH ROW
    EXECUTE FUNCTION update_chip_sets_updated_at();

-- Insert default preset chip set (500 chips total)
INSERT INTO chip_sets (name, denominations, is_preset) VALUES
(
    'Estándar',
    '[
        {"value": 5, "color": "#EF4444", "quantity": 100, "name": "Roja"},
        {"value": 10, "color": "#1E3A8A", "quantity": 100, "name": "Azul Oscuro"},
        {"value": 25, "color": "#22C55E", "quantity": 75, "name": "Verde"},
        {"value": 50, "color": "#3B82F6", "quantity": 75, "name": "Azul Claro"},
        {"value": 100, "color": "#1F2937", "quantity": 75, "name": "Negra"},
        {"value": 500, "color": "#8B5CF6", "quantity": 50, "name": "Púrpura"},
        {"value": 1000, "color": "#FBBF24", "quantity": 25, "name": "Amarilla"}
    ]'::jsonb,
    true
);

-- Enable Row Level Security
ALTER TABLE chip_sets ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all chip sets
CREATE POLICY "Allow public read access to chip_sets"
    ON chip_sets
    FOR SELECT
    TO public
    USING (true);

-- Allow public insert for custom sets
CREATE POLICY "Allow public insert to chip_sets"
    ON chip_sets
    FOR INSERT
    TO public
    WITH CHECK (is_preset = false);

-- Allow public update for custom sets only
CREATE POLICY "Allow public update to custom chip_sets"
    ON chip_sets
    FOR UPDATE
    TO public
    USING (is_preset = false)
    WITH CHECK (is_preset = false);

-- Allow public delete for custom sets only
CREATE POLICY "Allow public delete to custom chip_sets"
    ON chip_sets
    FOR DELETE
    TO public
    USING (is_preset = false);

