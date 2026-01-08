-- Add NOT NULL constraint to avatar_color column
ALTER TABLE "public"."players" 
ALTER COLUMN "avatar_color" SET NOT NULL;