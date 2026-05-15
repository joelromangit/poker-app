-- Create user_preferences table for storing UI preferences (key/value JSONB)
CREATE TABLE IF NOT EXISTS user_preferences (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_preferences IS 'Stores UI preferences as key/value pairs (singleton per key).';
COMMENT ON COLUMN user_preferences.value IS 'Arbitrary JSON preference payload.';

CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_updated_at();

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to user_preferences"
    ON user_preferences
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public insert to user_preferences"
    ON user_preferences
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow public update to user_preferences"
    ON user_preferences
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);
