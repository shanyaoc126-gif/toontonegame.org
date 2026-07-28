// Color conversion and delta E calculation utilities

export interface HSB {
  h: number; // 0-360
  s: number; // 0-100
  b: number; // 0-100
}

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface CMYK {
  c: number; // 0-100
  m: number; // 0-100
  y: number; // 0-100
  k: number; // 0-100
}

export type ColorMode = 'hsb' | 'rgb' | 'cmyk';

// HSB to RGB
export function hsbToRgb(hsb: HSB): RGB {
  const s = hsb.s / 100;
  const v = hsb.b / 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((hsb.h / 60) % 2) - 1));
  const m = v - c;

  let r = 0, g = 0, b = 0;
  if (hsb.h < 60) { r = c; g = x; b = 0; }
  else if (hsb.h < 120) { r = x; g = c; b = 0; }
  else if (hsb.h < 180) { r = 0; g = c; b = x; }
  else if (hsb.h < 240) { r = 0; g = x; b = c; }
  else if (hsb.h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

// RGB to HSB (rounded, for display)
export function rgbToHsb(rgb: RGB): HSB {
  const p = rgbToHsbPrecise(rgb);
  return {
    h: Math.round(p.h),
    s: Math.round(p.s),
    b: Math.round(p.b),
  };
}

// RGB to HSB without rounding. Used to keep HSB as the single internal
// source of truth: storing the precise value means untouched slider channels
// do not drift by ±1 through repeated RGB<->mode round-trips.
export function rgbToHsbPrecise(rgb: RGB): HSB {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }

  return {
    h,
    s: max === 0 ? 0 : (d / max) * 100,
    b: max * 100,
  };
}

// RGB to CMYK
export function rgbToCmyk(rgb: RGB): CMYK {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const k = 1 - Math.max(r, g, b);

  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };

  return {
    c: Math.round(((1 - r - k) / (1 - k)) * 100),
    m: Math.round(((1 - g - k) / (1 - k)) * 100),
    y: Math.round(((1 - b - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

// CMYK to RGB
export function cmykToRgb(cmyk: CMYK): RGB {
  const c = cmyk.c / 100;
  const m = cmyk.m / 100;
  const y = cmyk.y / 100;
  const k = cmyk.k / 100;

  return {
    r: Math.round(255 * (1 - c) * (1 - k)),
    g: Math.round(255 * (1 - m) * (1 - k)),
    b: Math.round(255 * (1 - y) * (1 - k)),
  };
}

// RGB to Hex
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

// Hex to RGB
export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

// Delta E 2000 - perceptual color difference
export function deltaE2000(rgb1: RGB, rgb2: RGB): number {
  // Convert RGB to Lab
  const lab1 = rgbToLab(rgb1);
  const lab2 = rgbToLab(rgb2);

  const L1 = lab1.l, a1 = lab1.a, b1 = lab1.b;
  const L2 = lab2.l, a2 = lab2.a, b2 = lab2.b;

  const avgLp = (L1 + L2) / 2;
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const avgC = (C1 + C2) / 2;

  const G = 0.5 * (1 - Math.sqrt(Math.pow(avgC, 7) / (Math.pow(avgC, 7) + Math.pow(25, 7))));
  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);
  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);
  const avgCp = (C1p + C2p) / 2;

  let h1p = Math.atan2(b1, a1p) * (180 / Math.PI);
  if (h1p < 0) h1p += 360;
  let h2p = Math.atan2(b2, a2p) * (180 / Math.PI);
  if (h2p < 0) h2p += 360;

  // CIEDE2000 mean hue: when |h1' - h2'| > 180°, the mean must wrap around
  // 0°/360°. If h1' + h2' < 360° add 360°, otherwise subtract 360°.
  // Boundary case: h1' = 350°, h2' = 10° -> correct mean is 0° (360° mod 360),
  // not (350 + 10 + 360) / 2 = 360°; the old single-branch code returned 360°
  // here, skewing deltaTheta and the R_T rotation term for blue-purple pairs.
  let avghp: number;
  if (Math.abs(h1p - h2p) > 180) {
    avghp = (h1p + h2p < 360)
      ? (h1p + h2p + 360) / 2
      : (h1p + h2p - 360) / 2;
  } else {
    avghp = (h1p + h2p) / 2;
  }
  const T = 1 - 0.17 * Math.cos((avghp - 30) * Math.PI / 180)
    + 0.24 * Math.cos(2 * avghp * Math.PI / 180)
    + 0.32 * Math.cos((3 * avghp + 6) * Math.PI / 180)
    - 0.20 * Math.cos((4 * avghp - 63) * Math.PI / 180);

  let deltahp = h2p - h1p;
  if (Math.abs(deltahp) > 180) {
    deltahp = h2p <= h1p ? deltahp + 360 : deltahp - 360;
  }

  const deltaLp = L2 - L1;
  const deltaCp = C2p - C1p;
  const deltaHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(deltahp * Math.PI / 360);

  const Sl = 1 + 0.015 * Math.pow(avgLp - 50, 2) / Math.sqrt(20 + Math.pow(avgLp - 50, 2));
  const Sc = 1 + 0.045 * avgCp;
  const Sh = 1 + 0.015 * avgCp * T;

  const deltaTheta = 30 * Math.exp(-Math.pow((avghp - 275) / 25, 2));
  const Rc = 2 * Math.sqrt(Math.pow(avgCp, 7) / (Math.pow(avgCp, 7) + Math.pow(25, 7)));
  const Rt = -Rc * Math.sin(2 * deltaTheta * Math.PI / 180);

  const Kl = 1, Kc = 1, Kh = 1;

  return Math.sqrt(
    Math.pow(deltaLp / (Kl * Sl), 2) +
    Math.pow(deltaCp / (Kc * Sc), 2) +
    Math.pow(deltaHp / (Kh * Sh), 2) +
    Rt * (deltaCp / (Kc * Sc)) * (deltaHp / (Kh * Sh))
  );
}

// RGB to Lab helper
function rgbToLab(rgb: RGB): { l: number; a: number; b: number } {
  // RGB to XYZ
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  r *= 100;
  g *= 100;
  b *= 100;

  const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = r * 0.0193 + g * 0.1192 + b * 0.9505;

  // XYZ to Lab
  const xRef = 95.047, yRef = 100.0, zRef = 108.883;
  const xRatio = x / xRef;
  const yRatio = y / yRef;
  const zRatio = z / zRef;

  const fx = xRatio > 0.008856 ? Math.pow(xRatio, 1 / 3) : 7.787 * xRatio + 16 / 116;
  const fy = yRatio > 0.008856 ? Math.pow(yRatio, 1 / 3) : 7.787 * yRatio + 16 / 116;
  const fz = zRatio > 0.008856 ? Math.pow(zRatio, 1 / 3) : 7.787 * zRatio + 16 / 116;

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

// Generate random color
export function generateRandomColor(): RGB {
  return {
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256),
  };
}

// Score based on delta E (0-100)
export function calculateScore(deltaE: number): number {
  // Delta E < 1 = visually identical, score 100
  // Delta E ~ 100 = completely different, score 0
  const score = Math.max(0, Math.min(100, 100 - deltaE));
  return Math.round(score);
}

// Get color in current mode
export function getColorInMode(rgb: RGB, mode: ColorMode): HSB | RGB | CMYK {
  switch (mode) {
    case 'hsb': return rgbToHsb(rgb);
    case 'rgb': return rgb;
    case 'cmyk': return rgbToCmyk(rgb);
  }
}

// Convert from mode to RGB
export function modeToRgb(value: HSB | RGB | CMYK, mode: ColorMode): RGB {
  switch (mode) {
    case 'hsb': return hsbToRgb(value as HSB);
    case 'rgb': return value as RGB;
    case 'cmyk': return cmykToRgb(value as CMYK);
  }
}
