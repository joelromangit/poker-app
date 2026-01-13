-- Add NOT NULL constraints to columns that have defaults or are foreign keys
-- These columns should logically never be null

-- game_players: game_id and player_id are foreign keys and must always reference valid records
ALTER TABLE "public"."game_players"
ALTER COLUMN "game_id" SET NOT NULL;

ALTER TABLE "public"."game_players"
ALTER COLUMN "player_id" SET NOT NULL;

-- players: created_at has a default and should not be null
ALTER TABLE "public"."players"
ALTER COLUMN "created_at" SET NOT NULL;

-- players: is_active has a default and should not be null
ALTER TABLE "public"."players"
ALTER COLUMN "is_active" SET NOT NULL;

