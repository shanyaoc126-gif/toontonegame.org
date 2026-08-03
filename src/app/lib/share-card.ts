// F2 share card — canvas-drawn 1200x630 PNG in the Proofing Lab visual
// language: paper canvas, hairlines, mono data, QC stamp outline.
//
// Batch 2: added the COLOR VISION grade line (vision grade from mean ΔE).
// Layout is the same 1200x630 plate: score font tightened (110→84px) and the
// per-round swatch pairs trimmed (120→92px) to free the strip above the
// footer for the grade line.

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

const INK = '#141412';
const SECONDARY = '#6E6A5E';
const HAIRLINE = '#E3E0D6';
const CANVAS = '#FCFBF7';
const ACCENT = '#00A6C0';

export function renderShareCard(data: ShareCardData): HTMLCanvasElement {
  const W = 1200, H = 630;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const MONO = '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
  const SANS = '"Geist", Arial, Helvetica, sans-serif';
  drawShareCard(ctx, W, H, data, MONO, SANS);
  return canvas;
}

function drawShareCard(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  data: ShareCardData, MONO: string, SANS: string,
): void {

  // Paper background
  ctx.fillStyle = CANVAS;
  ctx.fillRect(0, 0, W, H);

  // Header
  ctx.fillStyle = INK;
  ctx.font = `700 34px ${SANS}`;
  ctx.fillText('TOONTONE PROOFING LAB', 60, 78);
  ctx.fillStyle = SECONDARY;
  ctx.font = `400 20px ${MONO}`;
  ctx.fillText(data.dateLine.toUpperCase(), 60, 112);

  // Header hairline
  ctx.strokeStyle = HAIRLINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 136);
  ctx.lineTo(W - 60, 136);
  ctx.stroke();

  // Score (mono, tabular feel) — tightened from 110px to make room below
  ctx.fillStyle = INK;
  ctx.font = `400 84px ${MONO}`;
  ctx.fillText(String(data.totalScore), 60, 252);
  const scoreWidth = ctx.measureText(String(data.totalScore)).width;
  ctx.fillStyle = SECONDARY;
  ctx.font = `400 34px ${MONO}`;
  ctx.fillText('/500', 60 + scoreWidth + 14, 252);

  // QC stamp (rotated outline, rating color)
  ctx.save();
  ctx.translate(W - 210, 200);
  ctx.rotate((-4 * Math.PI) / 180);
  ctx.strokeStyle = data.ratingColor;
  ctx.lineWidth = 3;
  ctx.font = `700 26px ${SANS}`;
  const label = data.ratingLabel;
  const tw = ctx.measureText(label).width;
  ctx.strokeRect(-tw / 2 - 22, -30, tw + 44, 54);
  ctx.fillStyle = data.ratingColor;
  ctx.textAlign = 'center';
  ctx.fillText(label, 0, 6);
  ctx.restore();
  ctx.textAlign = 'left';

  // Round swatch pairs: 5 columns, target over print (trimmed to 92px)
  const cols = 5;
  const sw = 92, gapX = 24;
  const totalW = cols * sw + (cols - 1) * gapX;
  const x0 = (W - totalW) / 2;
  const y0 = 296;
  ctx.font = `400 17px ${MONO}`;
  data.rounds.slice(0, 5).forEach((r, i) => {
    const x = x0 + i * (sw + gapX);
    // crop-mark style frame ticks around the pair
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1;
    const fx = x - 8, fy = y0 - 8, fw = sw + 16, fh = sw * 2 + 10 + 16;
    const t = 14;
    ctx.beginPath();
    // top-left
    ctx.moveTo(fx, fy + t); ctx.lineTo(fx, fy); ctx.lineTo(fx + t, fy);
    // top-right
    ctx.moveTo(fx + fw - t, fy); ctx.lineTo(fx + fw, fy); ctx.lineTo(fx + fw, fy + t);
    // bottom-left
    ctx.moveTo(fx, fy + fh - t); ctx.lineTo(fx, fy + fh); ctx.lineTo(fx + t, fy + fh);
    // bottom-right
    ctx.moveTo(fx + fw - t, fy + fh); ctx.lineTo(fx + fw, fy + fh); ctx.lineTo(fx + fw, fy + fh - t);
    ctx.stroke();

    ctx.fillStyle = r.target;
    ctx.fillRect(x, y0, sw, sw);
    ctx.fillStyle = r.guess;
    ctx.fillRect(x, y0 + sw + 10, sw, sw);

    // score under the pair
    ctx.fillStyle = r.score >= 90 ? '#1E8A4C' : r.score >= 70 ? '#D9A441' : '#DA3A2E';
    ctx.fillText(`R${i + 1} ${r.score}`, x, y0 + sw * 2 + 10 + 24);
  });

  // COLOR VISION grade line — sits between the swatch strip and the footer
  if (data.visionGrade) {
    const deltaEPart = typeof data.meanDeltaE === 'number'
      ? ` · MEAN ΔE ${data.meanDeltaE.toFixed(2)}`
      : '';
    const prefix = 'COLOR VISION: ';
    ctx.font = `400 17px ${MONO}`;
    const prefixW = ctx.measureText(prefix).width;
    ctx.font = `700 21px ${MONO}`;
    const gradeW = ctx.measureText(data.visionGrade).width;
    ctx.font = `400 17px ${MONO}`;
    const suffixW = ctx.measureText(deltaEPart).width;
    const lineW = prefixW + gradeW + suffixW;
    let cx = (W - lineW) / 2;
    const baseY = 566;
    ctx.textAlign = 'left';
    ctx.fillStyle = SECONDARY;
    ctx.font = `400 17px ${MONO}`;
    ctx.fillText(prefix, cx, baseY);
    cx += prefixW;
    ctx.fillStyle = data.visionColor ?? ACCENT;
    ctx.font = `700 21px ${MONO}`;
    ctx.fillText(data.visionGrade, cx, baseY);
    cx += gradeW;
    ctx.fillStyle = SECONDARY;
    ctx.font = `400 17px ${MONO}`;
    ctx.fillText(deltaEPart, cx, baseY);
  }

  // Footer hairline + URL + accent register line
  ctx.strokeStyle = HAIRLINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, H - 40);
  ctx.lineTo(W - 60, H - 40);
  ctx.stroke();
  ctx.fillStyle = ACCENT;
  ctx.fillRect(60, H - 30, 24, 3);
  ctx.fillStyle = SECONDARY;
  ctx.font = `400 20px ${MONO}`;
  ctx.fillText('toontonegame.org', 96, H - 18);
}

// Wait for webfonts so canvas text renders Geist instead of a fallback face.
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
