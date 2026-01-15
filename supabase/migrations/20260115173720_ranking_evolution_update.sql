-- Update ranking function to use ROW_NUMBER instead of RANK
-- This ensures deterministic ranking when players have the same balance
-- by using player_name as a tiebreaker
CREATE OR REPLACE FUNCTION get_ranking_evolution(interval_type TEXT DEFAULT 'month')
RETURNS TABLE(
  period_start DATE,
  player_id UUID,
  player_name TEXT,
  avatar_color TEXT,
  cumulative_balance NUMERIC,
  rank INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  period_interval INTERVAL;
BEGIN
  -- Set the interval based on parameter
  IF interval_type = 'year' THEN
    period_interval := '1 year'::INTERVAL;
  ELSE
    period_interval := '1 month'::INTERVAL;
  END IF;

  RETURN QUERY
  WITH 
  -- Get the date range from first completed game to now
  date_range AS (
    SELECT 
      date_trunc(interval_type, MIN(g.created_at))::date AS first_period,
      date_trunc(interval_type, NOW())::date AS last_period
    FROM games g
    WHERE g.status = 'completed'
  ),
  -- Generate all periods in the range
  periods AS (
    SELECT generate_series(
      dr.first_period,
      dr.last_period,
      period_interval
    )::date AS period_start
    FROM date_range dr
  ),
  -- Get all active players
  active_players AS (
    SELECT p.id, p.name, p.avatar_color
    FROM players p
    WHERE p.is_active = true
  ),
  -- Cross join players with periods to ensure all combinations exist
  player_periods AS (
    SELECT 
      per.period_start,
      ap.id AS player_id,
      ap.name AS player_name,
      ap.avatar_color
    FROM periods per
    CROSS JOIN active_players ap
  ),
  -- Calculate cumulative balance for each player at each period
  -- Sum all profits from games that occurred ON OR BEFORE the period's end
  cumulative_balances AS (
    SELECT 
      pp.period_start,
      pp.player_id,
      pp.player_name,
      pp.avatar_color,
      COALESCE(
        (
          SELECT SUM(gp.profit)
          FROM game_players gp
          INNER JOIN games g ON g.id = gp.game_id
          WHERE gp.player_id = pp.player_id
            AND g.status = 'completed'
            AND g.created_at::date < (pp.period_start + period_interval)::date
        ),
        0
      ) AS cumulative_balance
    FROM player_periods pp
  )
  -- Final result with rankings
  SELECT 
    cb.period_start,
    cb.player_id,
    cb.player_name,
    cb.avatar_color,
    cb.cumulative_balance,
    ROW_NUMBER() OVER (
      PARTITION BY cb.period_start 
      ORDER BY cb.cumulative_balance DESC, cb.player_name DESC
    )::INTEGER AS rank
  FROM cumulative_balances cb
  ORDER BY cb.period_start ASC, rank ASC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_ranking_evolution(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_ranking_evolution(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ranking_evolution(TEXT) TO service_role;

