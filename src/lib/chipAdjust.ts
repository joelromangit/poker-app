// Reparto inteligente del descuadre de fichas al final de la partida:
// distribuye lo que sobra o falta entre los jugadores de forma proporcional
// a su stack (los errores de recuento suelen crecer con el montón).

export function smartDistribute(
  values: ReadonlyArray<number>,
  expectedTotal: number,
): number[] {
  if (values.length === 0) return [];
  const total = values.reduce((sum, value) => sum + value, 0);
  const diff = expectedTotal - total;
  if (diff === 0) return [...values];

  // Pesos proporcionales al stack; si nadie tiene fichas, reparto igualitario
  const weights =
    total > 0
      ? values.map((value) => value / total)
      : values.map(() => 1 / values.length);

  const adjusted = values.map((value, index) =>
    Math.max(0, Math.round(value + diff * weights[index])),
  );

  // Corregir el resto del redondeo ficha a ficha, empezando por los stacks
  // más grandes (y sin dejar a nadie en negativo)
  let remainder =
    expectedTotal - adjusted.reduce((sum, value) => sum + value, 0);
  const order = adjusted
    .map((_, index) => index)
    .sort((a, b) => adjusted[b] - adjusted[a]);

  let guard = 0;
  const maxIterations = Math.abs(remainder) * 2 + values.length * 2;
  while (remainder !== 0 && guard < maxIterations) {
    const index = order[guard % order.length];
    if (remainder > 0) {
      adjusted[index] += 1;
      remainder -= 1;
    } else if (adjusted[index] > 0) {
      adjusted[index] -= 1;
      remainder += 1;
    }
    guard += 1;
  }

  return adjusted;
}
