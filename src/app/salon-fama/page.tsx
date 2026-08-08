"use client";

import { Calendar, Crown, Medal, Swords, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { AllInEntry } from "@/lib/allInStats";
import { getAllAllIns } from "@/lib/allIns";
import { getGamesSummary } from "@/lib/games";
import { getPlayersHistory, type PlayerHistory } from "@/lib/history";
import {
  computeAllInRecords,
  computeGroupRecords,
  computePlayerTitles,
  type GroupRecord,
} from "@/lib/records";
import type { GameSummary } from "@/types";

function RecordCard({
  record,
  playerByName,
  index,
}: {
  record: GroupRecord;
  playerByName: Map<string, PlayerHistory["player"]>;
  index: number;
}) {
  const holder = record.holder;
  const player = holder?.playerName
    ? playerByName.get(holder.playerName.toLowerCase())
    : undefined;

  return (
    <div
      className="bg-background-card rounded-2xl p-4 border border-border animate-fade-in"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl flex-shrink-0">{record.emoji}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground leading-tight">
            {record.title}
          </h3>
          <p className="text-xs text-foreground-muted mt-0.5">
            {record.description}
          </p>

          {holder ? (
            <div className="flex items-center gap-2 mt-3">
              {holder.playerName && (
                <>
                  {player?.avatarUrl ? (
                    <img
                      src={player.avatarUrl}
                      alt={holder.playerName}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: player?.color ?? "#10B981" }}
                    >
                      {holder.playerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground truncate">
                  {holder.playerName ?? holder.gameName ?? "Partida"}
                  {holder.rivalName && (
                    <span className="font-normal text-foreground-muted">
                      {" "}
                      vs {holder.rivalName}
                    </span>
                  )}
                </p>
                <p className="text-sm font-semibold text-accent">
                  {holder.value}
                </p>
                <p className="text-[11px] text-foreground-muted truncate">
                  {holder.detail ? `${holder.detail} · ` : ""}
                  {holder.gameId ? (
                    <Link
                      href={`/partida/${holder.gameId}`}
                      className="text-primary hover:underline"
                    >
                      {holder.gameName ||
                        (holder.date
                          ? new Date(holder.date).toLocaleDateString("es-ES")
                          : "ver partida")}
                    </Link>
                  ) : holder.date ? (
                    new Date(holder.date).toLocaleDateString("es-ES")
                  ) : null}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground-muted mt-3">
              Todavía sin dueño 👀
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function RecordsGrid({
  title,
  icon,
  records,
  playerByName,
}: {
  title: string;
  icon: React.ReactNode;
  records: GroupRecord[];
  playerByName: Map<string, PlayerHistory["player"]>;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {records.map((record, index) => (
          <RecordCard
            key={record.key}
            record={record}
            playerByName={playerByName}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}

export default function SalonFamaPage() {
  const [histories, setHistories] = useState<PlayerHistory[]>([]);
  const [games, setGames] = useState<GameSummary[]>([]);
  const [allIns, setAllIns] = useState<AllInEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [historiesData, gamesData, allInsData] = await Promise.all([
        getPlayersHistory(),
        getGamesSummary(),
        getAllAllIns(),
      ]);
      setHistories(historiesData);
      setGames(gamesData);
      setAllIns(allInsData);
      setLoading(false);
    }
    load();
  }, []);

  const playerByName = useMemo(
    () =>
      new Map(histories.map((h) => [h.player.name.toLowerCase(), h.player])),
    [histories],
  );
  const playerNameById = useMemo(
    () => new Map(histories.map((h) => [h.player.id, h.player.name])),
    [histories],
  );

  const groupRecords = useMemo(
    () => computeGroupRecords(histories, games),
    [histories, games],
  );
  const titles = useMemo(() => computePlayerTitles(histories), [histories]);
  const allInRecords = useMemo(
    () => computeAllInRecords(allIns, playerNameById),
    [allIns, playerNameById],
  );
  const hasAllInData = allInRecords.some((r) => r.holder !== null);

  return (
    <>
      <Header />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-1">
            <Trophy className="w-8 h-8 text-accent" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Salón de la Fama
            </h1>
          </div>
          <p className="text-foreground-muted mb-8">
            Los récords y títulos históricos del grupo. Se actualizan solos con
            cada partida.
          </p>

          {loading ? (
            <LoadingSpinner />
          ) : games.length === 0 ? (
            <div className="text-center py-16 text-foreground-muted">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Registra partidas para empezar a batir récords</p>
            </div>
          ) : (
            <>
              <RecordsGrid
                title="Récords de la historia"
                icon={<Medal className="w-5 h-5 text-accent" />}
                records={groupRecords}
                playerByName={playerByName}
              />
              <RecordsGrid
                title="Títulos del grupo"
                icon={<Crown className="w-5 h-5 text-accent" />}
                records={titles}
                playerByName={playerByName}
              />
              {hasAllInData && (
                <RecordsGrid
                  title="Récords de all-ins"
                  icon={<Swords className="w-5 h-5 text-danger" />}
                  records={allInRecords}
                  playerByName={playerByName}
                />
              )}
              <p className="text-xs text-foreground-muted text-center flex items-center justify-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Calculado sobre {games.length} partidas registradas
              </p>
            </>
          )}
        </div>
      </main>
    </>
  );
}
