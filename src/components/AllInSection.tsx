"use client";

import { Camera, Coins, Flame, Loader2, Plus, Repeat2, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import CardsInput, { CardChip } from "@/components/CardPicker";
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
import {
  BOARD_SIZE_BY_STREET,
  type Card,
  formatCards,
  parseCards,
} from "@/lib/cards";
import { computeAllInEquity } from "@/lib/equity";
import {
  compressImage,
  deleteAllInPhoto,
  uploadAllInPhoto,
} from "@/lib/storage";

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
  // Valor de la ficha en € para convertir el bote (fichas -> €)
  chipValue?: number;
  // Al incrementarse, abre el formulario de registro (para botones externos)
  openSignal?: number;
}

const STREETS: Street[] = ["preflop", "flop", "turn", "river"];

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
  chipValue,
  openSignal,
}: AllInSectionProps) {
  const [showForm, setShowForm] = useState(false);

  // Apertura desde fuera (botón flotante, avisos...)
  useEffect(() => {
    if (openSignal && openSignal > 0) setShowForm(true);
  }, [openSignal]);

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
              const pusherCards = parseCards(entry.pusherCards);
              const callerCards = parseCards(entry.callerCards);
              const boardCards = parseCards(entry.boardCards);
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
                        {entry.potEur != null && entry.potEur > 0 && (
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-accent/15 text-accent font-bold">
                            💰 {entry.potEur.toFixed(2)}€
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
                      {/* Cartas de la jugada */}
                      {pusherCards.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                          {pusherCards.map((card) => (
                            <CardChip key={card} card={card} size="sm" />
                          ))}
                          {callerCards.length > 0 && (
                            <>
                              <span className="text-[10px] text-foreground-muted mx-0.5">
                                vs
                              </span>
                              {callerCards.map((card) => (
                                <CardChip key={card} card={card} size="sm" />
                              ))}
                            </>
                          )}
                          {boardCards.length > 0 && (
                            <>
                              <span className="text-[10px] text-foreground-muted ml-1.5 mr-0.5">
                                board
                              </span>
                              {boardCards.map((card) => (
                                <CardChip key={card} card={card} size="sm" />
                              ))}
                            </>
                          )}
                        </div>
                      )}
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
                      {/* Foto de la mesa */}
                      {entry.photoUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            entry.photoUrl &&
                            window.open(entry.photoUrl, "_blank")
                          }
                          className="mt-2 block"
                          title="Ver foto de la mesa"
                        >
                          <img
                            src={entry.photoUrl}
                            alt="Mesa en el all-in"
                            className="h-20 rounded-lg border border-border object-cover"
                          />
                        </button>
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
          chipValue={chipValue}
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
  chipValue,
  onClose,
  onSave,
}: {
  players: AllInPlayer[];
  chipValue?: number;
  onClose: () => void;
  onSave: (entry: AllInEntry) => void | Promise<void>;
}) {
  const [pusherId, setPusherId] = useState<string | null>(null);
  const [callerId, setCallerId] = useState<string | null>(null);
  const [callerIsMulti, setCallerIsMulti] = useState(false);
  const [street, setStreet] = useState<Street>("preflop");
  const [cards, setCards] = useState<Record<string, Card[]>>({
    pusher: [],
    caller: [],
    board: [],
  });
  const [computedEquity, setComputedEquity] = useState<number | null>(null);
  const [computing, setComputing] = useState(false);
  const [runItTwice, setRunItTwice] = useState(false);
  const [result, setResult] = useState<AllInResult | null>(null);
  // Extras opcionales: bote total de la mano (en fichas) y foto de la mesa
  const [potChips, setPotChips] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const potEur =
    potChips !== "" && chipValue && chipValue > 0
      ? Math.round(parseFloat(potChips) * chipValue * 100) / 100
      : null;

  const handlePhotoChange = async (file: File | undefined) => {
    if (!file) return;
    setUploadingPhoto(true);
    const compressed = await compressImage(file, 1000);
    const url = await uploadAllInPhoto(compressed);
    if (url) {
      // Si había otra foto subida, limpiarla
      if (photoUrl) deleteAllInPhoto(photoUrl);
      setPhotoUrl(url);
    }
    setUploadingPhoto(false);
  };

  const handleRemovePhoto = () => {
    if (photoUrl) deleteAllInPhoto(photoUrl);
    setPhotoUrl(null);
  };

  // Cerrar sin guardar: no dejar la foto huérfana en storage
  const handleClose = () => {
    if (photoUrl && !saved) deleteAllInPhoto(photoUrl);
    onClose();
  };

  const boardSize = BOARD_SIZE_BY_STREET[street];
  const canUseCards = !callerIsMulti && callerId !== null;
  const cardsComplete =
    canUseCards &&
    cards.pusher.length === 2 &&
    cards.caller.length === 2 &&
    cards.board.length === boardSize;

  // Al cambiar de calle, recortar el board si sobra
  const handleStreetChange = (next: Street) => {
    setStreet(next);
    const size = BOARD_SIZE_BY_STREET[next];
    setCards((prev) =>
      prev.board.length > size
        ? { ...prev, board: prev.board.slice(0, size) }
        : prev,
    );
  };

  // Calcular la equity automáticamente cuando las cartas están completas
  useEffect(() => {
    if (!cardsComplete) {
      setComputedEquity(null);
      setComputing(false);
      return;
    }
    let cancelled = false;
    setComputing(true);
    computeAllInEquity(cards.pusher, cards.caller, cards.board).then((eq) => {
      if (cancelled) return;
      setComputedEquity(eq);
      setComputing(false);
    });
    return () => {
      cancelled = true;
    };
  }, [cardsComplete, cards]);

  const canSave = pusherId !== null && result !== null && !saving && !computing;

  const handleSave = async () => {
    if (!pusherId || !result) return;
    setSaving(true);
    setSaved(true);
    await onSave({
      pusherId,
      callerId: callerIsMulti ? null : callerId,
      street,
      equity: cardsComplete ? computedEquity : null,
      runItTwice,
      result,
      at: new Date().toISOString(),
      pusherCards: cardsComplete ? formatCards(cards.pusher) : null,
      callerCards: cardsComplete ? formatCards(cards.caller) : null,
      boardCards:
        cardsComplete && boardSize > 0 ? formatCards(cards.board) : null,
      potEur,
      photoUrl,
    });
  };

  const pusherName = players.find((p) => p.id === pusherId)?.name ?? "All-in";
  const callerName = players.find((p) => p.id === callerId)?.name ?? "Paga";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onClick={handleClose}
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
            onClick={handleClose}
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
                  onClick={() => handleStreetChange(s)}
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

          {/* Cartas: la equity se calcula sola */}
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Cartas 🃏{" "}
              <span className="text-xs font-normal text-foreground-muted">
                (opcional: con ellas la equity se calcula sola)
              </span>
            </p>
            {callerIsMulti ? (
              <p className="text-xs text-foreground-muted bg-background rounded-xl border border-border p-3">
                Con varios pagadores no se calcula la equity. Elige un único
                pagador si quieres meter las cartas.
              </p>
            ) : !callerId ? (
              <p className="text-xs text-foreground-muted bg-background rounded-xl border border-border p-3">
                Elige quién paga el all-in para poder meter las cartas.
              </p>
            ) : (
              <>
                <CardsInput
                  groups={[
                    { key: "pusher", label: `🚀 ${pusherName}`, max: 2 },
                    { key: "caller", label: `💰 ${callerName}`, max: 2 },
                    ...(boardSize > 0
                      ? [{ key: "board", label: "Board", max: boardSize }]
                      : []),
                  ]}
                  value={cards}
                  onChange={setCards}
                />

                {/* Resultado del cálculo */}
                {computing && (
                  <p className="flex items-center justify-center gap-2 text-sm text-foreground-muted mt-3">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    Calculando equity...
                  </p>
                )}
                {!computing && computedEquity !== null && (
                  <div className="mt-3">
                    <p className="text-center text-xl font-bold mb-1">
                      <span
                        className={
                          computedEquity >= 50 ? "text-success" : "text-danger"
                        }
                      >
                        {computedEquity.toFixed(0)}%
                      </span>
                      <span className="text-sm font-medium text-foreground-muted">
                        {" "}
                        {pusherName} vs {callerName}{" "}
                        {(100 - computedEquity).toFixed(0)}%
                      </span>
                    </p>
                    <div className="h-2 rounded-full bg-danger/40 overflow-hidden">
                      <div
                        className="h-full bg-success rounded-full"
                        style={{ width: `${computedEquity}%` }}
                      />
                    </div>
                  </div>
                )}
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

          {/* Extras opcionales: suben el nivel de las estadísticas */}
          <div className="p-3 rounded-xl bg-background border border-dashed border-accent/40 space-y-3">
            <p className="text-xs font-semibold text-accent">
              Extras para las estadísticas 📊{" "}
              <span className="font-normal text-foreground-muted">
                (opcionales, pero los récords molan más con ellos)
              </span>
            </p>

            {/* Bote de la mano */}
            <div>
              <label className="block text-xs text-foreground-muted mb-1 flex items-center gap-1">
                <Coins className="w-3 h-3" />
                Bote total de la mano en fichas (con lo que ya había en la mesa)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={10}
                  value={potChips}
                  onChange={(e) => setPotChips(e.target.value)}
                  placeholder="p. ej. 2400"
                  className="flex-1 px-3 py-2 rounded-lg bg-background-card border border-border text-foreground text-sm placeholder:text-foreground-muted focus:border-primary outline-none"
                />
                {potEur !== null && !Number.isNaN(potEur) && (
                  <span className="text-sm font-bold text-accent flex-shrink-0">
                    = {potEur.toFixed(2)}€
                  </span>
                )}
              </div>
            </div>

            {/* Foto de la mesa */}
            <div>
              <label className="block text-xs text-foreground-muted mb-1 flex items-center gap-1">
                <Camera className="w-3 h-3" />
                Foto de la mesa
              </label>
              {photoUrl ? (
                <div className="relative inline-block">
                  <img
                    src={photoUrl}
                    alt="Mesa en el all-in"
                    className="h-24 rounded-lg border border-border object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-danger text-white flex items-center justify-center shadow"
                    title="Quitar foto"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-border text-sm text-foreground-muted hover:border-primary hover:text-foreground transition-colors cursor-pointer">
                  {uploadingPhoto ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      Subiendo foto...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      Hacer o elegir foto 📸
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    disabled={uploadingPhoto}
                    onChange={(e) => handlePhotoChange(e.target.files?.[0])}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Guardar */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || uploadingPhoto}
            className="btn-primary w-full py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Guardando..." : "Guardar all-in 🚀"}
          </button>
        </div>
      </div>
    </div>
  );
}
