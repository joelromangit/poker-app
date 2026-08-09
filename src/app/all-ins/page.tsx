"use client";

import { Flame, Repeat2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CardChip } from "@/components/CardPicker";
import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  type AllInEntry,
  BADGE_META,
  computeAllInStats,
  getAllInBadge,
  RESULT_META,
  STREET_META,
} from "@/lib/allInStats";
import { getAllAllIns } from "@/lib/allIns";
import { parseCards } from "@/lib/cards";
import { getGamesSummary } from "@/lib/games";
import { getPlayersHistory, type PlayerHistory } from "@/lib/history";
import type { GameSummary } from "@/types";

type PlayerInfo = PlayerHistory["player"];

function Avatar({
  player,
  name,
  size = "w-8 h-8 text-sm",
}: {
  player: PlayerInfo | undefined;
  name: string;
  size?: string;
}) {
  return player?.avatarUrl ? (
    <img
      src={player.avatarUrl}
      alt={name}
      className={`${size} rounded-full object-cover flex-shrink-0`}
    />
  ) : (
    <div
      className={`${size} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ backgroundColor: player?.color ?? "#10B981" }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function AllInsPage() {
  const [allIns, setAllIns] = useState<AllInEntry[]>([]);
  const [histories, setHistories] = useState<PlayerHistory[]>([]);
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [allInsData, historiesData, gamesData] = await Promise.all([
        getAllAllIns(),
        getPlayersHistory(),
        getGamesSummary(),
      ]);
      setAllIns(allInsData);
      setHistories(historiesData);
      setGames(gamesData);
      setLoading(false);
    }
    load();
  }, []);

  const playerById = useMemo(
    () => new Map(histories.map((h) => [h.player.id, h.player])),
    [histories],
  );
  const gameById = useMemo(
    () => new Map(games.map((g) => [g.id, g])),
    [games],
  );
  const playerName = (id: string | null) =>
    id ? (playerById.get(id)?.name ?? "?") : "varios";

  const stats = useMemo(() => computeAllInStats(allIns), [allIns]);
  const topPusherId =
    stats.length > 0 && stats[0].pushed > 0 ? stats[0].playerId : null;

  const totals = useMemo(() => {
    let badbeats = 0;
    let suckouts = 0;
    let coinflips = 0;
    for (const entry of allIns) {
      const badge = getAllInBadge(entry.equity, entry.result);
      if (badge === "badbeat") badbeats += 1;
      else if (badge === "suckout") suckouts += 1;
      else if (badge === "coinflip") coinflips += 1;
    }
    return { badbeats, suckouts, coinflips };
  }, [allIns]);

  // Top botes ganados con all-in
  const topPots = useMemo(
    () =>
      allIns
        .filter((e) => e.result !== "lost" && e.potEur != null && e.potEur > 0)
        .sort((a, b) => (b.potEur ?? 0) - (a.potEur ?? 0))
        .slice(0, 5),
    [allIns],
  );

  // Timeline agrupado por partida (más recientes primero)
  const byGame = useMemo(() => {
    const groups = new Map<string, AllInEntry[]>();
    for (const entry of allIns) {
      const key = entry.gameId ?? "unknown";
      const group = groups.get(key);
      if (group) group.push(entry);
      else groups.set(key, [entry]);
    }
    return Array.from(groups.entries()).sort((a, b) => {
      const dateA = gameById.get(a[0])?.created_at ?? a[1][0]?.at ?? "";
      const dateB = gameById.get(b[0])?.created_at ?? b[1][0]?.at ?? "";
      return dateB.localeCompare(dateA);
    });
  }, [allIns, gameById]);

  return (
    <>
      <Header />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-1">
            <Flame className="w-8 h-8 text-danger" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              All-ins del grupo
            </h1>
          </div>
          <p className="text-foreground-muted mb-6">
            Todas las jugadas a vida o muerte, con sus cartas, botes y
            estadísticas.
          </p>

          {loading ? (
            <LoadingSpinner />
          ) : allIns.length === 0 ? (
            <div className="text-center py-16 text-foreground-muted">
              <p className="text-4xl mb-3">🚀</p>
              <p className="font-medium">Todavía no hay all-ins registrados</p>
              <p className="text-sm mt-1">
                Regístralos durante la partida en la sección All-ins
              </p>
            </div>
          ) : (
            <>
              {/* Contadores globales */}
              <div className="flex items-center gap-2 flex-wrap mb-6">
                <span className="text-sm px-3 py-1.5 rounded-full bg-background-card border border-border text-foreground font-medium">
                  🚀 {allIns.length} all-in{allIns.length !== 1 ? "s" : ""}
                </span>
                {totals.badbeats > 0 && (
                  <span className="text-sm px-3 py-1.5 rounded-full bg-danger/15 text-danger font-medium">
                    😭 {totals.badbeats} bad beat
                    {totals.badbeats !== 1 ? "s" : ""}
                  </span>
                )}
                {totals.suckouts > 0 && (
                  <span className="text-sm px-3 py-1.5 rounded-full bg-success/15 text-success font-medium">
                    🍀 {totals.suckouts} suckout
                    {totals.suckouts !== 1 ? "s" : ""}
                  </span>
                )}
                {totals.coinflips > 0 && (
                  <span className="text-sm px-3 py-1.5 rounded-full bg-accent/15 text-accent font-medium">
                    🪙 {totals.coinflips} coinflip
                    {totals.coinflips !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Clasificación all-inera */}
              <section className="mb-6">
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  Clasificación all-inera
                </h2>
                <div className="space-y-2">
                  {stats
                    .filter((s) => s.pushed > 0 || s.called > 0)
                    .map((s) => {
                      const player = playerById.get(s.playerId);
                      const isKing =
                        s.playerId === topPusherId && s.pushed >= 2;
                      return (
                        <div
                          key={s.playerId}
                          className="flex items-center gap-2.5 p-3 bg-background-card rounded-xl border border-border"
                        >
                          <Avatar
                            player={player}
                            name={player?.name ?? "?"}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {player?.name ?? "?"}
                              {isKing && (
                                <span
                                  className="ml-1"
                                  title="Rey del All-in histórico"
                                >
                                  👑
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-foreground-muted">
                              {s.pushed} all-in{s.pushed !== 1 ? "s" : ""} ·{" "}
                              {s.won}G {s.lost}P
                              {s.split > 0 ? ` ${s.split}🤝` : ""}
                              {s.called > 0 ? ` · pagó ${s.called}` : ""}
                              {s.badbeats > 0
                                ? ` · ${s.badbeats}😭`
                                : ""}
                              {s.suckouts > 0 ? ` · ${s.suckouts}🍀` : ""}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {s.pushed > 0 && (
                              <p className="text-sm font-bold text-foreground">
                                {s.winRate.toFixed(0)}%
                                <span className="text-[10px] font-normal text-foreground-muted">
                                  {" "}
                                  ganados
                                </span>
                              </p>
                            )}
                            {s.avgEquity !== null && (
                              <p className="text-[11px] text-foreground-muted">
                                equity media {s.avgEquity.toFixed(0)}%
                              </p>
                            )}
                            {s.luck !== null && (
                              <p
                                className={`text-[11px] font-semibold ${
                                  s.luck > 10
                                    ? "text-success"
                                    : s.luck < -10
                                      ? "text-danger"
                                      : "text-foreground-muted"
                                }`}
                              >
                                {s.luck > 10 ? "🍀" : s.luck < -10 ? "🧂" : "😐"}{" "}
                                suerte {s.luck > 0 ? "+" : ""}
                                {s.luck.toFixed(0)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </section>

              {/* Top botes */}
              {topPots.length > 0 && (
                <section className="mb-6">
                  <h2 className="text-lg font-semibold text-foreground mb-3">
                    💰 Mayores botes ganados en all-in
                  </h2>
                  <div className="space-y-2">
                    {topPots.map((entry, index) => {
                      const game = entry.gameId
                        ? gameById.get(entry.gameId)
                        : undefined;
                      return (
                        <div
                          key={entry.id ?? `${entry.at}-${index}`}
                          className="flex items-center gap-3 p-3 bg-background-card rounded-xl border border-border"
                        >
                          <span className="text-lg font-bold text-accent w-8 text-center flex-shrink-0">
                            {index + 1}º
                          </span>
                          <Avatar
                            player={playerById.get(entry.pusherId)}
                            name={playerName(entry.pusherId)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {playerName(entry.pusherId)}
                              <span className="text-foreground-muted font-normal">
                                {" "}
                                vs {playerName(entry.callerId)}
                              </span>
                            </p>
                            <p className="text-[11px] text-foreground-muted truncate">
                              {entry.gameId ? (
                                <Link
                                  href={`/partida/${entry.gameId}`}
                                  className="text-primary hover:underline"
                                >
                                  {game?.name ||
                                    new Date(entry.at).toLocaleDateString(
                                      "es-ES",
                                    )}
                                </Link>
                              ) : (
                                new Date(entry.at).toLocaleDateString("es-ES")
                              )}
                            </p>
                          </div>
                          <span className="text-base font-bold text-accent flex-shrink-0">
                            {(entry.potEur ?? 0).toFixed(2)}€
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Timeline por partida */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  Historial completo
                </h2>
                <div className="space-y-5">
                  {byGame.map(([gameId, entries]) => {
                    const game = gameById.get(gameId);
                    const date = game?.created_at ?? entries[0]?.at;
                    return (
                      <div key={gameId}>
                        <Link
                          href={
                            gameId !== "unknown" ? `/partida/${gameId}` : "#"
                          }
                          className="text-sm font-semibold text-primary hover:underline"
                        >
                          {game?.name ||
                            (date
                              ? new Date(date).toLocaleDateString("es-ES", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })
                              : "Partida")}
                        </Link>
                        <div className="mt-2 space-y-2">
                          {[...entries].reverse().map((entry, index) => {
                            const badge = getAllInBadge(
                              entry.equity,
                              entry.result,
                            );
                            const street = STREET_META[entry.street];
                            const result = RESULT_META[entry.result];
                            const pusherCards = parseCards(entry.pusherCards);
                            const callerCards = parseCards(entry.callerCards);
                            const boardCards = parseCards(entry.boardCards);
                            return (
                              <div
                                key={entry.id ?? `${entry.at}-${index}`}
                                className="p-3 bg-background-card rounded-xl border border-border"
                              >
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Avatar
                                    player={playerById.get(entry.pusherId)}
                                    name={playerName(entry.pusherId)}
                                    size="w-6 h-6 text-xs"
                                  />
                                  <span className="text-sm font-semibold text-foreground">
                                    {playerName(entry.pusherId)}
                                  </span>
                                  <span className="text-xs text-foreground-muted">
                                    🚀 vs {playerName(entry.callerId)}
                                  </span>
                                  <span
                                    className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
                                      entry.result === "won"
                                        ? "bg-success/15 text-success"
                                        : entry.result === "lost"
                                          ? "bg-danger/15 text-danger"
                                          : "bg-accent/15 text-accent"
                                    }`}
                                  >
                                    {result.emoji} {result.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-background-secondary text-foreground-muted font-medium">
                                    {street.emoji} {street.label}
                                  </span>
                                  {entry.runItTwice && (
                                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium flex items-center gap-0.5">
                                      <Repeat2 className="w-3 h-3" />
                                      RIT
                                    </span>
                                  )}
                                  {entry.potEur != null &&
                                    entry.potEur > 0 && (
                                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-accent/15 text-accent font-bold">
                                        💰 {entry.potEur.toFixed(2)}€
                                      </span>
                                    )}
                                  {badge && (
                                    <span
                                      className={`text-[11px] px-1.5 py-0.5 rounded font-bold ${BADGE_META[badge].className}`}
                                    >
                                      {BADGE_META[badge].emoji}{" "}
                                      {BADGE_META[badge].label}
                                    </span>
                                  )}
                                  {entry.equity !== null && (
                                    <span className="text-[11px] text-foreground-muted ml-auto">
                                      {entry.equity.toFixed(0)}% al call
                                    </span>
                                  )}
                                </div>
                                {pusherCards.length > 0 && (
                                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                                    {pusherCards.map((card) => (
                                      <CardChip
                                        key={card}
                                        card={card}
                                        size="sm"
                                      />
                                    ))}
                                    {callerCards.length > 0 && (
                                      <>
                                        <span className="text-[10px] text-foreground-muted mx-0.5">
                                          vs
                                        </span>
                                        {callerCards.map((card) => (
                                          <CardChip
                                            key={card}
                                            card={card}
                                            size="sm"
                                          />
                                        ))}
                                      </>
                                    )}
                                    {boardCards.length > 0 && (
                                      <>
                                        <span className="text-[10px] text-foreground-muted ml-1.5 mr-0.5">
                                          board
                                        </span>
                                        {boardCards.map((card) => (
                                          <CardChip
                                            key={card}
                                            card={card}
                                            size="sm"
                                          />
                                        ))}
                                      </>
                                    )}
                                  </div>
                                )}
                                {entry.photoUrl && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      entry.photoUrl &&
                                      window.open(entry.photoUrl, "_blank")
                                    }
                                    className="mt-2 block"
                                  >
                                    <img
                                      src={entry.photoUrl}
                                      alt="Mesa en el all-in"
                                      className="h-20 rounded-lg border border-border object-cover"
                                    />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}
