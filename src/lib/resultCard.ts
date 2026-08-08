// Generador de la tarjeta-imagen de resultados para compartir (canvas puro).
// Pensada para WhatsApp: formato vertical, tema oscuro de la app.

export interface ResultCardRow {
  name: string;
  color: string; // color de avatar
  profit: number;
  sub?: string; // línea pequeña bajo el nombre (p. ej. "3 de 4 partidas")
}

export interface ResultCardPayment {
  from: string;
  to: string;
  amount: number;
}

export interface ResultCardData {
  title: string;
  subtitle: string;
  rows: ResultCardRow[];
  payments: ResultCardPayment[];
}

const WIDTH = 1080;
const PAD = 64;
const FONT = "-apple-system, 'Segoe UI', Roboto, sans-serif";

const COLORS = {
  bgTop: "#0f172a",
  bgBottom: "#1a2436",
  card: "#1e293b",
  border: "#334155",
  text: "#f1f5f9",
  muted: "#94a3b8",
  primary: "#10b981",
  accent: "#fbbf24",
  success: "#22c55e",
  danger: "#ef4444",
};

function euros(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}€`;
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawAvatar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  name: string,
  color: string,
) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${radius}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name.charAt(0).toUpperCase(), x, y + 2);
}

// Pintar la tarjeta y devolver el canvas
export function renderResultCard(data: ResultCardData): HTMLCanvasElement {
  const rowHeight = 96;
  const paymentHeight = 84;
  const headerHeight = 240;
  const paymentsHeader = data.payments.length > 0 ? 110 : 0;
  const footerHeight = 110;
  const height =
    headerHeight +
    data.rows.length * rowHeight +
    paymentsHeader +
    data.payments.length * paymentHeight +
    footerHeight;

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Fondo con degradado
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, COLORS.bgTop);
  gradient.addColorStop(1, COLORS.bgBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, height);

  // Cabecera
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = COLORS.primary;
  ctx.font = `bold 40px ${FONT}`;
  ctx.fillText("♠ Poker Nights", PAD, 92);

  ctx.fillStyle = COLORS.text;
  ctx.font = `bold 58px ${FONT}`;
  ctx.fillText(data.title, PAD, 168, WIDTH - PAD * 2);

  ctx.fillStyle = COLORS.muted;
  ctx.font = `32px ${FONT}`;
  ctx.fillText(data.subtitle, PAD, 216, WIDTH - PAD * 2);

  // Filas del ranking
  let y = headerHeight;
  data.rows.forEach((row, index) => {
    drawRoundRect(
      ctx,
      PAD,
      y + 6,
      WIDTH - PAD * 2,
      rowHeight - 12,
      20,
      COLORS.card,
    );
    const centerY = y + rowHeight / 2;

    // Posición
    ctx.fillStyle = index === 0 ? COLORS.accent : COLORS.muted;
    ctx.font = `bold 36px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(index === 0 ? "🏆" : `${index + 1}º`, PAD + 52, centerY);

    // Avatar + nombre
    drawAvatar(ctx, PAD + 130, centerY, 28, row.name, row.color);
    ctx.fillStyle = COLORS.text;
    ctx.font = `bold 38px ${FONT}`;
    ctx.textAlign = "left";
    ctx.fillText(row.name, PAD + 180, row.sub ? centerY - 14 : centerY, 480);
    if (row.sub) {
      ctx.fillStyle = COLORS.muted;
      ctx.font = `26px ${FONT}`;
      ctx.fillText(row.sub, PAD + 180, centerY + 24, 480);
    }

    // Resultado
    ctx.fillStyle =
      row.profit > 0
        ? COLORS.success
        : row.profit < 0
          ? COLORS.danger
          : COLORS.muted;
    ctx.font = `bold 42px ${FONT}`;
    ctx.textAlign = "right";
    ctx.fillText(euros(row.profit), WIDTH - PAD - 28, centerY);

    y += rowHeight;
  });

  // Quién paga a quién
  if (data.payments.length > 0) {
    y += 24;
    ctx.fillStyle = COLORS.text;
    ctx.font = `bold 40px ${FONT}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("💸 Quién paga a quién", PAD, y + 46);
    y += paymentsHeader - 24;

    for (const payment of data.payments) {
      drawRoundRect(
        ctx,
        PAD,
        y + 6,
        WIDTH - PAD * 2,
        paymentHeight - 12,
        18,
        COLORS.card,
      );
      const centerY = y + paymentHeight / 2;

      ctx.textBaseline = "middle";
      ctx.fillStyle = COLORS.danger;
      ctx.font = `bold 34px ${FONT}`;
      ctx.textAlign = "left";
      ctx.fillText(payment.from, PAD + 32, centerY, 300);

      ctx.fillStyle = COLORS.muted;
      ctx.textAlign = "center";
      ctx.fillText("➜", WIDTH / 2 - 110, centerY);

      ctx.fillStyle = COLORS.success;
      ctx.textAlign = "left";
      ctx.fillText(payment.to, WIDTH / 2 - 60, centerY, 300);

      ctx.fillStyle = COLORS.accent;
      ctx.font = `bold 38px ${FONT}`;
      ctx.textAlign = "right";
      ctx.fillText(`${payment.amount.toFixed(2)}€`, WIDTH - PAD - 28, centerY);

      y += paymentHeight;
    }
  }

  // Pie
  ctx.fillStyle = COLORS.muted;
  ctx.font = `28px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Generado con Poker Nights 🃏", WIDTH / 2, height - 42);

  return canvas;
}

// Compartir la tarjeta: Web Share con archivo si se puede (móvil), descarga si no
export async function shareResultCard(
  data: ResultCardData,
  filename = "resultado-poker.png",
): Promise<"shared" | "downloaded" | "error"> {
  try {
    const canvas = renderResultCard(data);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) return "error";

    const file = new File([blob], filename, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: data.title });
        return "shared";
      } catch (err) {
        // Cancelado por el usuario: no hacer nada más
        if ((err as Error).name === "AbortError") return "shared";
        // Si falla el share nativo, caer a descarga
      }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return "downloaded";
  } catch (err) {
    console.error("Error sharing result card:", err);
    return "error";
  }
}
