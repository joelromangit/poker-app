"use client";

import { Flame, Plus, Repeat2, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  type AllInEntry,
  type AllInResult,
  BADGE_META,
  computeAllInStats,
  getAllInBadge,
  RESULT_META,
  STREET_META,
  type Street,
} from "@/lib/allInStats";

// Jugador disponible para registrar all-ins
export interface AllInPlayer {
  id: string;
  name: string;
  color: string;
  avatarUrl?: string;
}

interface AllInSectionProps {
  players: AllInPlayer[];
  entries: AllInEntry[];
  onAdd: (entry: AllInEntry) => void | Promise<void>;
  onDelete: (entry: AllInEntry, index: number) => void | Promise<void>;
  subtitle?: string;
}

const STREETS: Street[] = ["preflop", "flop", "turn", "river"];
const EQUITY_PRESETS = [20, 35, 50, 65, 80];

function PlayerAvatar({
  player,
  size = "w-6 h-6 text-xs",
}: {
  player: AllInPlayer | undefined;
  size?: string;
}) {
  if (!player) return null;
  return player.avatarUrl ? (
    <img
      src={player.avatarUrl}
      alt={player.name}
      className={`${size} rounded-full object-cover flex-shrink-0`}
    />
  ) : (
    <div
      className={`${size} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ backgroundColor: player.color }}
    >
      {player.name.charAt(0).toUpperCase()}
    </div>
  );
}

// Chip seleccionable de jugador para el formulario
function PlayerChip({
  player,
  selected,
  onClick,
}: {
  player: AllInPlayer;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 pl-1.5 pr-2.5 py-1.5 rounded-full border-2 transition-all ${
        selected
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary/50"
      }`}
    >
      <PlayerAvatar player={player} />
      <span
        className={`text-sm font-medium ${selected ? "text-foreground" : "text-foreground-muted"}`}
      >
        {player.name}
      </span>
    </button>
  );
}

export default function AllInSection({
  players,
  entries,
  onAdd,
  onDelete,
  subtitle,
}: AllInSectionProps) {
  const [showForm, setShowForm] = useState(false);

  const playerById = useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players],
  );

  const stats = useMemo(() => computeAllInStats(entries), [entries]);
  const topPusherId =
    stats.length > 0 && stats[0].pushed > 0 ? stats[0].playerId : null;

  const totals = useMemo(() => {
    let badbeats = 0;
    let suckouts = 0;
    let coinflips = 0;
    for (const entry of entries) {
      const badge = getAllInBadge(entry.equity, entry.result);
      if (badge === "badbeat") badbeats += 1;
      else if (badge === "suckout") suckouts += 1;
      else if (badge === "coinflip") coinflips += 1;
    }
    return { badbeats, suckouts, coinflips };
  }, [entries]);

  // Más recientes primero: durante la partida lo último es lo relevante
  const timeline = useMemo(() => [...entries].reverse(), [entries]);

  return (
    <section className="bg-background-card rounded-2xl border border-border overflow-hidden">
      <div className="p-4 sm:p-5 bg-gradient-to-r from-danger/10 to-accent/10">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Flame className="w-5 h-5 text-danger" />
              All-ins
              {entries.length > 0 && (
                <span className="text-sm font-normal text-foreground-muted">
                  ({entries.length})
                </span>
              )}
            </h2>
            {subtitle && (
              <p className="text-xs text-foreground-muted mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="btn-primary px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            All-in
          </button>
        </div>

        {/* Contadores de momentos dramáticos */}
        {(totals.badbeats > 0 ||
          totals.suckouts > 0 ||
          totals.coinflips > 0) && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {totals.badbeats > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-danger/15 text-danger font-medium">
                😭 {totals.badbeats} bad beat{totals.badbeats !== 1 ? "s" : ""}
              </span>
            )}
            {totals.suckouts > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-success/15 text-success font-medium">
                🍀 {totals.suckouts} suckout{totals.suckouts !== 1 ? "s" : ""}
              </span>
            )}
            {totals.coinflips > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-accent/15 text-accent font-medium">
                🪙 {totals.coinflips} coinflip
                {totals.coinflips !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="p-6 text-center text-foreground-muted">
          <p className="text-3xl mb-2">🚀</p>
          <p className="text-sm">
            Todavía no hay all-ins. Cuando alguien lo suelte todo, registralo
            aquí.
          </p>
        </div>
      ) : (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Estadísticas por jugador */}
          <div className="space-y-2">
            {stats
              .filter((s) => s.pushed > 0 || s.called > 0)
              .map((s) => {
                const player = playerById.get(s.playerId);
                if (!player) return null;
                const isKing = s.playerId === topPusherId && s.pushed >= 2;
                return (
                  <div
                    key={s.playerId}
                    className="flex items-center gap-2.5 p-2.5 bg-background rounded-xl border border-border"
                  >
                    <PlayerAvatar player={player} size="w-8 h-8 text-sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {player.name}
                        {isKing && (
                          <span
                            className="ml-1"
                            title="Rey del All-in (más all-ins de la partida)"
                          >
                            👑
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-foreground-muted">
                        {s.pushed} all-in{s.pushed !== 1 ? "s" : ""} · {s.won}G{" "}
                        {s.lost}P{s.split > 0 ? ` ${s.split}🤝` : ""}
                        {s.called > 0 ? ` · pagó ${s.called}` : ""}
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
                      {s.luck !== null && (
                        <p
                          className={`text-[11px] font-semibold ${
                            s.luck > 10
                              ? "text-success"
                              : s.luck < -10
                                ? "text-danger"
                                : "text-foreground-muted"
                          }`}
                          title="Diferencia entre % ganados y equity media: positivo = corre bien"
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

          {/* Timeline de all-ins */}
          <div className="space-y-2">
            {timeline.map((entry, reversedIndex) => {
              const index = entries.length - 1 - reversedIndex;
              const pusher = playerById.get(entry.pusherId);
              const caller = entry.callerId
                ? playerById.get(entry.callerId)
                : undefined;
              const badge = getAllInBadge(entry.equity, entry.result);
              const street = STREET_META[entry.street];
              const result = RESULT_META[entry.result];
              return (
                <div
                  key={entry.id ?? `${entry.at}-${index}`}
                  className="p-3 bg-background rounded-xl border border-border"
                >
                  <div className="flex items-center gap-2">
                    {/* Protagonistas */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <PlayerAvatar player={pusher} />
                        <span className="text-sm font-semibold text-foreground">
                          {pusher?.name ?? "?"}
                        </span>
                        <span className="text-xs text-foreground-muted">
                          🚀 vs
                        </span>
                        {caller ? (
                          <>
                            <PlayerAvatar player={caller} />
                            <span className="text-sm font-medium text-foreground">
                              {caller.name}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-foreground-muted">
                            varios
                          </span>
                        )}
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
                        {badge && (
                          <span
                            className={`text-[11px] px-1.5 py-0.5 rounded font-bold ${BADGE_META[badge].className}`}
                          >
                            {BADGE_META[badge].emoji} {BADGE_META[badge].label}
                          </span>
                        )}
                        <span className="text-[11px] text-foreground-muted ml-auto">
                          {new Date(entry.at).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {/* Barra de equity */}
                      {entry.equity !== null && (
                        <div className="mt-2">
                          <div className="flex justify-between text-[10px] text-foreground-muted mb-0.5">
                            <span>
                              {pusher?.name}: {entry.equity.toFixed(0)}%
                            </span>
                            <span>
                              {caller?.name ?? "rival"}:{" "}
                              {(100 - entry.equity).toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-danger/40 overflow-hidden">
                            <div
                              className="h-full bg-success rounded-full"
                              style={{ width: `${entry.equity}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Resultado + borrar */}
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full ${
                          entry.result === "won"
                            ? "bg-success/15 text-success"
                            : entry.result === "lost"
                              ? "bg-danger/15 text-danger"
                              : "bg-accent/15 text-accent"
                        }`}
                      >
                        {result.emoji} {result.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDelete(entry, index)}
                        className="p-1 text-foreground-muted hover:text-danger transition-colors"
                        title="Eliminar all-in"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showForm && (
        <AllInForm
          players={players}
          onClose={() => setShowForm(false)}
          onSave={async (entry) => {
            await onAdd(entry);
            setShowForm(false);
          }}
        />
      )}
    </section>
  );
}

// Formulario de registro de all-in (bottom sheet en móvil)
function AllInForm({
  players,
  onClose,
  onSave,
}: {
  players: AllInPlayer[];
  onClose: () => void;
  onSave: (entry: AllInEntry) => void | Promise<void>;
}) {
  const [pusherId, setPusherId] = useState<string | null>(null);
  const [callerId, setCallerId] = useState<string | null>(null);
  const [callerIsMulti, setCallerIsMulti] = useState(false);
  const [street, setStreet] = useState<Street>("preflop");
  const [equity, setEquity] = useState(50);
  const [equityUnknown, setEquityUnknown] = useState(false);
  const [runItTwice, setRunItTwice] = useState(false);
  const [result, setResult] = useState<AllInResult | null>(null);
  const [saving, setSaving] = useState(false);

  const canSave = pusherId !== null && result !== null && !saving;

  const handleSave = async () => {
    if (!pusherId || !result) return;
    setSaving(true);
    await onSave({
      pusherId,
      callerId: callerIsMulti ? null : callerId,
      street,
      equity: equityUnknown ? null : equity,
      runItTwice,
      result,
      at: new Date().toISOString(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-background-card border border-border rounded-t-2xl sm:rounded-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-background-card border-b border-border p-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            🚀 Registrar all-in
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -m-1 text-foreground-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Quién va all-in */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">
              ¿Quién va all-in? 🚀
            </p>
            <div className="flex flex-wrap gap-2">
              {players.map((player) => (
                <PlayerChip
                  key={player.id}
                  player={player}
                  selected={pusherId === player.id}
                  onClick={() => {
                    setPusherId(player.id);
                    if (callerId === player.id) setCallerId(null);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Quién paga */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">
              ¿Quién lo paga? 💰
            </p>
            <div className="flex flex-wrap gap-2">
              {players
                .filter((p) => p.id !== pusherId)
                .map((player) => (
                  <PlayerChip
                    key={player.id}
                    player={player}
                    selected={!callerIsMulti && callerId === player.id}
                    onClick={() => {
                      setCallerId(player.id);
                      setCallerIsMulti(false);
                    }}
                  />
                ))}
              <button
                type="button"
                onClick={() => {
                  setCallerIsMulti(true);
                  setCallerId(null);
                }}
                className={`px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-all ${
                  callerIsMulti
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-foreground-muted hover:border-primary/50"
                }`}
              >
                Varios 👥
              </button>
            </div>
          </div>

          {/* Calle */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">
              ¿En qué calle?
            </p>
            <div className="grid grid-cols-4 gap-2">
              {STREETS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStreet(s)}
                  className={`py-2 rounded-xl border-2 text-center transition-all ${
                    street === s
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="block text-base leading-none mb-1">
                    {STREET_META[s].emoji}
                  </span>
                  <span
                    className={`text-[11px] font-medium ${
                      street === s ? "text-foreground" : "text-foreground-muted"
                    }`}
                  >
                    {STREET_META[s].label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Equity al momento del call */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-foreground">
                % del que va all-in al ver el call
              </p>
              <button
                type="button"
                onClick={() => setEquityUnknown(!equityUnknown)}
                className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                  equityUnknown
                    ? "bg-primary/15 border-primary text-primary"
                    : "border-border text-foreground-muted"
                }`}
              >
                No lo sé 🤷
              </button>
            </div>
            {!equityUnknown && (
              <>
                <p className="text-center text-2xl font-bold text-foreground mb-1">
                  <span
                    className={equity >= 50 ? "text-success" : "text-danger"}
                  >
                    {equity}%
                  </span>
                  <span className="text-sm font-medium text-foreground-muted">
                    {" "}
                    vs {100 - equity}%
                  </span>
                </p>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={equity}
                  onChange={(e) => setEquity(parseInt(e.target.value, 10))}
                  className="w-full accent-[var(--primary)]"
                />
                <div className="flex justify-between gap-1 mt-2">
                  {EQUITY_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEquity(preset)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        equity === preset
                          ? "bg-primary text-white border-primary"
                          : "bg-background border-border text-foreground-muted hover:text-foreground"
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Run it twice */}
          <button
            type="button"
            onClick={() => {
              const next = !runItTwice;
              setRunItTwice(next);
              if (!next && result === "split") setResult(null);
            }}
            className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
              runItTwice
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            <span className="text-sm font-medium text-foreground flex items-center gap-2">
              <Repeat2 className="w-4 h-4 text-primary" />
              Run it twice
            </span>
            <span
              className={`w-10 h-6 rounded-full p-0.5 transition-colors ${
                runItTwice ? "bg-primary" : "bg-border"
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                  runItTwice ? "translate-x-4" : ""
                }`}
              />
            </span>
          </button>

          {/* Resultado */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">
              ¿Cómo acabó para el que fue all-in?
            </p>
            <div
              className={`grid gap-2 ${runItTwice ? "grid-cols-3" : "grid-cols-2"}`}
            >
              <button
                type="button"
                onClick={() => setResult("won")}
                className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                  result === "won"
                    ? "border-success bg-success/15 text-success"
                    : "border-border text-foreground-muted hover:border-success/50"
                }`}
              >
                ✅ Ganó
              </button>
              <button
                type="button"
                onClick={() => setResult("lost")}
                className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                  result === "lost"
                    ? "border-danger bg-danger/15 text-danger"
                    : "border-border text-foreground-muted hover:border-danger/50"
                }`}
              >
                ❌ Perdió
              </button>
              {runItTwice && (
                <button
                  type="button"
                  onClick={() => setResult("split")}
                  className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                    result === "split"
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border text-foreground-muted hover:border-accent/50"
                  }`}
                >
                  🤝 Una y una
                </button>
              )}
            </div>
          </div>

          {/* Guardar */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="btn-primary w-full py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Guardando..." : "Guardar all-in 🚀"}
          </button>
        </div>
      </div>
    </div>
  );
}
