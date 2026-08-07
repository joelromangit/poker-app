// Utilidades puras para trabajar con cartas de poker en notación compacta
// ("As" = as de picas, "Th" = diez de corazones...)

export type CardRank =
  | "A"
  | "K"
  | "Q"
  | "J"
  | "T"
  | "9"
  | "8"
  | "7"
  | "6"
  | "5"
  | "4"
  | "3"
  | "2";

export type CardSuit = "s" | "h" | "d" | "c";

// Una carta en notación compacta, p. ej. "As"
export type Card = `${CardRank}${CardSuit}`;

export const CARD_RANKS: CardRank[] = [
  "A",
  "K",
  "Q",
  "J",
  "T",
  "9",
  "8",
  "7",
  "6",
  "5",
  "4",
  "3",
  "2",
];

// Baraja de 4 colores: más fácil distinguir palos en pantalla pequeña
export const CARD_SUITS: {
  key: CardSuit;
  symbol: string;
  colorClass: string;
}[] = [
  { key: "s", symbol: "♠", colorClass: "text-slate-800" },
  { key: "h", symbol: "♥", colorClass: "text-red-600" },
  { key: "d", symbol: "♦", colorClass: "text-blue-600" },
  { key: "c", symbol: "♣", colorClass: "text-green-700" },
];

export const SUIT_BY_KEY = new Map(CARD_SUITS.map((s) => [s.key, s]));

// Cartas del board según la calle del all-in
export const BOARD_SIZE_BY_STREET: Record<string, number> = {
  preflop: 0,
  flop: 3,
  turn: 4,
  river: 5,
};

// Etiqueta visible del rango ("T" se muestra como "10")
export function rankLabel(rank: CardRank): string {
  return rank === "T" ? "10" : rank;
}

// Parsear una cadena compacta ("AsKd") a cartas individuales.
// Devuelve [] si la cadena no es válida.
export function parseCards(value: string | null | undefined): Card[] {
  if (!value || value.length % 2 !== 0) return [];
  const cards: Card[] = [];
  for (let i = 0; i < value.length; i += 2) {
    const rank = value[i].toUpperCase() as CardRank;
    const suit = value[i + 1].toLowerCase() as CardSuit;
    if (!CARD_RANKS.includes(rank) || !SUIT_BY_KEY.has(suit)) return [];
    cards.push(`${rank}${suit}`);
  }
  return cards;
}

// Serializar cartas a cadena compacta
export function formatCards(cards: ReadonlyArray<Card>): string {
  return cards.join("");
}
