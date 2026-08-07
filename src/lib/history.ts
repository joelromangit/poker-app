import { BIG_BLIND_CHIPS, type PlayerHistory } from "./historyStats";
import { getAvatarColor } from "./players";
import { db } from "./supabase";

export * from "./historyStats";

// Obtener el histórico de resultados por partida de todos los jugadores activos
export async function getPlayersHistory(): Promise<PlayerHistory[]> {
  const { data, error } = await db.from("game_players").select(`
      profit,
      rebuys,
      game:games (id, name, created_at, chip_value),
      player:players (id, name, avatar_color, avatar_url, is_active)
    `);

  if (error || !data) {
    console.error("Error fetching players history:", error);
    return [];
  }

  const byPlayer = new Map<string, PlayerHistory>();

  for (const row of data) {
    const player = row.player;
    const game = row.game;
    if (!player || !game || !player.is_active) continue;

    let history = byPlayer.get(player.id);
    if (!history) {
      history = {
        player: {
          id: player.id,
          name: player.name,
          color: getAvatarColor(player.avatar_color),
          avatarUrl: player.avatar_url || undefined,
        },
        entries: [],
      };
      byPlayer.set(player.id, history);
    }

    history.entries.push({
      game: {
        id: game.id,
        name: game.name,
        date: game.created_at,
        bigBlind: (game.chip_value || 0) * BIG_BLIND_CHIPS,
      },
      profit: row.profit,
      rebuys: row.rebuys || 0,
    });
  }

  const histories = Array.from(byPlayer.values());
  for (const history of histories) {
    history.entries.sort(
      (a, b) =>
        new Date(a.game.date).getTime() - new Date(b.game.date).getTime(),
    );
  }
  histories.sort((a, b) => a.player.name.localeCompare(b.player.name));

  return histories;
}
