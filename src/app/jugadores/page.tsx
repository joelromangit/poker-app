"use client";

import {
  ArrowUpDown,
  Calendar,
  Check,
  EyeOff,
  History,
  Loader2,
  Medal,
  Pencil,
  Plus,
  Rainbow,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import SegmentedButton from "@/components/SegmentedButton";
import { getGameYears } from "@/lib/games";
import {
  createPlayer,
  getAllPlayersStats,
  getAvatarColor,
  getPlayers,
} from "@/lib/players";
import {
  DEFAULT_PLAYERS_COLUMNS,
  getPlayersColumnsVisibility,
  getRankingHiddenPlayerIds,
  PLAYERS_COLUMNS_META,
  type PlayerColumnKey,
  type PlayersColumnsVisibility,
  savePlayersColumnsVisibility,
  saveRankingHiddenPlayerIds,
} from "@/lib/preferences";
import type { Player, PlayerStats } from "@/types";
import { EditPlayerModal, NewPlayerModal, WhosGayModal } from "./modals";
import RankingChart from "./RankingChart";

type SortBy = "balance" | "winrate";
type PeriodFilter = "all" | "custom" | number; // número = año concreto

export default function JugadoresPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [stats, setStats] = useState<Map<string, PlayerStats>>(new Map());
  const [loading, setLoading] = useState(true);

  // Modal crear jugador
  const [showNewPlayer, setShowNewPlayer] = useState(false);
  const [creating, setCreating] = useState(false);

  // Modal editar jugador
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const [error, setError] = useState("");

  // Orden del ranking
  const [sortBy, setSortBy] = useState<SortBy>("balance");

  // Filtro de periodo del ranking (todo, un año o rango personalizado)
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [filteringStats, setFilteringStats] = useState(false);

  // Visibilidad de columnas (persistida en DB)
  const [columnsVisibility, setColumnsVisibility] =
    useState<PlayersColumnsVisibility>(DEFAULT_PLAYERS_COLUMNS);

  // Jugadores excluidos del ranking (persistido en DB)
  const [hiddenPlayerIds, setHiddenPlayerIds] = useState<Set<string>>(
    () => new Set<string>(),
  );

  // Who's Gay modal
  const [showGayModal, setShowGayModal] = useState(false);

  // Rango de fechas efectivo según el filtro de periodo
  const effectiveRange = useMemo((): { from?: string; to?: string } => {
    if (periodFilter === "all") return {};
    if (periodFilter === "custom") {
      return { from: dateFrom || undefined, to: dateTo || undefined };
    }
    return { from: `${periodFilter}-01-01`, to: `${periodFilter}-12-31` };
  }, [periodFilter, dateFrom, dateTo]);

  // Referencia al rango actual para que loadData lo respete sin re-crearse
  const rangeRef = useRef(effectiveRange);
  rangeRef.current = effectiveRange;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const range = rangeRef.current;
      const [playersData, statsData, visibility, hiddenIds, years] =
        await Promise.all([
          getPlayers(),
          getAllPlayersStats(range.from, range.to),
          getPlayersColumnsVisibility(),
          getRankingHiddenPlayerIds(),
          getGameYears(),
        ]);
      setPlayers(playersData);
      setColumnsVisibility(visibility);
      setHiddenPlayerIds(new Set(hiddenIds));
      setAvailableYears(years);

      const statsMap = new Map<string, PlayerStats>();
      for (const s of statsData) {
        statsMap.set(s.player.id, s);
      }
      setStats(statsMap);
    } catch (err) {
      console.error("Error loading players:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recargar solo las estadísticas al cambiar el filtro de periodo
  const isFirstRange = useRef(true);
  useEffect(() => {
    if (isFirstRange.current) {
      isFirstRange.current = false;
      return;
    }
    let cancelled = false;
    async function reloadStats() {
      setFilteringStats(true);
      const statsData = await getAllPlayersStats(
        effectiveRange.from,
        effectiveRange.to,
      );
      if (cancelled) return;
      const statsMap = new Map<string, PlayerStats>();
      for (const s of statsData) {
        statsMap.set(s.player.id, s);
      }
      setStats(statsMap);
      setFilteringStats(false);
    }
    reloadStats();
    return () => {
      cancelled = true;
    };
  }, [effectiveRange]);

  const handleToggleColumn = useCallback((key: PlayerColumnKey) => {
    setColumnsVisibility((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      savePlayersColumnsVisibility(next);
      return next;
    });
  }, []);

  const handleTogglePlayerHidden = useCallback((playerId: string) => {
    setHiddenPlayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      saveRankingHiddenPlayerIds(Array.from(next));
      return next;
    });
  }, []);

  const handleCreatePlayer = async ({
    name,
    color,
  }: {
    name: string;
    color: string;
  }) => {
    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    setCreating(true);
    setError("");

    const player = await createPlayer({
      name: name.trim(),
      avatar_color: color,
    });

    if (player) {
      setPlayers((prev) =>
        [...prev, player].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setShowNewPlayer(false);
      loadData();
    } else {
      setError("Error al crear jugador. ¿Ya existe ese nombre?");
    }

    setCreating(false);
  };

  const openEditModal = (player: Player) => {
    setEditingPlayer(player);
    setError("");
  };

  const closeEditModal = () => {
    setEditingPlayer(null);
    setError("");
  };

  const closeNewPlayerModal = () => {
    setShowNewPlayer(false);
    setError("");
  };

  const getPlayerStats = (playerId: string) => stats.get(playerId);

  // Separar jugadores con y sin partidas
  const playersWithGames = players.filter((p) => {
    const playerStats = stats.get(p.id);
    return playerStats && playerStats.total_games > 0;
  });

  const playersWithoutGames = players.filter((p) => {
    const playerStats = stats.get(p.id);
    return !playerStats || playerStats.total_games === 0;
  });

  // Excluir del ranking los marcados como ocultos
  const rankedPlayers = playersWithGames.filter(
    (p) => !hiddenPlayerIds.has(p.id),
  );
  const hiddenPlayers = playersWithGames.filter((p) =>
    hiddenPlayerIds.has(p.id),
  );

  // Ordenar jugadores con partidas según el criterio seleccionado
  const sortedPlayersWithGames = [...rankedPlayers].sort((a, b) => {
    const statsA = stats.get(a.id);
    const statsB = stats.get(b.id);

    if (sortBy === "balance") {
      const balanceA = statsA?.total_balance || 0;
      const balanceB = statsB?.total_balance || 0;
      return balanceB - balanceA;
    } else {
      const winrateA = statsA?.win_rate || 0;
      const winrateB = statsB?.win_rate || 0;
      return winrateB - winrateA;
    }
  });

  // Ordenar jugadores ocultos alfabéticamente
  const sortedHiddenPlayers = [...hiddenPlayers].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  // Ordenar jugadores sin partidas alfabéticamente
  const sortedPlayersWithoutGames = [...playersWithoutGames].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  // Who's Gay? - Abrir modal
  const handleWhosGay = () => {
    if (players.length === 0) return;
    setShowGayModal(true);
  };

  const handleViewGames = (playerName: string) => {
    router.push(`/?jugador=${encodeURIComponent(playerName)}`);
  };

  return (
    <>
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="animate-fade-in">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <Medal className="w-8 h-8 text-accent" />
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Ranking de Jugadores
              </h1>
            </div>
            <p className="text-foreground-muted">
              {players.length} jugadores registrados
            </p>
          </div>

          {/* Barra de acciones */}
          {players.length > 0 && (
            <SortBar
              sortBy={sortBy}
              onSortChange={setSortBy}
              onWhosGay={handleWhosGay}
              onNewPlayer={() => setShowNewPlayer(true)}
              columnsVisibility={columnsVisibility}
              onToggleColumn={handleToggleColumn}
              playersWithGames={playersWithGames}
              hiddenPlayerIds={hiddenPlayerIds}
              onTogglePlayerHidden={handleTogglePlayerHidden}
            />
          )}

          {/* Filtro de periodo del ranking */}
          {players.length > 0 && (
            <div className="mb-6 p-4 bg-background-card rounded-xl border border-border">
              <div className="flex items-start gap-3 flex-wrap">
                <span className="text-xs text-foreground-muted font-medium pt-2 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Periodo
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 bg-background rounded-lg p-1 flex-wrap w-fit">
                    <SegmentedButton
                      active={periodFilter === "all"}
                      onClick={() => setPeriodFilter("all")}
                    >
                      Todo
                    </SegmentedButton>
                    {availableYears.map((year) => (
                      <SegmentedButton
                        key={year}
                        active={periodFilter === year}
                        onClick={() => setPeriodFilter(year)}
                      >
                        {year}
                      </SegmentedButton>
                    ))}
                    <SegmentedButton
                      active={periodFilter === "custom"}
                      onClick={() => setPeriodFilter("custom")}
                    >
                      Fechas
                    </SegmentedButton>
                  </div>
                  {periodFilter === "custom" && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-background border border-border text-foreground text-sm focus:border-primary outline-none"
                      />
                      <span className="text-foreground-muted text-sm">a</span>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-background border border-border text-foreground text-sm focus:border-primary outline-none"
                      />
                    </div>
                  )}
                  {periodFilter !== "all" && (
                    <p className="text-xs text-foreground-muted mt-2">
                      El ranking muestra solo las partidas del periodo elegido
                    </p>
                  )}
                </div>
                {filteringStats && (
                  <Loader2 className="w-4 h-4 animate-spin text-primary mt-2" />
                )}
              </div>
            </div>
          )}

          {/* Botón nuevo jugador cuando no hay jugadores */}
          {players.length === 0 && !loading && (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setShowNewPlayer(true)}
                className="btn-primary px-4 py-2 rounded-xl flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>Nuevo Jugador</span>
              </button>
            </div>
          )}

          {/* Modal crear jugador */}
          <NewPlayerModal
            isOpen={showNewPlayer}
            onClose={closeNewPlayerModal}
            onSubmit={(data) => handleCreatePlayer(data)}
            creating={creating}
            error={error}
          />

          {/* Modal editar jugador */}
          <EditPlayerModal
            player={editingPlayer}
            onClose={closeEditModal}
            onSave={loadData}
          />

          {/* Lista de jugadores */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No hay jugadores
              </h2>
              <p className="text-foreground-muted mb-6">
                Crea tu primer jugador para empezar
              </p>
              <button
                type="button"
                onClick={() => setShowNewPlayer(true)}
                className="btn-primary px-6 py-3 rounded-xl inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Crear Jugador
              </button>
            </div>
          ) : (
            <>
              {/* Ranking de jugadores con partidas */}
              <div
                className={`grid gap-3 transition-opacity ${filteringStats ? "opacity-60" : ""}`}
              >
                {sortedPlayersWithGames.map((player, index) => (
                  <PlayerRankingCard
                    key={player.id}
                    player={player}
                    stats={getPlayerStats(player.id)}
                    position={index + 1}
                    onEdit={openEditModal}
                    onViewGames={handleViewGames}
                    animationDelay={`${index * 0.05}s`}
                    columnsVisibility={columnsVisibility}
                  />
                ))}
              </div>

              {/* Sección de jugadores ocultos del ranking */}
              {sortedHiddenPlayers.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <EyeOff className="w-5 h-5 text-foreground-muted" />
                    <h2 className="text-lg font-semibold text-foreground-muted">
                      Excluidos del ranking
                    </h2>
                    <span className="text-sm text-foreground-muted bg-background px-2 py-0.5 rounded-full">
                      {sortedHiddenPlayers.length}
                    </span>
                  </div>
                  <div className="grid gap-2">
                    {sortedHiddenPlayers.map((player, index) => (
                      <HiddenPlayerCard
                        key={player.id}
                        player={player}
                        stats={getPlayerStats(player.id)}
                        onEdit={openEditModal}
                        onRestore={() => handleTogglePlayerHidden(player.id)}
                        animationDelay={`${(sortedPlayersWithGames.length + index) * 0.05}s`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sección de jugadores sin partidas */}
              {sortedPlayersWithoutGames.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-foreground-muted" />
                    <h2 className="text-lg font-semibold text-foreground-muted">
                      Jugadores sin partidas
                      {periodFilter !== "all" ? " en el periodo" : ""}
                    </h2>
                    <span className="text-sm text-foreground-muted bg-background px-2 py-0.5 rounded-full">
                      {sortedPlayersWithoutGames.length}
                    </span>
                  </div>
                  <div className="grid gap-2">
                    {sortedPlayersWithoutGames.map((player, index) => (
                      <PlayerWithoutGamesCard
                        key={player.id}
                        player={player}
                        onEdit={openEditModal}
                        animationDelay={`${(sortedPlayersWithGames.length + index) * 0.05}s`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Gráfico de evolución del ranking */}
              {playersWithGames.length > 0 && (
                <div className="mt-8">
                  <RankingChart hiddenPlayerIds={hiddenPlayerIds} />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Who's Gay Modal */}
      <WhosGayModal
        isOpen={showGayModal}
        onClose={() => setShowGayModal(false)}
        players={players}
      />
    </>
  );
}

function SortBar({
  sortBy,
  onSortChange,
  onWhosGay,
  onNewPlayer,
  columnsVisibility,
  onToggleColumn,
  playersWithGames,
  hiddenPlayerIds,
  onTogglePlayerHidden,
}: {
  sortBy: SortBy;
  onSortChange: (sort: SortBy) => void;
  onWhosGay: () => void;
  onNewPlayer: () => void;
  columnsVisibility: PlayersColumnsVisibility;
  onToggleColumn: (key: PlayerColumnKey) => void;
  playersWithGames: Player[];
  hiddenPlayerIds: Set<string>;
  onTogglePlayerHidden: (playerId: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 p-4 bg-background-card rounded-xl border border-border">
      {/* Botones de ordenación */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-foreground-muted flex items-center gap-1">
          <ArrowUpDown className="w-4 h-4" />
          Ordenar:
        </span>
        <button
          type="button"
          onClick={() => onSortChange("balance")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            sortBy === "balance"
              ? "bg-primary text-white"
              : "bg-background border border-border text-foreground-muted hover:text-foreground"
          }`}
        >
          💰 Balance
        </button>
        <button
          type="button"
          onClick={() => onSortChange("winrate")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            sortBy === "winrate"
              ? "bg-primary text-white"
              : "bg-background border border-border text-foreground-muted hover:text-foreground"
          }`}
        >
          🏆 % Victorias
        </button>
      </div>

      {/* Botones de acción */}
      <div className="flex items-center gap-2 flex-wrap">
        <ColumnsMenu
          columnsVisibility={columnsVisibility}
          onToggleColumn={onToggleColumn}
        />

        <PlayersFilterMenu
          playersWithGames={playersWithGames}
          hiddenPlayerIds={hiddenPlayerIds}
          onTogglePlayerHidden={onTogglePlayerHidden}
        />

        <button
          type="button"
          onClick={onWhosGay}
          className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity"
        >
          <Rainbow className="w-4 h-4" />
          <span>Who's Gay?</span>
        </button>

        <button
          type="button"
          onClick={onNewPlayer}
          className="btn-primary px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo</span>
        </button>
      </div>
    </div>
  );
}

function ColumnsMenu({
  columnsVisibility,
  onToggleColumn,
}: {
  columnsVisibility: PlayersColumnsVisibility;
  onToggleColumn: (key: PlayerColumnKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const visibleCount = PLAYERS_COLUMNS_META.reduce(
    (acc, { key }) => acc + (columnsVisibility[key] ? 1 : 0),
    0,
  );

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 bg-primary text-white font-medium hover:opacity-90 transition-opacity shadow-sm"
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span>Columnas</span>
        <span className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-white/20 text-xs font-semibold">
          {visibleCount}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] z-20 bg-background-card border border-border rounded-xl shadow-lg p-2 animate-fade-in"
        >
          <p className="text-xs font-semibold text-foreground-muted px-2 py-1.5 uppercase tracking-wide">
            Mostrar columnas
          </p>
          <div className="flex flex-col gap-0.5">
            {PLAYERS_COLUMNS_META.map(({ key, label }) => {
              const checked = columnsVisibility[key];
              return (
                <button
                  key={key}
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={checked}
                  onClick={() => onToggleColumn(key)}
                  className={`flex items-center justify-between gap-2 px-2.5 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                    checked
                      ? "bg-primary/15 text-foreground hover:bg-primary/25"
                      : "text-foreground-muted hover:bg-background hover:text-foreground"
                  }`}
                >
                  <span className="font-medium">{label}</span>
                  <span
                    className={`w-5 h-5 flex items-center justify-center rounded transition-colors flex-shrink-0 ${
                      checked
                        ? "bg-primary text-white"
                        : "bg-background border-2 border-foreground-muted/60"
                    }`}
                  >
                    {checked && (
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PlayersFilterMenu({
  playersWithGames,
  hiddenPlayerIds,
  onTogglePlayerHidden,
}: {
  playersWithGames: Player[];
  hiddenPlayerIds: Set<string>;
  onTogglePlayerHidden: (playerId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hiddenCount = playersWithGames.reduce(
    (acc, p) => acc + (hiddenPlayerIds.has(p.id) ? 1 : 0),
    0,
  );

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const sortedPlayers = [...playersWithGames].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 bg-primary text-white font-medium hover:opacity-90 transition-opacity shadow-sm"
      >
        <EyeOff className="w-4 h-4" />
        <span>Jugadores</span>
        {hiddenCount > 0 && (
          <span className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-white/20 text-xs font-semibold">
            {hiddenCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] max-h-[60vh] overflow-y-auto z-20 bg-background-card border border-border rounded-xl shadow-lg p-2 animate-fade-in"
        >
          <p className="text-xs font-semibold text-foreground-muted px-2 py-1.5 uppercase tracking-wide">
            Incluir en el ranking
          </p>
          {sortedPlayers.length === 0 ? (
            <p className="px-2 py-3 text-sm text-foreground-muted">
              No hay jugadores con partidas
            </p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {sortedPlayers.map((player) => {
                const included = !hiddenPlayerIds.has(player.id);
                return (
                  <button
                    key={player.id}
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={included}
                    onClick={() => onTogglePlayerHidden(player.id)}
                    className={`flex items-center justify-between gap-2 px-2.5 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                      included
                        ? "bg-primary/15 text-foreground hover:bg-primary/25"
                        : "text-foreground-muted hover:bg-background hover:text-foreground line-through decoration-foreground-muted/40"
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-full flex-shrink-0 border border-border transition-opacity ${
                          included ? "opacity-100" : "opacity-50"
                        }`}
                        style={{
                          backgroundColor: getAvatarColor(player.avatar_color),
                        }}
                      />
                      <span className="truncate font-medium">
                        {player.name}
                      </span>
                    </span>
                    <span
                      className={`w-5 h-5 flex items-center justify-center rounded transition-colors flex-shrink-0 ${
                        included
                          ? "bg-primary text-white"
                          : "bg-background border-2 border-foreground-muted/60"
                      }`}
                    >
                      {included && (
                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlayerRankingCard({
  player,
  stats,
  position,
  onEdit,
  onViewGames,
  animationDelay = "0s",
  columnsVisibility,
}: {
  player: Player;
  stats: PlayerStats | undefined;
  position: number;
  onEdit: (player: Player) => void;
  onViewGames: (playerName: string) => void;
  animationDelay?: string;
  columnsVisibility: PlayersColumnsVisibility;
}) {
  const balance = stats?.total_balance || 0;
  const isPositive = balance > 0;
  const isNegative = balance < 0;

  return (
    <div
      className={`bg-background-card rounded-2xl p-4 sm:p-5 border transition-all animate-slide-in ${
        position === 1
          ? "border-accent/50 bg-gradient-to-r from-accent/10 to-transparent"
          : position === 2
            ? "border-foreground-muted/30"
            : position === 3
              ? "border-warning/30"
              : "border-border hover:border-primary/30"
      }`}
      style={{ animationDelay }}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Posición del ranking */}
        <div
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-lg flex-shrink-0 ${
            position === 1
              ? "bg-accent/20 text-accent"
              : position === 2
                ? "bg-foreground-muted/20 text-foreground-muted"
                : position === 3
                  ? "bg-warning/20 text-warning"
                  : "bg-background text-foreground-muted"
          }`}
        >
          {position === 1
            ? "🥇"
            : position === 2
              ? "🥈"
              : position === 3
                ? "🥉"
                : position}
        </div>

        {/* Avatar con botón de editar */}
        <button
          type="button"
          onClick={() => onEdit(player)}
          className="relative group"
          title="Editar jugador"
        >
          {player.avatar_url ? (
            <img
              src={player.avatar_url}
              alt={player.name}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0 transition-opacity group-hover:opacity-70"
            />
          ) : (
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0 transition-opacity group-hover:opacity-70"
              style={{
                backgroundColor: getAvatarColor(player.avatar_color),
              }}
            >
              {player.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <Pencil className="w-4 h-4 text-white" />
          </div>
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">
            {player.name}
          </h3>
          {columnsVisibility.games && (
            <button
              type="button"
              onClick={() => onViewGames(player.name)}
              className="text-xs sm:text-sm text-foreground-muted hover:text-primary flex items-center gap-1 transition-colors"
            >
              <History className="w-3 h-3" />
              {stats?.total_games || 0} partidas
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Balance */}
          {columnsVisibility.balance && (
            <div className="text-right">
              <p className="text-xs text-foreground-muted mb-0.5 hidden sm:block">
                Balance
              </p>
              <p
                className={`text-base sm:text-lg font-bold flex items-center justify-end gap-1 ${
                  isPositive
                    ? "text-success"
                    : isNegative
                      ? "text-danger"
                      : "text-foreground-muted"
                }`}
              >
                {isPositive && <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />}
                {isNegative && (
                  <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
                {isPositive ? "+" : ""}
                {balance.toFixed(2)}€
              </p>
            </div>
          )}

          {/* Win rate */}
          {columnsVisibility.winrate && stats && stats.total_games > 0 && (
            <div className="text-right hidden sm:block">
              <p className="text-xs text-foreground-muted mb-0.5">Victorias</p>
              <p className="text-lg font-bold text-foreground flex items-center justify-end gap-1">
                <Trophy className="w-4 h-4 text-accent" />
                {stats.win_rate.toFixed(0)}%
              </p>
            </div>
          )}

          {/* Media */}
          {columnsVisibility.average && (
            <div className="text-right hidden sm:block">
              <p className="text-xs text-foreground-muted mb-0.5">Media</p>
              <p
                className={`text-lg font-bold ${
                  (stats?.average_per_game || 0) >= 0
                    ? "text-success"
                    : "text-danger"
                }`}
              >
                {(stats?.average_per_game || 0) >= 0 ? "+" : ""}
                {(stats?.average_per_game || 0).toFixed(2)}€
              </p>
            </div>
          )}

          {/* Mejor - Desktop */}
          {columnsVisibility.best && stats && stats.total_games > 0 && (
            <div className="text-right hidden sm:block">
              <p className="text-xs text-foreground-muted mb-0.5">Mejor</p>
              <p
                className={`text-lg font-bold ${
                  stats.best_game > 0 ? "text-success" : "text-danger"
                }`}
              >
                {stats.best_game > 0 ? "+" : ""}
                {stats.best_game.toFixed(2)}€
              </p>
            </div>
          )}

          {/* Peor - Desktop */}
          {columnsVisibility.worst && stats && stats.total_games > 0 && (
            <div className="text-right hidden sm:block">
              <p className="text-xs text-foreground-muted mb-0.5">Peor</p>
              <p
                className={`text-lg font-bold ${
                  stats.worst_game >= 0 ? "text-success" : "text-danger"
                }`}
              >
                {stats.worst_game > 0 ? "+" : ""}
                {stats.worst_game.toFixed(2)}€
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats expandidas en móvil */}
      {stats &&
        stats.total_games > 0 &&
        (columnsVisibility.winrate ||
          columnsVisibility.best ||
          columnsVisibility.worst) && (
          <div className="mt-3 pt-3 border-t border-border grid grid-cols-3 gap-3 sm:hidden">
            {columnsVisibility.winrate ? (
              <div className="text-center">
                <p className="text-xs text-foreground-muted">Victorias</p>
                <p className="font-bold text-foreground text-sm">
                  {stats.win_rate.toFixed(0)}%
                </p>
              </div>
            ) : (
              <div />
            )}
            {columnsVisibility.best ? (
              <div className="text-center">
                <p className="text-xs text-foreground-muted">Mejor</p>
                <p
                  className={`font-bold text-sm ${
                    stats.best_game > 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {stats.best_game > 0 ? "+" : ""}
                  {stats.best_game.toFixed(2)}€
                </p>
              </div>
            ) : (
              <div />
            )}
            {columnsVisibility.worst ? (
              <div className="text-center">
                <p className="text-xs text-foreground-muted">Peor</p>
                <p
                  className={`font-bold text-sm ${
                    stats.worst_game >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {stats.worst_game > 0 ? "+" : ""}
                  {stats.worst_game.toFixed(2)}€
                </p>
              </div>
            ) : (
              <div />
            )}
          </div>
        )}
    </div>
  );
}

function HiddenPlayerCard({
  player,
  stats,
  onEdit,
  onRestore,
  animationDelay = "0s",
}: {
  player: Player;
  stats: PlayerStats | undefined;
  onEdit: (player: Player) => void;
  onRestore: () => void;
  animationDelay?: string;
}) {
  return (
    <div
      className="bg-background-card rounded-xl p-3 sm:p-4 border border-border/50 opacity-70 transition-all hover:opacity-100 hover:border-primary/30 animate-slide-in"
      style={{ animationDelay }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onEdit(player)}
          className="relative group flex-shrink-0"
          title="Editar jugador"
        >
          {player.avatar_url ? (
            <img
              src={player.avatar_url}
              alt={player.name}
              className="w-10 h-10 rounded-full object-cover transition-opacity group-hover:opacity-70"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base transition-opacity group-hover:opacity-70"
              style={{
                backgroundColor: getAvatarColor(player.avatar_color),
              }}
            >
              {player.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <Pencil className="w-4 h-4 text-white" />
          </div>
        </button>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground truncate">
            {player.name}
          </h3>
          <p className="text-xs text-foreground-muted">
            {stats?.total_games || 0} partidas · oculto del ranking
          </p>
        </div>

        <button
          type="button"
          onClick={onRestore}
          className="px-3 py-1.5 rounded-lg text-xs sm:text-sm bg-primary text-white font-medium hover:opacity-90 transition-opacity flex-shrink-0"
        >
          Incluir
        </button>
      </div>
    </div>
  );
}

function PlayerWithoutGamesCard({
  player,
  onEdit,
  animationDelay = "0s",
}: {
  player: Player;
  onEdit: (player: Player) => void;
  animationDelay?: string;
}) {
  return (
    <div
      className="bg-background-card rounded-xl p-3 sm:p-4 border border-border/50 transition-all hover:border-primary/30 animate-slide-in"
      style={{ animationDelay }}
    >
      <div className="flex items-center gap-3">
        {/* Avatar con botón de editar */}
        <button
          type="button"
          onClick={() => onEdit(player)}
          className="relative group"
          title="Editar jugador"
        >
          {player.avatar_url ? (
            <img
              src={player.avatar_url}
              alt={player.name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0 transition-opacity group-hover:opacity-70"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0 transition-opacity group-hover:opacity-70"
              style={{
                backgroundColor: getAvatarColor(player.avatar_color),
              }}
            >
              {player.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <Pencil className="w-4 h-4 text-white" />
          </div>
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground truncate">
            {player.name}
          </h3>
          <p className="text-xs text-foreground-muted">
            Esperando su primera partida 🎲
          </p>
        </div>
      </div>
    </div>
  );
}
