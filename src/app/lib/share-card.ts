// Share card — canvas-drawn 1200x630 PNG in the MindMarket storybook skin:
// cream paper canvas, ink text, fresh-grass decoration, big rounded swatches.
//
// Batch history:
//   v4 — added the COLOR VISION grade line (vision grade from mean ΔE).
//   MindMarket reskin — new palette + Inter; layout kept: 1200x630, score
//   block, rotated rating stamp, 5 swatch pairs, COLOR VISION grade line.

export interface ShareCardData {
  totalScore: number;      // out of 500
  ratingLabel: string;     // e.g. "COLOR PRO"
  ratingColor: string;     // hex
  dateLine: string;        // e.g. "DAILY PROOF · 2026-07-28" or "PRACTICE PROOF"
  rounds: { target: string; guess: string; score: number }[];
  visionGrade?: string;    // e.g. "PRESS-ROOM GRADE" (vision grade, not rating)
  visionColor?: string;    // hex for the grade line
  meanDeltaE?: number;     // printed next to the grade when present
}

const CREAM = '#f5f1e4';
const WHITE = '#ffffff';
const INK = '#2c2e2a';
const SECONDARY = '#80827f';
const HAIRLINE = '#d5d5d4';
const GRASS = '#8ed462';

// Score text colors — readable MindMarket variants (same hue families).
const GRASS_TEXT = '#4d8b31';
const SUNSHINE_TEXT = '#8a7500';
const CORAL_TEXT = '#d94a35';

export function renderShareCard(data: ShareCardData): HTMLCanvasElement {
  const W = 1200, H = 630;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const SANS = '"Inter", Arial, Helvetica, sans-serif';
  drawShareCard(ctx, W, H, data, SANS);
  return canvas;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawShareCard(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  data: ShareCardData, SANS: string,
): void {
  // Cream paper background + fresh-grass decoration band
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = GRASS;
  ctx.fillRect(0, 0, W, 10); // top grass ribbon
  ctx.beginPath();
  ctx.arc(W - 90, H - 46, 56, 0, Math.PI * 2); // corner pop circle
  ctx.globalAlpha = 0.35;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Header
  ctx.fillStyle = INK;
  ctx.font = `500 38px ${SANS}`;
  ctx.fillText('ToonTone Proofing Lab', 60, 84);
  ctx.fillStyle = SECONDARY;
  ctx.font = `400 20px ${SANS}`;
  ctx.fillText(data.dateLine.toUpperCase(), 62, 118);

  // Header hairline
  ctx.strokeStyle = HAIRLINE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, 142);
  ctx.lineTo(W - 60, 142);
  ctx.stroke();

  // Score — oversized tight-tracked Inter digits
  ctx.fillStyle = INK;
  ctx.font = `500 96px ${SANS}`;
  ctx.fillText(String(data.totalScore), 56, 262);
  const scoreWidth = ctx.measureText(String(data.totalScore)).width;
  ctx.fillStyle = SECONDARY;
  ctx.font = `400 32px ${SANS}`;
  ctx.fillText('/500', 60 + scoreWidth + 16, 262);

  // Rating stamp (rotated rounded outline, readable rating color)
  ctx.save();
  ctx.translate(W - 220, 208);
  ctx.rotate((-4 * Math.PI) / 180);
  ctx.strokeStyle = data.ratingColor;
  ctx.lineWidth = 3;
  ctx.font = `500 26px ${SANS}`;
  const label = data.ratingLabel;
  const tw = ctx.measureText(label).width;
  roundRect(ctx, -tw / 2 - 24, -32, tw + 48, 58, 18);
  ctx.stroke();
  ctx.fillStyle = data.ratingColor;
  ctx.textAlign = 'center';
  ctx.fillText(label, 0, 8);
  ctx.restore();
  ctx.textAlign = 'left';

  // Round swatch pairs: 5 columns, target over print, in white sticker cards
  const cols = 5;
  const sw = 92, gapX = 24;
  const totalW = cols * sw + (cols - 1) * gapX;
  const x0 = (W - totalW) / 2;
  const y0 = 302;
  ctx.font = `500 17px ${SANS}`;
  data.rounds.slice(0, 5).forEach((r, i) => {
    const x = x0 + i * (sw + gapX);

    // white sticker card behind the pair
    ctx.fillStyle = WHITE;
    roundRect(ctx, x - 10, y0 - 10, sw + 20, sw * 2 + 10 + 20, 20);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    roundRect(ctx, x - 10, y0 - 10, sw + 20, sw * 2 + 10 + 20, 20);
    ctx.stroke();

    ctx.fillStyle = r.target;
    roundRect(ctx, x, y0, sw, sw, 14);
    ctx.fill();
    ctx.fillStyle = r.guess;
    roundRect(ctx, x, y0 + sw + 10, sw, sw, 14);
    ctx.fill();

    // score under the pair
    ctx.fillStyle = r.score >= 90 ? GRASS_TEXT : r.score >= 70 ? SUNSHINE_TEXT : CORAL_TEXT;
    ctx.fillText(`R${i + 1} ${r.score}`, x, y0 + sw * 2 + 10 + 34);
  });

  // COLOR VISION grade line — sits between the swatch strip and the footer
  if (data.visionGrade) {
    const deltaEPart = typeof data.meanDeltaE === 'number'
      ? ` · MEAN ΔE ${data.meanDeltaE.toFixed(2)}`
      : '';
    const prefix = 'COLOR VISION: ';
    ctx.font = `400 18px ${SANS}`;
    const prefixW = ctx.measureText(prefix).width;
    ctx.font = `500 22px ${SANS}`;
    const gradeW = ctx.measureText(data.visionGrade).width;
    ctx.font = `400 18px ${SANS}`;
    const suffixW = ctx.measureText(deltaEPart).width;
    const lineW = prefixW + gradeW + suffixW;
    let cx = (W - lineW) / 2;
    const baseY = 570;
    ctx.textAlign = 'left';
    ctx.fillStyle = SECONDARY;
    ctx.font = `400 18px ${SANS}`;
    ctx.fillText(prefix, cx, baseY);
    cx += prefixW;
    ctx.fillStyle = data.visionColor ?? GRASS_TEXT;
    ctx.font = `500 22px ${SANS}`;
    ctx.fillText(data.visionGrade, cx, baseY);
    cx += gradeW;
    ctx.fillStyle = SECONDARY;
    ctx.font = `400 18px ${SANS}`;
    ctx.fillText(deltaEPart, cx, baseY);
  }

  // Footer hairline + URL + grass register line
  ctx.strokeStyle = HAIRLINE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, H - 40);
  ctx.lineTo(W - 60, H - 40);
  ctx.stroke();
  ctx.fillStyle = GRASS;
  roundRect(ctx, 60, H - 28, 26, 6, 3);
  ctx.fill();
  ctx.fillStyle = SECONDARY;
  ctx.font = `400 20px ${SANS}`;
  ctx.fillText('toontonegame.org', 100, H - 18);
}

// Wait for webfonts so canvas text renders Inter instead of a fallback face.
// Resolves immediately when the Font Loading API is unavailable.
async function waitForFonts(): Promise<void> {
  try {
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      await document.fonts.ready;
    }
  } catch {
    // Fonts API missing or rejected — proceed with fallback fonts.
  }
}

// Render the share card after fonts are ready. Prefer this over
// renderShareCard for anything the user will actually see or share.
export async function renderShareCardAsync(data: ShareCardData): Promise<HTMLCanvasElement> {
  await waitForFonts();
  return renderShareCard(data);
}

// PNG File for the Web Share API (or any File-based consumer).
export async function shareCardFile(data: ShareCardData, filename = 'toontone-proof.png'): Promise<File | null> {
  const canvas = await renderShareCardAsync(data);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return null;
  return new File([blob], filename, { type: 'image/png' });
}

export function downloadShareCard(data: ShareCardData, filename = 'toontone-proof.png'): void {
  renderShareCardAsync(data).then((canvas) => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  });
}
