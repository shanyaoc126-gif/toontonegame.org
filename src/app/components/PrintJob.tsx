'use client';

// PRINT JOB — photo edition. The owner's brief: "give them the original photo,
// and one with the color stripped out, then let them re-ink it."
//
// Each pet ships as a real 640×640 photo set (public/pets/photos/<slug>…):
//   - orig.jpg    the full-color reference (the PEEK hint + the reveal)
//   - canvas.jpg  the grayscale "plate" the player works on
//   - z1..z5.png  black/white masks, one per photo zone (white = zone)
//   - <slug>.json manifest: zone targets = the REAL average HSB of each
//     region in the photo.
//
// Each round the player calibrates one zone's target with the familiar
// sliders. On submit the zone is painted with the PLAYER's color multiplied
// by the photo's own luminance (lum × ink), so every completed zone keeps
// the photographic fur texture. ΔE > 8 stamps a coral MISPRINT marker.
// Scoring reuses deltaE2000 -> score = 100 − ΔE, total out of 500.

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  RGB, HSB, ColorMode,
  hsbToRgb, rgbToHsbPrecise, rgbToCmyk, cmykToRgb,
  deltaE2000, calculateScore, rgbToHex,
} from '../lib/color-utils';
import { utcDateKey } from '../lib/daily';
import { LabStats, DEFAULT_STATS, loadStats, saveStats, recordGame, ratingLabelForScore } from '../lib/stats';
import { downloadShareCard, shareCardFile, ShareCardData } from '../lib/share-card';
import { PETS, PetSlug, getPet, zoneQuip } from '../lib/pets';

// ————— MindMarket palette (same tokens as ColorGame) —————
const GRASS = '#8ed462';
const SUNSHINE = '#f5e211';
const CORAL = '#ff705d';
const SKY = '#2ba0ff';
const GRASS_TEXT = '#4d8b31';
const SUNSHINE_TEXT = '#8a7500';
const CORAL_TEXT = '#d94a35';

const TOTAL_ZONES = 5;
const MISPRINT_THRESHOLD = 8; // ΔE ≤ 8 = clean print, > 8 = misprint stamp
const INITIAL_HSB: HSB = { h: 0, s: 0, b: 50 };
const ZONE_MASK_THRESHOLD = 128; // mask gray above this = inside the zone

function scoreColor(score: number): string {
  return score >= 90 ? GRASS_TEXT : score >= 70 ? SUNSHINE_TEXT : CORAL_TEXT;
}

function deltaETier(deltaE: number): { fill: string; text: string } {
  if (deltaE <= 8) return { fill: GRASS, text: GRASS_TEXT };
  if (deltaE <= 25) return { fill: SUNSHINE, text: SUNSHINE_TEXT };
  return { fill: CORAL, text: CORAL_TEXT };
}

function ratingBlurb(label: string): string {
  if (label === 'COLOR MASTER') return 'Near-perfect pitch. This photo walks off the press flawless.';
  if (label === 'COLOR PRO') return 'Press-ready. Only subtle shades slipped past your eye.';
  if (label === 'COLOR APPRENTICE') return 'Solid eye. A little more time at the proofing table.';
  return 'Warming up. Try nailing one channel at a time — and hold PEEK more often.';
}

// ————— Photo manifest (public/pets/photos/<slug>.json) —————
interface PhotoZone {
  id: string;               // z1..z5, manifest order = round order
  part: string;             // English region name from the photo analysis
  pixels: number;
  target: HSB;              // real average HSB of the region in the photo
  completedFill: string;    // hex of that average (for swatches)
}
interface PhotoManifest {
  slug: string;
  name: string;
  nameZh: string;
  size: number;
  rounds: number;
  credit: string;
  files: { orig: string; canvas: string; masks: string[] };
  zones: PhotoZone[];
}

interface ZoneResult {
  zoneId: string;
  part: string;
  deltaE: number;
  score: number;
  targetHex: string;
  guessHex: string;
  misprint: boolean;
  quip: string;
}

type JobPhase = 'select' | 'playing' | 'submitted' | 'finished';

// ————— Photo asset loading —————
// Everything is decoded once per job: the grayscale plate becomes an ImageData
// (the luminance source for lum×ink painting), each mask becomes an alpha
// array plus a sky-blue edge overlay for the active-zone highlight.

type Drawable = ImageBitmap | HTMLImageElement;

async function loadImage(url: string): Promise<Drawable> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const blob = await res.blob();
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(blob);
    } catch {
      // fall through to <img> decoding (older Safari)
    }
  }
  const img = new Image();
  img.src = URL.createObjectURL(blob);
  await img.decode();
  return img;
}

function drawableToImageData(img: Drawable, size: number): ImageData {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, size, size);
  return ctx.getImageData(0, 0, size, size);
}

// Masks are grayscale PNGs (white = zone, black = outside, no alpha channel),
// so the gray value itself is the zone membership. We keep it as an alpha
// array for painting, and build a white-on-transparent canvas for the edge
// overlay (a dilate-minus-original rim, tinted sky blue).
function maskToAlpha(maskImg: Drawable, size: number): Uint8Array {
  const data = drawableToImageData(maskImg, size).data;
  const alpha = new Uint8Array(size * size);
  for (let i = 0; i < size * size; i++) alpha[i] = data[i * 4]; // gray in R
  return alpha;
}

function buildEdgeCanvas(alpha: Uint8Array, size: number, color: string): HTMLCanvasElement {
  // White-on-transparent mask canvas
  const maskC = document.createElement('canvas');
  maskC.width = size;
  maskC.height = size;
  const mctx = maskC.getContext('2d')!;
  const md = mctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const a = alpha[i];
    md.data[i * 4] = 255;
    md.data[i * 4 + 1] = 255;
    md.data[i * 4 + 2] = 255;
    md.data[i * 4 + 3] = a;
  }
  mctx.putImageData(md, 0, 0);

  // Rim = union of small shifts, minus the original mask, tinted.
  const edge = document.createElement('canvas');
  edge.width = size;
  edge.height = size;
  const ctx = edge.getContext('2d')!;
  const shifts: Array<[number, number]> = [[2, 0], [-2, 0], [0, 2], [0, -2]];
  for (const [dx, dy] of shifts) ctx.drawImage(maskC, dx, dy);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.drawImage(maskC, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  return edge;
}

interface PhotoAssets {
  manifest: PhotoManifest;
  size: number;
  grayImg: Drawable;            // grayscale plate, drawn as the base
  grayData: ImageData;          // luminance source for painting
  maskAlpha: Uint8Array[];      // per-zone membership (parallel to zones)
  edges: HTMLCanvasElement[];   // per-zone sky-blue rim overlay
  origUrl: string;
  canvasUrl: string;
}

async function loadPhotoAssets(slug: PetSlug): Promise<PhotoAssets> {
  const base = `/pets/photos/${slug}`;
  const res = await fetch(`${base}.json`);
  if (!res.ok) throw new Error(`HTTP ${res.status} for manifest`);
  const manifest = (await res.json()) as PhotoManifest;
  if (!Array.isArray(manifest.zones) || manifest.zones.length === 0) {
    throw new Error('Manifest has no zones');
  }
  const size = manifest.size || 640;

  const canvasImg = await loadImage(`${base}-canvas.jpg`);
  const grayData = drawableToImageData(canvasImg, size);
  const maskImgs = await Promise.all(manifest.files.masks.map((_, i) => loadImage(`${base}-z${i + 1}.png`)));
  const maskAlpha = maskImgs.map((m) => maskToAlpha(m, size));
  const edges = maskAlpha.map((a) => buildEdgeCanvas(a, size, SKY));

  return {
    manifest,
    size,
    grayImg: canvasImg,
    grayData,
    maskAlpha,
    edges,
    origUrl: `${base}-orig.jpg`,
    canvasUrl: `${base}-canvas.jpg`,
  };
}

// ————— The game board —————
// Persistent paint layer: an ImageData the same size as the plate, initially
// transparent. Submitting a zone writes playerColor × luminance into every
// in-zone pixel; the display canvas = gray plate + paint layer + active rim.
interface PaintLayer {
  canvas: HTMLCanvasElement;
  data: ImageData;
}

function paintZone(
  paint: PaintLayer,
  assets: PhotoAssets,
  zoneIndex: number,
  color: RGB,
): void {
  const { grayData, maskAlpha, size } = assets;
  const mask = maskAlpha[zoneIndex];
  const out = paint.data.data;
  const gray = grayData.data;
  for (let i = 0; i < size * size; i++) {
    if (mask[i] < ZONE_MASK_THRESHOLD) continue;
    const lum = gray[i * 4] / 255; // plate is grayscale: R channel is enough
    out[i * 4] = Math.round(color.r * lum);
    out[i * 4 + 1] = Math.round(color.g * lum);
    out[i * 4 + 2] = Math.round(color.b * lum);
    out[i * 4 + 3] = 255;
  }
  const ctx = paint.canvas.getContext('2d')!;
  ctx.putImageData(paint.data, 0, 0);
}

function PhotoBoard({
  assets,
  paintCanvas,
  paintVersion,
  activeZoneIndex,
  peeking,
  misprints,
  title,
}: {
  assets: PhotoAssets;
  paintCanvas: HTMLCanvasElement | null;
  paintVersion: number;
  activeZoneIndex: number | null;
  peeking: boolean;
  misprints: ZoneResult[];
  title: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !assets) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    const { size, grayImg } = assets;
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(grayImg, 0, 0, size, size);
    if (paintCanvas) ctx.drawImage(paintCanvas, 0, 0);
    if (activeZoneIndex != null && assets.edges[activeZoneIndex]) {
      ctx.drawImage(assets.edges[activeZoneIndex], 0, 0);
    }
  }, [assets, paintCanvas, paintVersion, activeZoneIndex]);

  return (
    <div className="relative swatch-card">
      <div className="relative rounded-[24px] overflow-hidden bg-surface">
        <canvas
          ref={ref}
          width={assets.size}
          height={assets.size}
          className="block w-full h-auto"
          role="img"
          aria-label={title}
        />
        {/* PEEK ORIGINAL — hold to reveal the reference photo */}
        <div
          className="absolute inset-0 transition-opacity duration-150"
          style={{ opacity: peeking ? 1 : 0, pointerEvents: 'none' }}
          aria-hidden={!peeking}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- static game asset, decoded on demand */}
          <img
            src={assets.origUrl}
            alt=""
            className="block w-full h-auto"
            draggable={false}
          />
          <span className="absolute left-3 top-3 inline-block text-[10px] font-medium uppercase tracking-[0.08em] text-white px-2.5 py-1 rounded-full border-2 border-ink bg-ink/80">
            Original photo
          </span>
        </div>
        {misprints.length > 0 && !peeking && (
          <span className="absolute top-3 right-3 flex flex-col items-end gap-1.5" aria-label={`${misprints.length} misprinted zones`}>
            {misprints.map((m) => (
              <span
                key={m.zoneId}
                className="inline-block text-[10px] font-medium uppercase tracking-[0.08em] text-white px-2.5 py-1 rounded-full border-2 border-ink"
                style={{ backgroundColor: CORAL }}
              >
                Misprint · {m.zoneId.toUpperCase()}
              </span>
            ))}
          </span>
        )}
      </div>
      <span className="sr-only">{title}</span>
    </div>
  );
}

// Channel-strip slider (same shape as ColorGame's)
function Slider({
  label, value, min, max, unit, gradient, onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  gradient: string;
  onChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <label htmlFor={id} className="tt-label text-secondary">
          {label}
        </label>
        <span className="tabular text-[14px] text-ink w-14 text-right" aria-hidden="true">
          {String(value).padStart(3, '0')}{unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ background: gradient }}
      />
    </div>
  );
}

// Selection-screen pet thumbnail — the real photo sells the job.
function PetThumb({ slug }: { slug: PetSlug }) {
  return (
    <div className="w-full aspect-square rounded-[24px] overflow-hidden border-2 border-hairline bg-sunken">
      {/* eslint-disable-next-line @next/next/no-img-element -- static game asset */}
      <img
        src={`/pets/photos/${slug}-orig.jpg`}
        alt=""
        loading="lazy"
        className="block w-full h-full object-cover"
      />
    </div>
  );
}

export default function PrintJob({
  initialPet,
  onExit,
  onPractice,
}: {
  initialPet?: string;
  onExit: () => void;
  onPractice: () => void;
}) {
  const [selectedSlug, setSelectedSlug] = useState<PetSlug>(
    (getPet(initialPet ?? '')?.slug as PetSlug | undefined) ?? 'golden-shaded-longhair',
  );
  const [jobSlug, setJobSlug] = useState<PetSlug | null>(null); // active job pet
  const [assets, setAssets] = useState<PhotoAssets | null>(null);
  const [assetsError, setAssetsError] = useState(false);
  const [phase, setPhase] = useState<JobPhase>('select');
  const [mode, setMode] = useState<ColorMode>('hsb');
  const [userHsb, setUserHsb] = useState<HSB>(INITIAL_HSB);
  const [round, setRound] = useState(0); // index into manifest zones
  const [results, setResults] = useState<ZoneResult[]>([]);
  const [stats, setStats] = useState<LabStats>(DEFAULT_STATS);
  const [showCopied, setShowCopied] = useState(false);
  const [shareState, setShareState] = useState<'idle' | 'sharing' | 'done'>('idle');
  const [peeking, setPeeking] = useState(false);
  const [paintVersion, setPaintVersion] = useState(0);
  const [compareOriginal, setCompareOriginal] = useState(false);
  // The paint layer lives in state (it IS render data — the board draws it).
  // Its inner canvas/ImageData are mutated in place on submit; paintVersion
  // bumps to tell the board to repaint.
  const [paint, setPaint] = useState<PaintLayer | null>(null);

  // Read-once stats sync (localStorage; harmless when unavailable)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStats(loadStats());
  }, []);

  const userColor = hsbToRgb(userHsb);
  const userHex = rgbToHex(userColor);
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);

  // ——— Job lifecycle ———
  const startJob = useCallback((slug: PetSlug) => {
    setJobSlug(slug);
    setAssets(null);
    setAssetsError(false);
    setResults([]);
    setRound(0);
    setUserHsb(INITIAL_HSB);
    setPeeking(false);
    setCompareOriginal(false);
    setPaint(null);
    setPaintVersion(0);
    setPhase('playing');
  }, []);

  // Fetch + decode the photo set for the active job pet.
  useEffect(() => {
    if (!jobSlug) return;
    let cancelled = false;
    loadPhotoAssets(jobSlug)
      .then((loaded) => {
        if (cancelled) return;
        const c = document.createElement('canvas');
        c.width = loaded.size;
        c.height = loaded.size;
        const ctx = c.getContext('2d')!;
        const data = ctx.createImageData(loaded.size, loaded.size);
        setPaint({ canvas: c, data });
        setAssets(loaded);
      })
      .catch(() => {
        if (!cancelled) setAssetsError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [jobSlug]);

  const zones = assets?.manifest.zones ?? [];
  const currentZone: PhotoZone | undefined = zones[round];
  const targetRgb: RGB | null = currentZone ? hsbToRgb(currentZone.target) : null;
  const targetHex = targetRgb ? rgbToHex(targetRgb) : '';

  const submitInk = useCallback(() => {
    if (!currentZone || !targetRgb || !assets || !paint) return;
    const deltaE = deltaE2000(targetRgb, userColor);
    const roundScore = calculateScore(deltaE);
    const entry: ZoneResult = {
      zoneId: currentZone.id,
      part: currentZone.part,
      deltaE,
      score: roundScore,
      targetHex,
      guessHex: userHex,
      misprint: deltaE > MISPRINT_THRESHOLD,
      quip: zoneQuip(currentZone.id, deltaE),
    };
    // Paint the zone with the player's ink × photo luminance, then reveal.
    paintZone(paint, assets, round, userColor);
    setPaintVersion((v) => v + 1);

    const newResults = [...results, entry];
    setResults(newResults);

    if (round + 1 >= zones.length) {
      // Job complete — record stats (counts as a played game, not daily).
      const newTotal = newResults.reduce((sum, r) => sum + r.score, 0);
      const now = new Date();
      setStats(prev => {
        const next = recordGame(prev, {
          isDaily: false,
          totalScore: newTotal,
          todayKey: utcDateKey(now),
          yesterdayKey: utcDateKey(new Date(now.getTime() - 86400000)),
        });
        saveStats(next);
        return next;
      });
      setPhase('finished');
    } else {
      setPhase('submitted');
    }
  }, [currentZone, targetRgb, targetHex, userColor, userHex, results, round, zones.length, assets, paint]);

  const nextZone = useCallback(() => {
    setUserHsb(INITIAL_HSB);
    setPeeking(false);
    setRound((r) => r + 1);
    setPhase('playing');
  }, []);

  const nextJob = useCallback(() => {
    if (!jobSlug) return;
    const idx = PETS.findIndex((p) => p.slug === jobSlug);
    const next = PETS[(idx + 1) % PETS.length];
    setSelectedSlug(next.slug);
    startJob(next.slug);
  }, [jobSlug, startJob]);

  // PEEK — hold to see the original photo (pointer + keyboard).
  const peekPress = useCallback(() => setPeeking(true), []);
  const peekRelease = useCallback(() => setPeeking(false), []);

  // ——— Share (simplified text card: pet name + score) ———
  const ratingLabel = ratingLabelForScore(totalScore);
  const meanDeltaE = results.length > 0
    ? results.reduce((sum, r) => sum + r.deltaE, 0) / results.length
    : 0;

  const buildShareText = useCallback(() => {
    if (!assets) return '';
    const m = assets.manifest;
    return `ToonTone Proofing Lab — PRINT JOB\nPet: ${m.name} · ${m.nameZh}\nScore: ${totalScore}/${TOTAL_ZONES * 100} · ${ratingLabelForScore(totalScore)}\nMean ΔE ${meanDeltaE.toFixed(2)} across ${results.length} photo zones\nhttps://toontonegame.org/?pet=${m.slug}&mode=printjob&utm_source=share&utm_medium=copy`;
  }, [assets, totalScore, meanDeltaE, results.length]);

  const copyResult = useCallback(() => {
    navigator.clipboard.writeText(buildShareText()).catch(() => {
      // Clipboard can be unavailable (permissions, non-secure context); ignore.
    });
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  }, [buildShareText]);

  const buildCardData = useCallback((): ShareCardData | null => {
    if (!assets) return null;
    return {
      totalScore,
      ratingLabel: ratingLabelForScore(totalScore),
      ratingColor: totalScore / TOTAL_ZONES >= 90 ? GRASS_TEXT : totalScore / TOTAL_ZONES >= 75 ? GRASS_TEXT : totalScore / TOTAL_ZONES >= 60 ? SUNSHINE_TEXT : CORAL_TEXT,
      dateLine: `PRINT JOB · ${assets.manifest.name.toUpperCase()}`,
      rounds: results.map((r) => ({ target: r.targetHex, guess: r.guessHex, score: r.score })),
      meanDeltaE,
    };
  }, [assets, totalScore, results, meanDeltaE]);

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const shareNative = useCallback(async () => {
    if (!canNativeShare) return;
    setShareState('sharing');
    const text = buildShareText();
    try {
      const data = buildCardData();
      const file = data ? await shareCardFile(data, 'toontone-print-job.png') : null;
      const files = file ? [file] : [];
      if (files.length > 0 && navigator.canShare?.({ files })) {
        await navigator.share({ text, files });
      } else {
        await navigator.share({ text });
      }
      setShareState('done');
      window.setTimeout(() => setShareState('idle'), 2500);
    } catch {
      // AbortError = user closed the sheet; swallow — Copy/Download remain.
      setShareState('idle');
    }
  }, [canNativeShare, buildShareText, buildCardData]);

  const downloadCard = useCallback(() => {
    const data = buildCardData();
    if (data) downloadShareCard(data, 'toontone-print-job.png');
  }, [buildCardData]);

  // ——— Sliders (HSB/RGB/CMYK — all edit the single HSB source of truth) ———
  const renderSliders = () => {
    if (mode === 'hsb') {
      const hsb = userHsb;
      return (
        <>
          <Slider label="Hue" value={Math.round(hsb.h)} min={0} max={360} unit="°"
            gradient="linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)"
            onChange={(v) => setUserHsb({ ...hsb, h: v })} />
          <Slider label="Saturation" value={Math.round(hsb.s)} min={0} max={100} unit="%"
            gradient={`linear-gradient(to right, gray, ${rgbToHex(hsbToRgb({ ...hsb, s: 100 }))})`}
            onChange={(v) => setUserHsb({ ...hsb, s: v })} />
          <Slider label="Brightness" value={Math.round(hsb.b)} min={0} max={100} unit="%"
            gradient={`linear-gradient(to right, black, ${rgbToHex(hsbToRgb({ ...hsb, b: 100 }))})`}
            onChange={(v) => setUserHsb({ ...hsb, b: v })} />
        </>
      );
    }
    if (mode === 'rgb') {
      const rgb = userColor;
      return (
        <>
          <Slider label="Red" value={rgb.r} min={0} max={255} unit=""
            gradient="linear-gradient(to right, #000, #f00)"
            onChange={(v) => setUserHsb(rgbToHsbPrecise({ ...rgb, r: v }))} />
          <Slider label="Green" value={rgb.g} min={0} max={255} unit=""
            gradient="linear-gradient(to right, #000, #0f0)"
            onChange={(v) => setUserHsb(rgbToHsbPrecise({ ...rgb, g: v }))} />
          <Slider label="Blue" value={rgb.b} min={0} max={255} unit=""
            gradient="linear-gradient(to right, #000, #00f)"
            onChange={(v) => setUserHsb(rgbToHsbPrecise({ ...rgb, b: v }))} />
        </>
      );
    }
    const cmyk = rgbToCmyk(userColor);
    return (
      <>
        <Slider label="Cyan" value={cmyk.c} min={0} max={100} unit="%"
          gradient="linear-gradient(to right, white, #00bcd4)"
          onChange={(v) => setUserHsb(rgbToHsbPrecise(cmykToRgb({ ...cmyk, c: v })))} />
        <Slider label="Magenta" value={cmyk.m} min={0} max={100} unit="%"
          gradient="linear-gradient(to right, white, #e91e63)"
          onChange={(v) => setUserHsb(rgbToHsbPrecise(cmykToRgb({ ...cmyk, m: v })))} />
        <Slider label="Yellow" value={cmyk.y} min={0} max={100} unit="%"
          gradient="linear-gradient(to right, white, #ffeb3b)"
          onChange={(v) => setUserHsb(rgbToHsbPrecise(cmykToRgb({ ...cmyk, y: v })))} />
        <Slider label="Key (Black)" value={cmyk.k} min={0} max={100} unit="%"
          gradient="linear-gradient(to right, white, black)"
          onChange={(v) => setUserHsb(rgbToHsbPrecise(cmykToRgb({ ...cmyk, k: v })))} />
      </>
    );
  };

  // Mode pill row shared by every PrintJob screen (Daily/Practice return here)
  const modeLine = (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
      <span className="flex items-center gap-2" role="group" aria-label="Game mode">
        <button onClick={onExit} className="btn-pill btn-ghost px-5 py-2 text-[13px]">
          Daily
        </button>
        <button onClick={onPractice} className="btn-pill btn-ghost px-5 py-2 text-[13px]">
          Practice
        </button>
        <button
          aria-pressed="true"
          className="btn-pill px-5 py-2 text-[13px] bg-ink text-surface border-2 border-ink"
        >
          Print Jobs
        </button>
      </span>
      <p className="tt-label tabular text-secondary">
        Print Jobs · Re-ink a real pet photo, zone by zone
      </p>
    </div>
  );

  // ═════════ Screen 1 — pet selection ═════════
  if (phase === 'select') {
    return (
      <>
        {modeLine}
        <section className="sticker-card mt-6 p-5 md:p-10">
          <h1 className="tt-display text-ink max-w-[14ch]">
            Print jobs.
          </h1>
          <p className="text-[15px] md:text-[17px] text-secondary mt-3 max-w-[56ch]">
            Pick a pet off the job board. You get the original photo and a
            color-stripped plate — five photo zones, five rounds. Match each
            zone&apos;s real average color and your calibration becomes its fur.
            Hold <strong className="text-ink">PEEK ORIGINAL</strong> any time to
            check the reference; miss the mark and the press stamps it a misprint.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8" role="radiogroup" aria-label="Choose a pet">
            {PETS.map((pet) => {
              const selected = pet.slug === selectedSlug;
              return (
                <button
                  key={pet.slug}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setSelectedSlug(pet.slug)}
                  className={`text-left rounded-[34px] border-2 p-4 transition-colors ${
                    selected
                      ? 'border-ink bg-canvas'
                      : 'border-hairline bg-surface hover:border-ink'
                  }`}
                >
                  <PetThumb slug={pet.slug} />
                  <span className="block mt-3 text-[15px] font-medium text-ink leading-tight">
                    {pet.name}
                  </span>
                  <span className="block mt-0.5 tt-label text-secondary">
                    {pet.nameZh}
                    {selected && <span className="ml-2" style={{ color: GRASS_TEXT }}>✓ Selected</span>}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={() => startJob(selectedSlug)}
              className="btn-pill btn-grass px-10 py-3.5 text-[14px]"
            >
              Start print job
            </button>
            <p className="tt-label text-secondary">
              {TOTAL_ZONES} photo zones · scored by ΔE (CIEDE2000) · total /500
            </p>
          </div>
          <p className="tt-label text-secondary mt-4">
            Photos · TheCatAPI (public pet photo service)
          </p>
        </section>
      </>
    );
  }

  // ═════════ Fetch failures — graceful text-card fallback ═════════
  if (assetsError) {
    const pet = getPet(jobSlug ?? '');
    return (
      <>
        {modeLine}
        <section className="sticker-card mt-6 p-6 md:p-10" role="alert">
          <p className="tt-label text-secondary">Print job</p>
          <h1 className="tt-heading text-ink mt-2">
            {pet ? `${pet.name} · ${pet.nameZh}` : 'This pet'}
          </h1>
          <p className="text-[15px] text-secondary mt-3 max-w-[52ch]">
            The photo plates for this job are missing from the shelf (the
            artwork could not be loaded). Head back and pick another pet.
          </p>
          <button onClick={() => setPhase('select')} className="btn-pill btn-ink px-8 py-3 mt-6">
            ← Back to job board
          </button>
        </section>
      </>
    );
  }

  // ═════════ Screen 3 — finished (your print vs the original) ═════════
  if (phase === 'finished' && assets) {
    const m = assets.manifest;
    return (
      <>
        {modeLine}
        <section className="sticker-card mt-6 p-6 md:p-10" role="status" aria-live="polite">
          <div className="flex flex-wrap items-start justify-between gap-8 border-b border-hairline pb-8">
            <div>
              <p className="tt-label text-secondary">Print job report</p>
              <h2 className="tt-heading text-ink mt-2">
                {m.name} · {m.nameZh}
              </h2>
              <p className="tabular text-[56px] md:text-[72px] leading-none tracking-[-0.04em] text-ink mt-5">
                {totalScore}
                <span className="text-[22px] text-secondary"> /{TOTAL_ZONES * 100}</span>
              </p>
              <p className="tabular text-[14px] text-secondary mt-3">
                AVG {(totalScore / TOTAL_ZONES).toFixed(1)} · MEAN ΔE {meanDeltaE.toFixed(2)} · {ratingLabel}
              </p>
              <p className="tt-label text-secondary mt-3">
                Lab best <span className="text-ink">{stats.bestScore}</span> · Jobs played <span className="text-ink">{stats.played}</span>
              </p>
              <p className="text-[15px] text-secondary mt-3">{ratingBlurb(ratingLabel)}</p>
            </div>

            {/* The finished photo — player's inks, switchable against original */}
            <div className="w-full max-w-[320px] md:max-w-[380px]">
              <div className="flex items-center justify-between px-3 mb-3">
                <span className="tt-label text-secondary">
                  {compareOriginal ? 'Original photo' : 'Your print'}
                </span>
                <span className="flex gap-1.5" role="group" aria-label="Compare print with original">
                  <button
                    onClick={() => setCompareOriginal(false)}
                    aria-pressed={!compareOriginal}
                    className={`btn-pill px-4 py-1.5 text-[12px] ${!compareOriginal ? 'bg-ink text-surface border-2 border-ink' : 'btn-ghost'}`}
                  >
                    Your print
                  </button>
                  <button
                    onClick={() => setCompareOriginal(true)}
                    aria-pressed={compareOriginal}
                    className={`btn-pill px-4 py-1.5 text-[12px] ${compareOriginal ? 'bg-ink text-surface border-2 border-ink' : 'btn-ghost'}`}
                  >
                    Original
                  </button>
                </span>
              </div>
              {compareOriginal ? (
                <div className="swatch-card">
                  <div className="rounded-[24px] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element -- static game asset */}
                    <img
                      src={assets.origUrl}
                      alt={`Original photo of ${m.name}`}
                      width={assets.size}
                      height={assets.size}
                      className="block w-full h-auto"
                    />
                  </div>
                </div>
              ) : (
                <PhotoBoard
                  assets={assets}
                  paintCanvas={paint?.canvas ?? null}
                  paintVersion={paintVersion}
                  activeZoneIndex={null}
                  peeking={false}
                  misprints={results.filter((r) => r.misprint)}
                  title={`Completed photo print of ${m.name}`}
                />
              )}
              <p className="tt-label text-secondary px-3 mt-3">
                Photo · {assets.manifest.credit}
              </p>
            </div>
          </div>

          {/* Per-zone breakdown */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full tabular text-[14px] text-ink">
              <thead>
                <tr className="border-b border-hairline text-left text-[12px] uppercase tracking-wide text-secondary">
                  <th className="py-2 font-medium">Zone</th>
                  <th className="py-2 font-medium">Region</th>
                  <th className="py-2 font-medium">Target</th>
                  <th className="py-2 font-medium">Your ink</th>
                  <th className="py-2 font-medium">ΔE</th>
                  <th className="py-2 font-medium text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={r.zoneId} className="qc-row border-b border-hairline" style={{ animationDelay: `${i * 80}ms` }}>
                    <td className="py-2.5">{r.zoneId.toUpperCase()}</td>
                    <td className="py-2.5">
                      {r.part}
                      {r.misprint && (
                        <span
                          className="ml-2 inline-block text-[10px] uppercase tracking-[0.08em] text-white px-2 py-0.5 rounded-full border border-ink align-middle"
                          style={{ backgroundColor: CORAL }}
                        >
                          Misprint
                        </span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <span className="inline-block w-4 h-4 rounded-[4px] border border-ink align-[-3px] mr-2" style={{ backgroundColor: r.targetHex }} role="img" aria-label={`Target color ${r.targetHex}`} />
                      {r.targetHex}
                    </td>
                    <td className="py-2.5">
                      <span className="inline-block w-4 h-4 rounded-[4px] border border-ink align-[-3px] mr-2" style={{ backgroundColor: r.guessHex }} role="img" aria-label={`Your ink ${r.guessHex}`} />
                      {r.guessHex}
                    </td>
                    <td className="py-2.5">{r.deltaE.toFixed(2)}</td>
                    <td className="py-2.5 text-right font-medium" style={{ color: scoreColor(r.score) }}>{r.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Share actions */}
          <div className="mt-8 flex flex-wrap gap-3">
            {canNativeShare && (
              <button
                onClick={shareNative}
                disabled={shareState === 'sharing'}
                className="btn-pill btn-grass px-7 py-3 disabled:opacity-60"
              >
                {shareState === 'sharing' ? 'Sharing…' : shareState === 'done' ? '✓ Shared' : 'Share'}
              </button>
            )}
            <button onClick={downloadCard} className="btn-pill btn-ink px-7 py-3">
              Download Card
            </button>
            <button onClick={copyResult} className="btn-pill btn-ghost px-7 py-3">
              {showCopied ? '✓ Copied' : 'Copy Result'}
            </button>
            <button onClick={nextJob} className="btn-pill btn-ghost px-7 py-3">
              Next job →
            </button>
            <button onClick={() => setPhase('select')} className="btn-pill btn-quiet px-7 py-3">
              Job board
            </button>
          </div>
        </section>
      </>
    );
  }

  // ═════════ Screen 2 — calibration (playing / submitted) ═════════
  if (!assets || !currentZone || !targetRgb) {
    // Manifest or photo plates still loading
    return (
      <>
        {modeLine}
        <section className="sticker-card mt-6 p-5 md:p-10">
          <div className="py-16 sr-only">Loading print job…</div>
          <div className="py-16" aria-hidden="true" />
        </section>
      </>
    );
  }

  const liveDeltaE = deltaE2000(targetRgb, userColor);
  const tier = deltaETier(liveDeltaE);
  const lastResult = results[results.length - 1];
  const zoneLabel = `${currentZone.part}`;

  return (
    <>
      {modeLine}
      <section className="sticker-card mt-6 p-5 md:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="tt-label text-secondary">
              Print job · {assets.manifest.name} · {assets.manifest.nameZh}
            </p>
            <h1 className="tt-heading text-ink mt-2 max-w-[22ch]">
              Ink zone {String(round + 1).padStart(2, '0')}: {zoneLabel}
            </h1>
          </div>
          <button onClick={() => setPhase('select')} className="btn-pill btn-quiet px-4 py-1.5 text-[12px]">
            ← Job board
          </button>
        </div>

        <div className="grid gap-x-8 gap-y-8 md:grid-cols-12 mt-8">
          {/* Left (top on mobile): the grayscale photo filling up zone by zone */}
          <div className="md:col-span-5">
            <PhotoBoard
              assets={assets}
              paintCanvas={paint?.canvas ?? null}
              paintVersion={paintVersion}
              activeZoneIndex={phase === 'playing' ? round : null}
              peeking={peeking}
              misprints={results.filter((r) => r.misprint)}
              title={`${assets.manifest.name} photo print in progress`}
            />
            <p className="tt-label text-secondary px-3 mt-3">
              Zones inked <span className="text-ink">{results.length}/{zones.length}</span>
              {phase === 'playing' && (
                <span className="ml-2" style={{ color: '#1877c9' }}>
                  ◆ inking: {currentZone.id.toUpperCase()}
                </span>
              )}
            </p>

            {/* Zone progress dots */}
            <div className="flex gap-2 px-3 mt-3" aria-hidden="true">
              {zones.map((z, i) => {
                const done = results[i];
                const active = i === round && phase !== 'submitted';
                return (
                  <span
                    key={z.id}
                    className="h-3 flex-1 rounded-full border border-ink"
                    style={{
                      backgroundColor: done ? (done.misprint ? CORAL : GRASS) : active ? SKY : '#e0dbce',
                    }}
                  />
                );
              })}
            </div>

            {/* PEEK ORIGINAL — hold to compare against the reference photo */}
            <div className="px-3 mt-4">
              <button
                onPointerDown={peekPress}
                onPointerUp={peekRelease}
                onPointerLeave={peekRelease}
                onPointerCancel={peekRelease}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    peekPress();
                  }
                }}
                onKeyUp={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') peekRelease();
                }}
                onContextMenu={(e) => e.preventDefault()}
                aria-pressed={peeking}
                aria-label="Hold to peek at the original photo"
                className="btn-pill btn-ink w-full px-6 py-3 select-none"
                style={{ touchAction: 'none' }}
              >
                {peeking ? '👁 Original…' : 'Hold to peek original'}
              </button>
              <p className="tt-label text-secondary mt-2">
                Press and hold — the original photo is your reference.
              </p>
            </div>
          </div>

          {/* Right: target + sliders + submit/feedback */}
          <div className="md:col-span-7 flex flex-col">
            <div className="order-1 flex justify-between tt-label text-secondary">
              <span>Zone {String(round + 1).padStart(2, '0')}/{String(zones.length).padStart(2, '0')}</span>
              <span>Total {totalScore} / {TOTAL_ZONES * 100}</span>
            </div>
            <div className="order-2 h-2 bg-sunken rounded-full mt-2" aria-hidden="true">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{ width: `${(results.length / zones.length) * 100}%`, backgroundColor: GRASS }}
              />
            </div>

            {/* Target swatch + your ink */}
            <div className="order-2 grid grid-cols-2 gap-4 mt-6">
              <div>
                <div className="swatch-card">
                  <div
                    key={`dev-${round}-${targetHex}`}
                    className="relative h-28 md:h-36 rounded-[24px] overflow-hidden develop-overlay-wrap"
                    style={{ backgroundColor: targetHex }}
                    role="img"
                    aria-label={`Target color ${targetHex}`}
                  >
                    <span key={`dev-${round}-${targetHex}`} className="develop-overlay" />
                  </div>
                </div>
                <p className="tt-label text-secondary px-3 mt-2">
                  Target <span className="text-ink">{targetHex}</span>
                </p>
              </div>
              <div>
                <div className="swatch-card">
                  <div
                    className="relative h-28 md:h-36 rounded-[24px] overflow-hidden"
                    style={{ backgroundColor: userHex }}
                    role="img"
                    aria-label={`Your ink ${userHex}`}
                  />
                </div>
                <p className="tt-label text-secondary px-3 mt-2">
                  Your ink <span className="text-ink">{userHex}</span>
                </p>
              </div>
            </div>

            <div className="order-3 mt-6 bg-sunken rounded-[34px] p-5 md:p-6">
              {/* Color model switch — all three modes feed the same HSB truth */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                <span className="tt-label text-secondary">Color model</span>
                <span className="flex gap-1.5" role="group" aria-label="Color mode">
                  {(['hsb', 'rgb', 'cmyk'] as ColorMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      aria-pressed={mode === m}
                      className={`btn-pill px-4 py-1.5 text-[12px] ${
                        mode === m
                          ? 'bg-ink text-surface border-2 border-ink'
                          : 'btn-ghost'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </span>
              </div>
              <div className="space-y-5">
                {renderSliders()}
              </div>
            </div>

            {/* Live ΔE — simplified readout */}
            <div className="order-3 mt-4 flex items-center gap-3 px-2" aria-hidden="true">
              <span className="w-3 h-3 rounded-full border border-ink shrink-0" style={{ backgroundColor: tier.fill }} />
              <span className="tabular text-[15px]" style={{ color: tier.text }}>
                Live ΔE {Math.min(99.9, liveDeltaE).toFixed(1)}
              </span>
            </div>

            {phase === 'playing' ? (
              <div className="order-4 mt-6 max-md:sticky max-md:bottom-0 max-md:bg-surface max-md:py-3 max-md:border-t max-md:border-hairline">
                <button onClick={submitInk} className="btn-pill btn-grass w-full md:w-auto px-10 py-3.5 text-[14px]">
                  Submit ink
                </button>
              </div>
            ) : (
              <div className="order-4 mt-6 border-t border-hairline pt-5" role="status" aria-live="polite">
                <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
                  <p className="tabular text-[48px] leading-none tracking-[-0.03em] text-ink">
                    {lastResult?.score ?? 0}
                    <span className="text-[20px] text-secondary">/100</span>
                  </p>
                  <p className="tabular text-[14px] text-secondary pb-1">
                    ΔE {(lastResult?.deltaE ?? 0).toFixed(2)}
                    {lastResult?.misprint && (
                      <span
                        className="ml-2 inline-block text-[10px] uppercase tracking-[0.08em] text-white px-2 py-0.5 rounded-full border border-ink"
                        style={{ backgroundColor: CORAL }}
                      >
                        Misprint
                      </span>
                    )}
                  </p>
                </div>
                <p className="text-[15px] text-secondary mt-2">{lastResult?.quip}</p>
                <div className="mt-4 flex gap-3">
                  <button onClick={nextZone} className="btn-pill btn-ink px-8 py-3">
                    {round + 1 >= zones.length ? 'See results' : `Next zone ${round + 2}/${zones.length}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
