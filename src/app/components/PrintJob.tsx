'use client';

// PRINT JOB — the third game mode. Calibrate a pet, one ink zone at a time:
// 5 rounds = the 5 data-zone regions of the pet's line art. Each round the
// player matches that zone's target HSB with the familiar sliders; on submit
// the zone is filled with the PLAYER's color (the closer the calibration, the
// closer the print to the spec). ΔE>8 stamps a coral "misprint" marker.
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

function scoreColor(score: number): string {
  return score >= 90 ? GRASS_TEXT : score >= 70 ? SUNSHINE_TEXT : CORAL_TEXT;
}

function deltaETier(deltaE: number): { fill: string; text: string } {
  if (deltaE <= 8) return { fill: GRASS, text: GRASS_TEXT };
  if (deltaE <= 25) return { fill: SUNSHINE, text: SUNSHINE_TEXT };
  return { fill: CORAL, text: CORAL_TEXT };
}

function ratingBlurb(label: string): string {
  if (label === 'COLOR MASTER') return 'Near-perfect pitch. This pet walks off the press flawless.';
  if (label === 'COLOR PRO') return 'Press-ready. Only subtle shades slipped past your eye.';
  if (label === 'COLOR APPRENTICE') return 'Solid eye. A little more time at the proofing table.';
  return 'Warming up. Try nailing one channel at a time.';
}

// Fetched spec shape (public/pets/<slug>.spec.json)
interface SpecZone {
  id: string;
  part: string;
  completedFill: string;
  target: HSB;
  note: string;
}
interface PetSpec {
  slug: string;
  name: string;
  nameZh: string;
  zones: SpecZone[];
  personality: string;
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

// ————— SVG injection —————
// The fetched line art is injected raw (our own static asset), then a DOM
// pass sets per-zone fills. Shapes explicitly marked stroke="none" (e.g. ink
// pupils) keep their own fill; open detail strokes stay fill-less.
function PetSvg({
  svgText,
  fills,
  activeZone,
  className,
}: {
  svgText: string;
  fills: Record<string, string>;
  activeZone?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const groups = el.querySelectorAll<SVGGElement>('[data-zone]');
    groups.forEach((g) => {
      const zid = g.getAttribute('data-zone') ?? '';
      const fill = fills[zid];
      g.setAttribute('stroke', activeZone === zid ? SKY : '#2c2e2a');
      g.querySelectorAll('*').forEach((shape) => {
        const tag = shape.tagName.toLowerCase();
        if (!['path', 'circle', 'ellipse', 'polygon', 'rect'].includes(tag)) return;
        if (shape.getAttribute('stroke') === 'none') return; // ink details
        shape.setAttribute('fill', fill ?? 'none');
      });
    });
  }, [svgText, fills, activeZone]);

  return (
    <div
      ref={ref}
      className={`pet-svg ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: svgText }}
      aria-hidden={className?.includes('sr-only') ? true : undefined}
    />
  );
}

// Tiny fetch hook for a pet's raw SVG text, with error fallback. State is a
// single {slug, text, error} record set asynchronously on resolve, so a slug
// change simply leaves stale state behind until the new fetch lands.
function usePetSvg(slug: string | null) {
  const [state, setState] = useState<{ slug: string; text: string | null; error: boolean }>({
    slug: '',
    text: null,
    error: false,
  });

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetch(`/pets/${slug}.svg`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((text) => {
        if (!cancelled) setState({ slug, text, error: false });
      })
      .catch(() => {
        if (!cancelled) setState({ slug, text: null, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!slug || state.slug !== slug) return { svgText: null, error: false };
  return { svgText: state.text, error: state.error };
}

// ————— Selection-screen pet thumbnail —————
function PetThumb({ slug }: { slug: PetSlug }) {
  const { svgText, error } = usePetSvg(slug);
  if (error) {
    return (
      <div className="w-full aspect-square flex items-center justify-center bg-sunken rounded-[24px] text-[12px] text-secondary px-2 text-center">
        Plate missing
      </div>
    );
  }
  if (!svgText) {
    return <div className="w-full aspect-square bg-sunken rounded-[24px]" aria-hidden="true" />;
  }
  return (
    <div className="w-full aspect-square bg-surface rounded-[24px] overflow-hidden p-2">
      <PetSvg svgText={svgText} fills={{}} />
    </div>
  );
}

// ————— Line-art plate with fills + misprint stamps —————
function PetPlate({
  svgText,
  results,
  activeZone,
  title,
}: {
  svgText: string;
  results: ZoneResult[];
  activeZone?: string;
  title: string;
}) {
  const fills: Record<string, string> = {};
  const misprints: ZoneResult[] = [];
  results.forEach((r) => {
    fills[r.zoneId] = r.guessHex;
    if (r.misprint) misprints.push(r);
  });

  return (
    <div className="relative swatch-card">
      <div className="rounded-[24px] overflow-hidden bg-surface">
        <PetSvg svgText={svgText} fills={fills} activeZone={activeZone} />
      </div>
      {misprints.length > 0 && (
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
  const [spec, setSpec] = useState<PetSpec | null>(null);
  const [specError, setSpecError] = useState(false);
  const [phase, setPhase] = useState<JobPhase>('select');
  const [mode, setMode] = useState<ColorMode>('hsb');
  const [userHsb, setUserHsb] = useState<HSB>(INITIAL_HSB);
  const [round, setRound] = useState(0); // index into spec.zones
  const [results, setResults] = useState<ZoneResult[]>([]);
  const [stats, setStats] = useState<LabStats>(DEFAULT_STATS);
  const [showCopied, setShowCopied] = useState(false);
  const [shareState, setShareState] = useState<'idle' | 'sharing' | 'done'>('idle');

  const { svgText, error: svgError } = usePetSvg(jobSlug);

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
    setSpec(null);
    setSpecError(false);
    setResults([]);
    setRound(0);
    setUserHsb(INITIAL_HSB);
    setPhase('playing');
  }, []);

  // Fetch the spec for the active job pet (zones drive round order).
  useEffect(() => {
    if (!jobSlug) return;
    let cancelled = false;
    fetch(`/pets/${jobSlug}.spec.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<PetSpec>;
      })
      .then((data) => {
        if (!cancelled && Array.isArray(data.zones) && data.zones.length > 0) setSpec(data);
        else if (!cancelled) setSpecError(true);
      })
      .catch(() => {
        if (!cancelled) setSpecError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [jobSlug]);

  const zones = spec?.zones ?? [];
  const currentZone: SpecZone | undefined = zones[round];
  const targetRgb: RGB | null = currentZone ? hsbToRgb(currentZone.target) : null;
  const targetHex = targetRgb ? rgbToHex(targetRgb) : '';

  const submitInk = useCallback(() => {
    if (!currentZone || !targetRgb) return;
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
    const newResults = [...results, entry];
    setResults(newResults);

    if (round + 1 >= TOTAL_ZONES || round + 1 >= zones.length) {
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
  }, [currentZone, targetRgb, targetHex, userColor, userHex, results, round, zones.length]);

  const nextZone = useCallback(() => {
    setUserHsb(INITIAL_HSB);
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

  // ——— Share (simplified text card: pet name + score) ———
  const ratingLabel = ratingLabelForScore(totalScore);
  const meanDeltaE = results.length > 0
    ? results.reduce((sum, r) => sum + r.deltaE, 0) / results.length
    : 0;

  const buildShareText = useCallback(() => {
    if (!spec) return '';
    return `ToonTone Proofing Lab — PRINT JOB\nPet: ${spec.name} · ${spec.nameZh}\nScore: ${totalScore}/${TOTAL_ZONES * 100} · ${ratingLabelForScore(totalScore)}\nMean ΔE ${meanDeltaE.toFixed(2)} across ${results.length} ink zones\nhttps://toontonegame.org/?pet=${spec.slug}&mode=printjob&utm_source=share&utm_medium=copy`;
  }, [spec, totalScore, meanDeltaE, results.length]);

  const copyResult = useCallback(() => {
    navigator.clipboard.writeText(buildShareText()).catch(() => {
      // Clipboard can be unavailable (permissions, non-secure context); ignore.
    });
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  }, [buildShareText]);

  const buildCardData = useCallback((): ShareCardData | null => {
    if (!spec) return null;
    return {
      totalScore,
      ratingLabel: ratingLabelForScore(totalScore),
      ratingColor: totalScore / TOTAL_ZONES >= 90 ? GRASS_TEXT : totalScore / TOTAL_ZONES >= 75 ? GRASS_TEXT : totalScore / TOTAL_ZONES >= 60 ? SUNSHINE_TEXT : CORAL_TEXT,
      dateLine: `PRINT JOB · ${spec.name.toUpperCase()}`,
      rounds: results.map((r) => ({ target: r.targetHex, guess: r.guessHex, score: r.score })),
      meanDeltaE,
    };
  }, [spec, totalScore, results, meanDeltaE]);

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
        Print Jobs · Calibrate a pet, zone by zone
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
            Pick a pet off the job board. Five ink zones, five rounds — match each
            zone&apos;s target color and your calibration becomes its coat. Miss the
            mark and the press stamps it a misprint.
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
              {TOTAL_ZONES} zones · scored by ΔE (CIEDE2000) · total /500
            </p>
          </div>
        </section>
      </>
    );
  }

  // ═════════ Fetch failures — graceful text-card fallback ═════════
  if (specError || svgError) {
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
            The printing plates for this job are missing from the shelf (the
            artwork could not be loaded). Head back and pick another pet.
          </p>
          <button onClick={() => setPhase('select')} className="btn-pill btn-ink px-8 py-3 mt-6">
            ← Back to job board
          </button>
        </section>
      </>
    );
  }

  // ═════════ Screen 3 — finished ═════════
  if (phase === 'finished' && spec) {
    const petInfo = getPet(spec.slug);
    return (
      <>
        {modeLine}
        <section className="sticker-card mt-6 p-6 md:p-10" role="status" aria-live="polite">
          <div className="flex flex-wrap items-start justify-between gap-8 border-b border-hairline pb-8">
            <div>
              <p className="tt-label text-secondary">Print job report</p>
              <h2 className="tt-heading text-ink mt-2">
                {spec.name} · {spec.nameZh}
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

            {/* The finished pet — big, colored by the player's own inks */}
            {svgText && (
              <div className="w-full max-w-[320px] md:max-w-[360px]">
                <PetPlate svgText={svgText} results={results} title={`Completed print of ${spec.name}`} />
              </div>
            )}
          </div>

          {/* Per-zone breakdown */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full tabular text-[14px] text-ink">
              <thead>
                <tr className="border-b border-hairline text-left text-[12px] uppercase tracking-wide text-secondary">
                  <th className="py-2 font-medium">Zone</th>
                  <th className="py-2 font-medium">Part</th>
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
                      {petInfo?.zones[i]?.partEn ?? r.part}
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
  if (!spec || !svgText || !currentZone || !targetRgb) {
    // Spec or artwork still loading
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

  return (
    <>
      {modeLine}
      <section className="sticker-card mt-6 p-5 md:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="tt-label text-secondary">
              Print job · {spec.name} · {spec.nameZh}
            </p>
            <h1 className="tt-heading text-ink mt-2 max-w-[18ch]">
              Ink zone {String(round + 1).padStart(2, '0')}: {getPet(spec.slug)?.zones[round]?.partEn ?? currentZone.part}
            </h1>
          </div>
          <button onClick={() => setPhase('select')} className="btn-pill btn-quiet px-4 py-1.5 text-[12px]">
            ← Job board
          </button>
        </div>

        <div className="grid gap-x-8 gap-y-8 md:grid-cols-12 mt-8">
          {/* Left (top on mobile): the pet line art filling up zone by zone */}
          <div className="md:col-span-5">
            <PetPlate
              svgText={svgText}
              results={results}
              activeZone={phase === 'playing' ? currentZone.id : undefined}
              title={`${spec.name} print in progress`}
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
