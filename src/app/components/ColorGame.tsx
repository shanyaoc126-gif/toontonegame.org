'use client';

import { useState, useCallback, useEffect, useId, useRef } from 'react';
import {
  RGB, HSB, ColorMode,
  generateRandomColor, hsbToRgb, rgbToHsbPrecise, rgbToCmyk, cmykToRgb,
  deltaE2000, calculateScore, rgbToHex,
} from '../lib/color-utils';
import { utcDateKey, dailyColors, msUntilUtcMidnight, formatCountdown } from '../lib/daily';
import { LabStats, DEFAULT_STATS, loadStats, saveStats, recordGame, ratingLabelForScore } from '../lib/stats';
import { downloadShareCard, shareCardFile, ShareCardData } from '../lib/share-card';
import {
  markCalibrated, loadCbAssist, saveCbAssist,
  shapesForHsb, shapeCodeLabel,
} from '../lib/calibration';
import { visionGradeFor, VISION_FOOTNOTE } from '../lib/vision';
import StatsModal from './StatsModal';
import CalibrationRitual from './CalibrationRitual';
import ShapeBadge from './ShapeBadge';

type GameState = 'idle' | 'playing' | 'submitted' | 'finished';
type GameMode = 'daily' | 'practice';

const TOTAL_ROUNDS = 5;
const INITIAL_HSB: HSB = { h: 0, s: 0, b: 50 };

interface RoundResult {
  round: number;
  score: number;
  deltaE: number;
  target: string;
  guess: string;
}

// ————— MindMarket palette —————
// Pure pop colors for fills/bars/dots; darkened same-hue variants wherever
// the color is used AS TEXT on white (WCAG contrast), semantics unchanged.
const GRASS = '#8ed462';
const SUNSHINE = '#f5e211';
const CORAL = '#ff705d';
const GRASS_TEXT = '#4d8b31';
const SUNSHINE_TEXT = '#8a7500';
const CORAL_TEXT = '#d94a35';

function scoreColor(score: number): string {
  return score >= 90 ? GRASS_TEXT : score >= 70 ? SUNSHINE_TEXT : CORAL_TEXT;
}

function ratingFor(average: number): { label: string; blurb: string; color: string } {
  if (average >= 90) return { label: 'COLOR MASTER', blurb: 'Near-perfect pitch. This proof passes on the first pull.', color: GRASS_TEXT };
  if (average >= 75) return { label: 'COLOR PRO', blurb: 'Press-ready. Only subtle shades slip past your eye.', color: GRASS_TEXT };
  if (average >= 60) return { label: 'COLOR APPRENTICE', blurb: 'Solid eye. A little more time at the proofing table.', color: SUNSHINE_TEXT };
  return { label: 'COLOR NOVICE', blurb: 'Warming up. Try nailing one channel at a time.', color: CORAL_TEXT };
}

// Numeric readout that counts up on mount / value change (300ms).
// Falls back to the final value instantly under prefers-reduced-motion.
function CountUp({ value, decimals = 0, duration = 300 }: { value: number; decimals?: number; duration?: number }) {
  const reduced = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    if (reduced) return; // render `value` directly; no animation
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setDisplay(value * p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduced]);
  return <>{(reduced ? value : display).toFixed(decimals)}</>;
}

// ΔE proximity tiers — semantics kept, reskinned to the MindMarket palette:
// near = Fresh Grass, mid = Sunshine Pop, far = Coral Pop.
// `fill` is the pure pop color (gauge/bars/dots); `text` is the readable
// darkened variant for numbers rendered as text on white.
function deltaETier(deltaE: number): { fill: string; text: string } {
  if (deltaE <= 8) return { fill: GRASS, text: GRASS_TEXT };
  if (deltaE <= 25) return { fill: SUNSHINE, text: SUNSHINE_TEXT };
  return { fill: CORAL, text: CORAL_TEXT };
}

function deltaEVerdict(deltaE: number): string {
  if (deltaE <= 2) return 'Visually identical · press-ready';
  if (deltaE <= 8) return 'Within tolerance · fine tuning';
  if (deltaE <= 25) return 'Approaching · keep dialing';
  return 'Off target · check hue first';
}

export default function ColorGame() {
  const [mode, setMode] = useState<ColorMode>('hsb');
  const [gameMode, setGameMode] = useState<GameMode>('daily');
  const [targets, setTargets] = useState<RGB[]>([]);
  const [targetColor, setTargetColor] = useState<RGB>({ r: 128, g: 128, b: 128 });
  // HSB is the single internal source of truth. RGB/CMYK are one-way derived
  // for display only, which eliminates round-trip rounding drift between modes.
  const [userHsb, setUserHsb] = useState<HSB>(INITIAL_HSB);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState<number>(0);
  const [round, setRound] = useState<number>(1);
  const [history, setHistory] = useState<RoundResult[]>([]);
  const [showCopied, setShowCopied] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [stats, setStats] = useState<LabStats>(DEFAULT_STATS);
  const [statsOpen, setStatsOpen] = useState(false);
  const [shareState, setShareState] = useState<'idle' | 'sharing' | 'done'>('idle');
  const [ritualOpen, setRitualOpen] = useState(false);
  const [cbAssist, setCbAssist] = useState(false);

  const userColor = hsbToRgb(userHsb);
  const totalScore = history.reduce((sum, h) => sum + h.score, 0);
  const targetHex = rgbToHex(targetColor);
  const userHex = rgbToHex(userColor);

  const startDaily = useCallback(() => {
    const set5 = dailyColors(utcDateKey());
    setTargets(set5);
    setTargetColor(set5[0]);
    setUserHsb(INITIAL_HSB);
    setGameMode('daily');
    setGameState('playing');
    setScore(0);
    setRound(1);
    setHistory([]);
  }, []);

  const startPractice = useCallback(() => {
    setTargets([]);
    setTargetColor(generateRandomColor());
    setUserHsb(INITIAL_HSB);
    setGameMode('practice');
    setGameState('playing');
    setScore(0);
    setRound(1);
    setHistory([]);
  }, []);

  // Instant play: landing opens straight into today's Daily (or Practice via
  // /?mode=practice deep link). The calibration ritual is available any time
  // from the nav CALIBRATE button — it no longer gates the first visit.
  useEffect(() => {
    // Read-once sync from localStorage (external system). Done in an effect
    // rather than the initializer so the server-rendered HTML and the first
    // client render remain identical (no hydration mismatch on stats-driven UI).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStats(loadStats());
    setCbAssist(loadCbAssist());
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'practice') startPractice();
    else startDaily();
  }, [startDaily, startPractice]);

  // Persist the assist preference whenever it changes (ritual toggle only;
  // writing is harmless even if it never changed).
  useEffect(() => {
    saveCbAssist(cbAssist);
  }, [cbAssist]);

  // Closing the calibration modal returns to the game exactly as it was —
  // the ritual never starts, resets, or eats a run in progress. (The legacy
  // calibrated flag is still written so old code paths see a clean state.)
  const closeRitual = useCallback(() => {
    markCalibrated();
    setRitualOpen(false);
  }, []);

  // UTC countdown to the next daily reset
  useEffect(() => {
    if (gameMode !== 'daily') return;
    const update = () => setCountdown(formatCountdown(msUntilUtcMidnight()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [gameMode]);

  const submitGuess = useCallback(() => {
    const deltaE = deltaE2000(targetColor, userColor);
    const roundScore = calculateScore(deltaE);
    setScore(roundScore);
    const entry: RoundResult = {
      round,
      score: roundScore,
      deltaE,
      target: rgbToHex(targetColor),
      guess: rgbToHex(userColor),
    };
    const newHistory = [...history, entry];
    setHistory(newHistory);
    if (round >= TOTAL_ROUNDS) {
      // streak (daily, once per UTC day) + personal best (any mode)
      const newTotal = newHistory.reduce((sum, h) => sum + h.score, 0);
      const now = new Date();
      const todayKey = utcDateKey(now);
      const yesterdayKey = utcDateKey(new Date(now.getTime() - 86400000));
      setStats(prev => {
        const next = recordGame(prev, {
          isDaily: gameMode === 'daily',
          totalScore: newTotal,
          todayKey,
          yesterdayKey,
        });
        saveStats(next);
        return next;
      });
      setGameState('finished');
    } else {
      setGameState('submitted');
    }
  }, [targetColor, userColor, round, history, gameMode]);

  const nextRound = useCallback(() => {
    if (round >= TOTAL_ROUNDS) return;
    const next = gameMode === 'daily' ? targets[round] : generateRandomColor();
    if (next) setTargetColor(next);
    setUserHsb(INITIAL_HSB);
    setRound(prev => prev + 1);
    setGameState('playing');
  }, [round, gameMode, targets]);

  // Share text — score + rating + link with UTM, no comparative claims
  const buildShareText = useCallback(() => {
    const average = history.length > 0 ? totalScore / history.length : 0;
    const rating = ratingFor(average);
    const meanDeltaE = history.length > 0
      ? history.reduce((sum, h) => sum + h.deltaE, 0) / history.length
      : 0;
    const shareModeLine = gameMode === 'daily' ? `Daily ${utcDateKey()}` : 'Practice';
    return `ToonTone Proofing Lab — ${shareModeLine}\nScore: ${totalScore}/${TOTAL_ROUNDS * 100} · ${rating.label}\nMean ΔE ${meanDeltaE.toFixed(2)} across ${history.length} proofs\nhttps://toontonegame.org/?utm_source=share&utm_medium=copy`;
  }, [gameMode, history, totalScore]);

  const copyResult = useCallback(() => {
    navigator.clipboard.writeText(buildShareText()).catch(() => {
      // Clipboard can be unavailable (permissions, non-secure context); ignore.
    });
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  }, [buildShareText]);

  // Share-card payload (shared by download + Web Share)
  const buildCardData = useCallback((): ShareCardData => {
    const average = history.length > 0 ? totalScore / history.length : 0;
    const rating = ratingFor(average);
    const meanDeltaE = history.length > 0
      ? history.reduce((sum, h) => sum + h.deltaE, 0) / history.length
      : 0;
    const grade = visionGradeFor(meanDeltaE);
    return {
      totalScore,
      ratingLabel: rating.label,
      ratingColor: rating.color,
      dateLine: gameMode === 'daily' ? `DAILY PROOF · ${utcDateKey()}` : 'PRACTICE PROOF',
      rounds: history.map(h => ({ target: h.target, guess: h.guess, score: h.score })),
      visionGrade: grade.label,
      visionColor: grade.color,
      meanDeltaE,
    };
  }, [gameMode, history, totalScore]);

  const shareCard = useCallback(() => {
    downloadShareCard(buildCardData());
  }, [buildCardData]);

  // Web Share API — prefer file share, degrade to text-only.
  // Only ever rendered on the client after a finished game.
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const shareNative = useCallback(async () => {
    if (!canNativeShare) return;
    setShareState('sharing');
    const text = buildShareText();
    try {
      const file = await shareCardFile(buildCardData());
      const files = file ? [file] : [];
      if (files.length > 0 && navigator.canShare?.({ files })) {
        await navigator.share({ text, files });
      } else {
        await navigator.share({ text });
      }
      setShareState('done');
      window.setTimeout(() => setShareState('idle'), 2500);
    } catch (err) {
      // AbortError = the user closed the share sheet; anything else we
      // swallow too — Copy/Download remain available as fallbacks.
      void err;
      setShareState('idle');
    }
  }, [canNativeShare, buildShareText, buildCardData]);

  // Channel strips based on mode — every mode edits userHsb only.
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

    if (mode === 'cmyk') {
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
    }
  };

  // ——— Floating pill nav: brand + CALIBRATE + STATS + color-mode switch ———
  const nav = (
    <nav
      className="sticker-nav flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-3 md:px-7"
      aria-label="Main"
    >
      <span className="flex items-center gap-2.5">
        <span
          className="inline-block w-3.5 h-3.5 rounded-full border-2 border-ink shrink-0"
          style={{ backgroundColor: GRASS }}
          aria-hidden="true"
        />
        <span className="text-[15px] font-medium tracking-tight text-ink whitespace-nowrap">
          ToonTone Proofing Lab
        </span>
      </span>
      <span className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setRitualOpen(true)}
          className="btn-pill btn-quiet px-4 py-1.5 text-[12px]"
        >
          Calibrate
        </button>
        <button
          onClick={() => setStatsOpen(true)}
          aria-haspopup="dialog"
          className="btn-pill btn-quiet px-4 py-1.5 text-[12px]"
        >
          Stats
        </button>
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
      </span>
    </nav>
  );

  // Daily-completed state: finished today's proof (best score shown, replays allowed).
  // lastDailyDate is only ever written on a completed Daily run.
  const todayKey = utcDateKey();
  const dailyDoneToday = gameMode === 'daily' && stats.lastDailyDate === todayKey;

  // Daily / Practice pill switch + status line
  const modeLine = (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
      <span className="flex items-center gap-2" role="group" aria-label="Game mode">
        <button
          onClick={startDaily}
          aria-pressed={gameMode === 'daily'}
          className={`btn-pill px-5 py-2 text-[13px] ${
            gameMode === 'daily'
              ? 'bg-ink text-surface border-2 border-ink'
              : 'btn-ghost'
          }`}
        >
          Daily
        </button>
        <button
          onClick={startPractice}
          aria-pressed={gameMode === 'practice'}
          className={`btn-pill px-5 py-2 text-[13px] ${
            gameMode === 'practice'
              ? 'bg-ink text-surface border-2 border-ink'
              : 'btn-ghost'
          }`}
        >
          Practice
        </button>
      </span>
      <p className="tt-label tabular text-secondary">
        {gameMode === 'daily'
          ? <>Daily Challenge · {todayKey} · Resets in <span className="text-ink">{countdown}</span></>
          : 'Practice · Endless random proofs · 5 rounds per run'}
      </p>
    </div>
  );

  // Badge shown while today's Daily is already completed
  const dailyDoneBadge = dailyDoneToday && (
    <div
      className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 bg-surface border-2 border-ink rounded-full px-5 py-2.5"
      role="status"
    >
      <span className="tt-label" style={{ color: GRASS_TEXT }}>
        ✓ Today&apos;s proof complete
      </span>
      <span className="tabular text-[13px] text-ink">
        {stats.lastDailyScore}/500 · {ratingLabelForScore(stats.lastDailyScore)}
      </span>
      <span className="tt-label text-secondary">
        Streak {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}
      </span>
    </div>
  );

  // Calibration ritual — modal overlay; the game underneath is untouched.
  const ritualModal = ritualOpen && (
    <CalibrationModal
      assist={cbAssist}
      onAssistChange={setCbAssist}
      onClose={closeRitual}
    />
  );

  // ——— 结算页：PROOF REPORT + share + stats ———
  if (gameState === 'finished') {
    const average = history.length > 0 ? totalScore / history.length : 0;
    const meanDeltaE = history.length > 0
      ? history.reduce((sum, h) => sum + h.deltaE, 0) / history.length
      : 0;
    const rating = ratingFor(average);
    return (
      <div className="relative mx-auto w-full max-w-[1200px] px-4 pt-5 pb-14 md:px-8 md:pt-8">
        {nav}
        {statsOpen && <StatsModal stats={stats} onClose={() => setStatsOpen(false)} />}
        {ritualModal}

        <div className="sticker-card mt-8 p-6 md:p-10" role="status" aria-live="polite">
          <div className="flex flex-wrap items-start justify-between gap-8 border-b border-hairline pb-8">
            <div>
              <p className="tt-label text-secondary">Proof report</p>
              <h2 className="tt-heading text-ink mt-2">Proofing complete</h2>
              <p className="tabular text-[56px] md:text-[72px] leading-none tracking-[-0.04em] text-ink mt-5">
                <CountUp value={totalScore} duration={500} />
                <span className="text-[22px] text-secondary"> /{TOTAL_ROUNDS * 100}</span>
              </p>
              <p className="tabular text-[14px] text-secondary mt-3">
                AVG {average.toFixed(1)} · MEAN ΔE {meanDeltaE.toFixed(2)}
              </p>
              {/* streak & personal best (streak daily-only) */}
              <p className="tt-label text-secondary mt-3">
                {gameMode === 'daily' && (
                  <>Streak <span className="text-ink">{stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}</span> · </>
                )}
                Best <span className="text-ink">{stats.bestScore}</span>
              </p>
            </div>
            <div
              className="qc-stamp border-[3px] rounded-[24px] px-6 py-3 font-medium uppercase tracking-[0.12em] text-[20px]"
              style={{ borderColor: rating.color, color: rating.color }}
            >
              {rating.label}
            </div>
          </div>

          <p className="text-[15px] text-secondary mt-5">{rating.blurb}</p>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full tabular text-[14px] text-ink">
              <thead>
                <tr className="border-b border-hairline text-left text-[12px] uppercase tracking-wide text-secondary">
                  <th className="py-2 font-medium">Rnd</th>
                  <th className="py-2 font-medium">Target</th>
                  <th className="py-2 font-medium">Print</th>
                  <th className="py-2 font-medium">ΔE</th>
                  <th className="py-2 font-medium text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr
                    key={h.round}
                    className="qc-row border-b border-hairline"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <td className="py-2.5">0{h.round}</td>
                    <td className="py-2.5">
                      <span
                        className="inline-block w-4 h-4 rounded-[4px] border border-ink align-[-3px] mr-2"
                        style={{ backgroundColor: h.target }}
                        role="img"
                        aria-label={`Target color ${h.target}`}
                      />
                      {h.target}
                    </td>
                    <td className="py-2.5">
                      <span
                        className="inline-block w-4 h-4 rounded-[4px] border border-ink align-[-3px] mr-2"
                        style={{ backgroundColor: h.guess }}
                        role="img"
                        aria-label={`Your color ${h.guess}`}
                      />
                      {h.guess}
                    </td>
                    <td className="py-2.5">{h.deltaE.toFixed(2)}</td>
                    <td className="py-2.5 text-right font-medium" style={{ color: scoreColor(h.score) }}>
                      {h.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="tt-label text-secondary mt-6">
            Proof result · {rating.label} · AVG {average.toFixed(1)}/100 · MEAN ΔE {meanDeltaE.toFixed(2)}
          </p>

          {/* COLOR VISION PROFILE — vision grade from mean ΔE (report card) */}
          {(() => {
            const grade = visionGradeFor(meanDeltaE);
            const maxBar = 30; // ΔE scale ceiling for the profile bars
            return (
              <section className="mt-8 border-t border-hairline pt-8" aria-labelledby="vision-profile-title">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="tt-label text-secondary">Color vision profile</p>
                    <h3 id="vision-profile-title" className="text-[22px] font-medium tracking-[-0.02em] text-ink mt-1">
                      {grade.label}
                    </h3>
                    <p className="tt-label text-secondary mt-1">
                      MEAN ΔE {meanDeltaE.toFixed(2)} · 5 PROOFS · CIEDE2000
                    </p>
                    <p className="text-[14px] text-ink mt-2">{grade.blurb}</p>
                  </div>
                  <div
                    className="qc-stamp border-[3px] rounded-[24px] px-5 py-2.5 font-medium uppercase tracking-[0.12em] text-[15px]"
                    style={{ borderColor: grade.color, color: grade.color }}
                  >
                    {grade.label}
                  </div>
                </div>

                <ul className="mt-6 space-y-2">
                  {history.map((h) => {
                    const pct = Math.min(100, (h.deltaE / maxBar) * 100);
                    const barColor = deltaETier(h.deltaE).fill;
                    return (
                      <li key={h.round} className="flex items-center gap-3">
                        <span className="tabular text-[12px] text-secondary w-7 shrink-0">R{String(h.round).padStart(2, '0')}</span>
                        <span className="flex-1 h-4 bg-sunken rounded-full overflow-hidden" aria-hidden="true">
                          <span
                            className="block h-full profile-bar rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: barColor }}
                          />
                        </span>
                        <span className="tabular text-[12px] text-secondary w-24 shrink-0 text-right">
                          ΔE {h.deltaE.toFixed(2)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className="flex justify-between mt-1 tabular text-[11px] text-secondary" aria-hidden="true">
                  <span>ΔE 0</span>
                  <span>{maxBar}+</span>
                </div>

                <p className="text-[13px] leading-[1.7] text-secondary mt-5 max-w-[62ch]">
                  {VISION_FOOTNOTE}
                </p>
              </section>
            );
          })()}

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
            <button onClick={shareCard} className="btn-pill btn-ink px-7 py-3">
              Download Card
            </button>
            <button onClick={copyResult} className="btn-pill btn-ghost px-7 py-3">
              {showCopied ? '✓ Copied' : 'Copy Result'}
            </button>
            <button
              onClick={gameMode === 'daily' ? startPractice : startDaily}
              className="btn-pill btn-ghost px-7 py-3"
            >
              {gameMode === 'daily' ? 'Practice More' : 'Run Daily Proof'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ——— idle 仅 SSR 首帧（落地即开局，客户端立刻进入 playing） ———
  if (gameState === 'idle') {
    return (
      <div className="relative mx-auto w-full max-w-[1200px] px-4 pt-5 pb-14 md:px-8 md:pt-8">
        {nav}
        {statsOpen && <StatsModal stats={stats} onClose={() => setStatsOpen(false)} />}
        {ritualModal}
        <div className="sticker-card mt-8 p-6 md:p-10">
          <div className="py-16 sr-only">Loading today&apos;s proof…</div>
          <div className="py-16" aria-hidden="true" />
        </div>
      </div>
    );
  }

  // ——— 游玩：落地即开局（Daily 自动开始） ———
  return (
    <div className="relative mx-auto w-full max-w-[1200px] px-4 pt-5 pb-14 md:px-8 md:pt-8">
      {nav}
      {statsOpen && <StatsModal stats={stats} onClose={() => setStatsOpen(false)} />}
      {ritualModal}

      {modeLine}
      {dailyDoneBadge}

      <section className="sticker-card mt-6 p-5 md:p-10">
        <h1 className="tt-display text-ink max-w-[14ch]">
          Match the tone.
        </h1>
        <p className="text-[15px] md:text-[17px] text-secondary mt-3 max-w-[52ch]">
          Five rounds, one target swatch per round. Dial the sliders until your
          print matches the proof — the lab scores the gap with ΔE (CIEDE2000).
        </p>

        <div className="grid gap-x-8 gap-y-8 md:grid-cols-12 mt-8">
          {/* 左 5 列：TARGET + YOUR PRINT 色块卡 */}
          <div className="md:col-span-5">
            <div className="swatch-card">
              <div
                className="relative h-44 md:h-[240px] rounded-[24px] overflow-hidden"
                style={{ backgroundColor: targetHex }}
                role="img"
                aria-label={`Target color ${targetHex}${cbAssist ? `; shape code ${shapeCodeLabel(shapesForHsb(rgbToHsbPrecise(targetColor)))}` : ''}`}
              >
                <span key={`dev-${round}-${targetHex}`} className="develop-overlay" />
                {cbAssist && (
                  <span className="shape-chip" aria-hidden="true">
                    <ShapeBadge shapes={shapesForHsb(rgbToHsbPrecise(targetColor))} size={16} />
                  </span>
                )}
              </div>
            </div>
            <p className="tt-label text-secondary px-3 mt-3">
              Target <span className="text-ink">{targetHex}</span>
              {cbAssist && (
                <span className="ml-2" style={{ color: GRASS_TEXT }}>
                  ◦ code: {shapeCodeLabel(shapesForHsb(rgbToHsbPrecise(targetColor)))}
                </span>
              )}
            </p>

            <div className="swatch-card mt-5">
              <div
                className={`proof-card relative h-44 md:h-[240px] rounded-[24px] overflow-hidden ${gameState === 'submitted' ? 'proof-overlap' : ''}`}
                style={{ backgroundColor: userHex }}
                role="img"
                aria-label={`Your color ${userHex}${cbAssist ? `; shape code ${shapeCodeLabel(shapesForHsb(userHsb))}` : ''}`}
              >
                {cbAssist && (
                  <span className="shape-chip" aria-hidden="true">
                    <ShapeBadge shapes={shapesForHsb(userHsb)} size={16} />
                  </span>
                )}
              </div>
            </div>
            <p className="tt-label text-secondary px-3 mt-3">
              Your print <span className="text-ink">{userHex}</span>
              {cbAssist && (
                <span className="ml-2" style={{ color: GRASS_TEXT }}>
                  ◦ code: {shapeCodeLabel(shapesForHsb(userHsb))}
                </span>
              )}
            </p>
          </div>

          {/* 右 7 列：进度 + 通道条 + 操作 + 仪器面板 */}
          {/* Desktop order: progress → sliders → submit → instrument.
              Mobile order: progress → sliders → instrument → sticky submit. */}
          <div className="md:col-span-7 flex flex-col">
            <div className="order-1 flex justify-between tt-label text-secondary">
              <span>Round {String(round).padStart(2, '0')}/{String(TOTAL_ROUNDS).padStart(2, '0')}</span>
              <span>Total {totalScore} / {TOTAL_ROUNDS * 100}</span>
            </div>
            <div className="order-2 h-2 bg-sunken rounded-full mt-2" aria-hidden="true">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{ width: `${(history.length / TOTAL_ROUNDS) * 100}%`, backgroundColor: GRASS }}
              />
            </div>

            <div className="order-2 mt-6 bg-sunken rounded-[34px] p-5 md:p-6 space-y-5">
              {renderSliders()}
            </div>

            <div className="order-3 md:order-4 mt-6">
              <InstrumentPanel liveDeltaE={deltaE2000(targetColor, userColor)} history={history} />
            </div>

            {gameState === 'playing' ? (
              <div className="order-4 md:order-3 mt-6 max-md:sticky max-md:bottom-0 max-md:bg-surface max-md:py-3 max-md:border-t max-md:border-hairline">
                <button onClick={submitGuess} className="btn-pill btn-grass w-full md:w-auto px-10 py-3.5 text-[14px]">
                  Submit proof
                </button>
              </div>
            ) : (
              <div className="order-4 md:order-3 mt-6 border-t border-hairline pt-5" role="status" aria-live="polite">
                <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
                  <p className="tabular text-[48px] leading-none tracking-[-0.03em] text-ink">
                    <CountUp value={score} />
                    <span className="text-[20px] text-secondary">/100</span>
                  </p>
                  <p className="tabular text-[14px] text-secondary pb-1">
                    ΔE <CountUp value={history[history.length - 1]?.deltaE ?? 0} decimals={2} />
                  </p>
                </div>
                <div className="mt-4 flex gap-3">
                  <button onClick={nextRound} className="btn-pill btn-ink px-8 py-3">
                    {round >= TOTAL_ROUNDS ? 'See results' : `Next round ${round}/${TOTAL_ROUNDS}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

// Calibration modal — wraps the ritual as an overlay. Opening it never pauses
// or resets the run underneath; closing returns to the exact same game state.
function CalibrationModal({
  assist,
  onAssistChange,
  onClose,
}: {
  assist: boolean;
  onAssistChange: (on: boolean) => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Esc closes; focus moves into the dialog on open and back on close.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center md:items-center md:p-6"
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="fixed inset-0 bg-ink/40" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Calibration"
        className="relative z-10 w-full md:max-w-xl max-h-full md:max-h-[85vh] overflow-y-auto p-2 stats-modal-in"
      >
        <div className="sticker-card p-6 md:p-8">
          <div className="flex items-center justify-between gap-3 border-b border-hairline pb-4">
            <p className="tt-label text-secondary">Calibration</p>
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Close calibration"
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full border-2 border-ink text-[14px] text-ink hover:bg-sunken transition-colors"
            >
              ✕
            </button>
          </div>
          <CalibrationRitual
            assist={assist}
            onAssistChange={onAssistChange}
            onComplete={onClose}
          />
        </div>
      </div>
    </div>
  );
}

// Instrument panel — live ΔE readout, proximity gauge, and the proof log.
// The liveDeltaE prop is computed in the parent render from current slider
// state (deltaE2000 is pure math; no extra state, no debounce needed at this
// scale). The reading is intentionally not aria-live: it changes on every
// slider tick and would flood screen readers — submitted feedback already
// announces politely elsewhere.
function InstrumentPanel({ liveDeltaE, history }: { liveDeltaE: number; history: RoundResult[] }) {
  const display = Math.min(99.9, liveDeltaE);
  const tier = deltaETier(liveDeltaE);
  const fillPct = Math.max(0, Math.min(100, 100 - liveDeltaE));

  return (
    <div className="instrument-panel bg-canvas rounded-[34px] p-5 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="tt-label text-secondary">
          Calibration monitor · CIEDE2000
        </p>
        <span
          className="w-3 h-3 rounded-full shrink-0 border border-ink"
          style={{ backgroundColor: tier.fill }}
          aria-hidden="true"
        />
      </div>

      {/* Live ΔE readout — number in the readable tier variant */}
      <p className="tabular text-[48px] md:text-[56px] leading-none tracking-[-0.04em] mt-4" style={{ color: tier.text }}>
        ΔE {display.toFixed(1)}
      </p>
      <p className="tt-label text-secondary mt-2">
        {deltaEVerdict(liveDeltaE)}
      </p>

      {/* Proximity gauge: fill = clamp(100 − ΔE)/100, with scale ticks */}
      <div className="mt-4">
        <div className="h-4 bg-surface border-2 border-ink rounded-full overflow-hidden relative" aria-hidden="true">
          <div
            className="h-full rounded-full transition-[width] duration-150"
            style={{ width: `${fillPct}%`, backgroundColor: tier.fill }}
          />
        </div>
        <div className="flex justify-between mt-1 tabular text-[11px] text-secondary" aria-hidden="true">
          <span>ΔE 100</span>
          <span>75</span>
          <span>50</span>
          <span>25</span>
          <span>0</span>
        </div>
        <p className="sr-only">
          Proximity {fillPct.toFixed(0)} percent; delta E {display.toFixed(1)}
        </p>
      </div>

      {/* Proof log: compact record of this run's completed rounds */}
      <div className="mt-5 pt-4 border-t border-hairline">
        <p className="tt-label text-secondary">Proof log</p>
        {history.length === 0 ? (
          <p className="text-[13px] text-secondary mt-2">
            No proofs submitted yet — dial in the match and submit to log round 01.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {history.map((h) => (
              <li key={h.round} className="flex items-center gap-3 tabular text-[13px]">
                <span className="text-secondary w-6 shrink-0">R{String(h.round).padStart(2, '0')}</span>
                <span className="inline-block w-4 h-4 rounded-[4px] border border-ink shrink-0" style={{ backgroundColor: h.target }} role="img" aria-label={`Target ${h.target}`} />
                <span className="inline-block w-4 h-4 rounded-[4px] border border-ink shrink-0" style={{ backgroundColor: h.guess }} role="img" aria-label={`Your print ${h.guess}`} />
                <span className="text-secondary text-[12px] truncate">ΔE {h.deltaE.toFixed(1)}</span>
                <span className="ml-auto font-medium" style={{ color: scoreColor(h.score) }}>{h.score}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// Channel-strip slider — label + chunky gradient track + tabular readout.
// label 通过 htmlFor/id 关联；原生 range 支持方向键微调（step 1）。
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
