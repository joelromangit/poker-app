import type { Card } from "./cards";

// Iteraciones de Monte Carlo para el preflop: la enumeración exacta tarda
// segundos en móvil y con 10k iteraciones el error es < 1%
const PREFLOP_ITERATIONS = 10000;

// Calcular la equity (%) del que va all-in contra la mano que paga, dadas las
// cartas conocidas. Los empates reparten a medias. Devuelve null si el
// cálculo no es posible (cartas inválidas, duplicadas...).
// La librería se importa en diferido para no engordar el bundle inicial.
export async function computeAllInEquity(
  pusherCards: ReadonlyArray<Card>,
  callerCards: ReadonlyArray<Card>,
  boardCards: ReadonlyArray<Card>,
): Promise<number | null> {
  if (pusherCards.length !== 2 || callerCards.length !== 2) return null;
  if (![0, 3, 4, 5].includes(boardCards.length)) return null;

  const all = [...pusherCards, ...callerCards, ...boardCards];
  if (new Set(all).size !== all.length) return null;

  try {
    const { CardGroup, OddsCalculator } = await import("poker-odds-calculator");
    const result = OddsCalculator.calculate(
      [
        CardGroup.fromString(pusherCards.join("")),
        CardGroup.fromString(callerCards.join("")),
      ],
      boardCards.length > 0
        ? CardGroup.fromString(boardCards.join(""))
        : undefined,
      undefined,
      boardCards.length === 0 ? PREFLOP_ITERATIONS : undefined,
    );
    const pusher = result.equities[0];
    return Math.min(
      100,
      Math.max(0, pusher.getEquity() + pusher.getTiePercentage() / 2),
    );
  } catch (err) {
    console.error("Error calculating equity:", err);
    return null;
  }
}
