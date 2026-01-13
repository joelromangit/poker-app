-- Function to get ranking evolution over weekly intervals
-- Returns player rankings based on cumulative balance at each week
CREATE OR REPLACE FUNCTION get_ranking_evolution()
RETURNS TABLE(
  week_start DATE,
  player_id UUID,
  player_name TEXT,
  avatar_color TEXT,
  cumulative_balance NUMERIC,
  rank INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH 
  -- Get the date range from first completed game to now
  date_range AS (
    SELECT 
      date_trunc('week', MIN(g.created_at))::date AS first_week,
      date_trunc('week', NOW())::date AS last_week
    FROM games g
    WHERE g.status = 'completed'
  ),
  -- Generate all weeks in the range
  weeks AS (
    SELECT generate_series(
      dr.first_week,
      dr.last_week,
      '1 week'::interval
    )::date AS week_start
    FROM date_range dr
  ),
  -- Get all active players
  active_players AS (
    SELECT p.id, p.name, p.avatar_color
    FROM players p
    WHERE p.is_active = true
  ),
  -- Cross join players with weeks to ensure all combinations exist
  player_weeks AS (
    SELECT 
      w.week_start,
      ap.id AS player_id,
      ap.name AS player_name,
      ap.avatar_color
    FROM weeks w
    CROSS JOIN active_players ap
  ),
  -- Calculate cumulative balance for each player at each week
  -- Sum all profits from games that occurred ON OR BEFORE the week's end (Saturday)
  cumulative_balances AS (
    SELECT 
      pw.week_start,
      pw.player_id,
      pw.player_name,
      pw.avatar_color,
      COALESCE(
        (
          SELECT SUM(gp.profit)
          FROM game_players gp
          INNER JOIN games g ON g.id = gp.game_id
          WHERE gp.player_id = pw.player_id
            AND g.status = 'completed'
            AND g.created_at::date <= (pw.week_start + INTERVAL '6 days')::date
        ),
        0
      ) AS cumulative_balance
    FROM player_weeks pw
  )
  -- Final result with rankings
  SELECT 
    cb.week_start,
    cb.player_id,
    cb.player_name,
    cb.avatar_color,
    cb.cumulative_balance,
    RANK() OVER (
      PARTITION BY cb.week_start 
      ORDER BY cb.cumulative_balance DESC
    )::INTEGER AS rank
  FROM cumulative_balances cb
  ORDER BY cb.week_start ASC, rank ASC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_ranking_evolution() TO anon;
GRANT EXECUTE ON FUNCTION get_ranking_evolution() TO authenticated;
GRANT EXECUTE ON FUNCTION get_ranking_evolution() TO service_role;

