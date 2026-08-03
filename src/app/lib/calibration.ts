// Pre-flight calibration + color vision assist — localStorage only, never uploaded.
//
// Keys:
//   toontone.lab.calibrated  '1' once the pre-flight ritual has been completed
//                            or skipped; later visits open straight onto the game.
//   toontone.lab.cbassist    'on' | 'off' — hue shape coding on the swatches.

export const CALIBRATED_KEY = 'toontone.lab.calibrated';
export const CB_ASSIST_KEY = 'toontone.lab.cbassist';

// Storage unavailable (private mode, blocked) => never gate the game behind
// the ritual; behave as if already calibrated.
export function isCalibrated(): boolean {
  try {
    return window.localStorage.getItem(CALIBRATED_KEY) === '1';
  } catch {
    return true;
  }
}

export function markCalibrated(): void {
  try {
    window.localStorage.setItem(CALIBRATED_KEY, '1');
  } catch {
    // ignore — the ritual just shows again next visit
  }
}

export function loadCbAssist(): boolean {
  try {
    return window.localStorage.getItem(CB_ASSIST_KEY) === 'on';
  } catch {
    return false;
  }
}

export function saveCbAssist(on: boolean): void {
  try {
    window.localStorage.setItem(CB_ASSIST_KEY, on ? 'on' : 'off');
  } catch {
    // ignore — assist simply doesn't persist
  }
}

// ——— Hue → shape coding ———
// Six anchor hues, six shapes. Hues between two anchors carry both neighbor
// shapes, so the code never depends on discriminating one exact hue.
// Near-neutral swatches (no usable hue) carry the slashed "no hue" mark.

export type ShapeId =
  | 'circle'
  | 'triangle'
  | 'square'
  | 'diamond'
  | 'pentagon'
  | 'hexagon'
  | 'achro';

export const SHAPE_WHEEL: { shape: Exclude<ShapeId, 'achro'>; hue: number; name: string }[] = [
  { shape: 'circle', hue: 0, name: 'RED' },
  { shape: 'triangle', hue: 60, name: 'YELLOW' },
  { shape: 'square', hue: 120, name: 'GREEN' },
  { shape: 'diamond', hue: 180, name: 'CYAN' },
  { shape: 'pentagon', hue: 240, name: 'BLUE' },
  { shape: 'hexagon', hue: 300, name: 'MAGENTA' },
];

// ± degrees around each anchor that stay single-shape
const SINGLE_ZONE = 15;

export function shapesForHsb(hsb: { h: number; s: number; b: number }): ShapeId[] {
  if (hsb.s < 10 || hsb.b < 10) return ['achro'];
  const h = ((hsb.h % 360) + 360) % 360;
  const band = Math.min(5, Math.floor(h / 60)); // 0..5
  const offset = h - band * 60; // 0..60
  if (offset <= SINGLE_ZONE) return [SHAPE_WHEEL[band].shape];
  if (offset >= 60 - SINGLE_ZONE) return [SHAPE_WHEEL[(band + 1) % 6].shape];
  return [SHAPE_WHEEL[band].shape, SHAPE_WHEEL[(band + 1) % 6].shape];
}

export const SHAPE_LABELS: Record<ShapeId, string> = {
  circle: 'circle',
  triangle: 'triangle',
  square: 'square',
  diamond: 'diamond',
  pentagon: 'pentagon',
  hexagon: 'hexagon',
  achro: 'no hue',
};

export function shapeCodeLabel(ids: ShapeId[]): string {
  return ids.map((id) => SHAPE_LABELS[id]).join(' + ');
}

// Regular-polygon vertices for the non-circular shapes, drawn point-up.
// Returns [] for 'circle' and 'achro' — callers special-case those.
export function shapeVertices(
  shape: ShapeId,
  cx: number,
  cy: number,
  r: number,
): Array<[number, number]> {
  const sides =
    shape === 'triangle' ? 3
    : shape === 'square' ? 4
    : shape === 'diamond' ? 4
    : shape === 'pentagon' ? 5
    : shape === 'hexagon' ? 6
    : 0;
  if (sides === 0) return [];
  // square: sides axis-aligned (start at -45°); diamond: vertex-up (start at -90°)
  const startAngle = shape === 'square' ? -Math.PI / 4 : -Math.PI / 2;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < sides; i++) {
    const a = startAngle + (i * 2 * Math.PI) / sides;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}
