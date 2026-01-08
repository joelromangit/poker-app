


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."get_games_summary"() RETURNS TABLE("id" "uuid", "created_at" timestamp with time zone, "player_count" integer, "total_pot" numeric, "top_winner" "text", "top_winner_profit" numeric)
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."get_games_summary"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."game_players" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "game_id" "uuid",
    "player_id" "uuid",
    "initial_chips" integer NOT NULL,
    "final_chips" integer NOT NULL,
    "profit" numeric(10,2) NOT NULL,
    "rebuys" numeric(10,2) DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."game_players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."games" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "chip_value" numeric(10,4) NOT NULL,
    "buy_in" integer NOT NULL,
    "players" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "total_pot" numeric(10,2) DEFAULT 0 NOT NULL,
    "notes" "text",
    "status" "text" DEFAULT 'completed'::"text" NOT NULL,
    "loser_photo_url" "text",
    "name" "text",
    CONSTRAINT "games_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."games" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."players" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "name" "text" NOT NULL,
    "avatar_color" "text" DEFAULT '#10B981'::"text",
    "is_active" boolean DEFAULT true,
    "avatar_url" "text"
);


ALTER TABLE "public"."players" OWNER TO "postgres";


ALTER TABLE ONLY "public"."game_players"
    ADD CONSTRAINT "game_players_game_id_player_id_key" UNIQUE ("game_id", "player_id");



ALTER TABLE ONLY "public"."game_players"
    ADD CONSTRAINT "game_players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_pkey" PRIMARY KEY ("id");



CREATE INDEX "games_created_at_idx" ON "public"."games" USING "btree" ("created_at" DESC);



CREATE INDEX "games_status_idx" ON "public"."games" USING "btree" ("status");



ALTER TABLE ONLY "public"."game_players"
    ADD CONSTRAINT "game_players_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."game_players"
    ADD CONSTRAINT "game_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE RESTRICT;



CREATE POLICY "Allow public access" ON "public"."games" USING (true) WITH CHECK (true);



ALTER TABLE "public"."games" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."get_games_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_games_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_games_summary"() TO "service_role";


















GRANT ALL ON TABLE "public"."game_players" TO "anon";
GRANT ALL ON TABLE "public"."game_players" TO "authenticated";
GRANT ALL ON TABLE "public"."game_players" TO "service_role";



GRANT ALL ON TABLE "public"."games" TO "anon";
GRANT ALL ON TABLE "public"."games" TO "authenticated";
GRANT ALL ON TABLE "public"."games" TO "service_role";



GRANT ALL ON TABLE "public"."players" TO "anon";
GRANT ALL ON TABLE "public"."players" TO "authenticated";
GRANT ALL ON TABLE "public"."players" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";


  create policy "Allow public delete avatars"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'avatars'::text));



  create policy "Allow public delete loser-photos"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'loser-photos'::text));



  create policy "Allow public read avatars"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "Allow public read loser-photos"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'loser-photos'::text));



  create policy "Allow public update avatars"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'avatars'::text))
with check ((bucket_id = 'avatars'::text));



  create policy "Allow public update loser-photos"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'loser-photos'::text))
with check ((bucket_id = 'loser-photos'::text));



  create policy "Allow public upload avatars"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'avatars'::text));



  create policy "Allow public upload loser-photos"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'loser-photos'::text));



  create policy "Public read avatars"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "Public read loser-photos"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'loser-photos'::text));



