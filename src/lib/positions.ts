// Lógica pura del sorteo de posiciones de mesa

export const POSITION_SETS: Record<number, string[]> = {
  2: ["BTN/SB", "BB"],
  3: ["BTN", "SB", "BB"],
  4: ["BTN", "SB", "BB", "UTG"],
  5: ["BTN", "SB", "BB", "UTG", "CO"],
  6: ["BTN", "SB", "BB", "UTG", "MP", "CO"],
  7: ["BTN", "SB", "BB", "UTG", "MP", "HJ", "CO"],
  8: ["BTN", "SB", "BB", "UTG", "UTG+1", "MP", "HJ", "CO"],
  9: ["BTN", "SB", "BB", "UTG", "UTG+1", "UTG+2", "MP", "HJ", "CO"],
};

export const FALLBACK_POSITIONS = [
  "BTN",
  "SB",
  "BB",
  "UTG",
  "UTG+1",
  "UTG+2",
  "MP",
  "MP+1",
  "HJ",
  "CO",
];

// Posiciones para N jugadores (BTN incluido en la primera)
export function positionsFor(count: number): string[] {
  return POSITION_SETS[count] || FALLBACK_POSITIONS.slice(0, count);
}

// Ángulos de los asientos repartidos alrededor de la mesa
export function seatAngles(count: number): number[] {
  return Array.from(
    { length: count },
    (_, index) => (360 / count) * index - 90,
  );
}

// Barajar (Fisher-Yates) sin mutar el original
export function shuffle<T>(items: ReadonlyArray<T>): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
