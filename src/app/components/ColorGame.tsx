'use client';

import { useState, useCallback, useEffect, useId } from 'react';
import {
  RGB, HSB, ColorMode,
  generateRandomColor, hsbToRgb, rgbToHsbPrecise, rgbToCmyk, cmykToRgb,
  deltaE2000, calculateScore, rgbToHex,
} from '../lib/color-utils';
import { utcDateKey, dailyColors, msUntilUtcMidnight, formatCountdown } from '../lib/daily';
import { LabStats, DEFAULT_STATS, loadStats, saveStats, recordGame, ratingLabelForScore } from '../lib/stats';
import { downloadShareCard, shareCardFile, ShareCardData } from '../lib/share-card';
import {
  isCalibrated, markCalibrated, loadCbAssist, saveCbAssist,
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

function scoreColor(score: number): string {
  return score >= 90 ? '#1E8A4C' : score >= 70 ? '#D9A441' : '#DA3A2E';
}

function ratingFor(average: number): { label: string; blurb: string; color: string } {
  if (average >= 90) return { label: 'COLOR MASTER', blurb: 'Near-perfect pitch. This proof passes on the first pull.', color: '#1E8A4C' };
  if (average >= 75) return { label: 'COLOR PRO', blurb: 'Press-ready. Only subtle shades slip past your eye.', color: '#1E8A4C' };
  if (average >= 60) return { label: 'COLOR APPRENTICE', blurb: 'Solid eye. A little more time at the proofing table.', color: '#D9A441' };
  return { label: 'COLOR NOVICE', blurb: 'Warming up. Try nailing one channel at a time.', color: '#DA3A2E' };
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

// ΔE proximity tiers for the calibration monitor — QC palette from globals.css.
function deltaEColor(deltaE: number): string {
  if (deltaE <= 2) return '#00A6C0';  // locked in — process cyan
  if (deltaE <= 8) return '#1E8A4C';  // within tolerance — QC pass
  if (deltaE <= 20) return '#D9A441'; // approaching — QC near
  return '#DA3A2E';                   // off target — QC fail
}

function deltaEVerdict(deltaE: number): string {
  if (deltaE <= 2) return 'Visually identical · press-ready';
  if (deltaE <= 8) return 'Within tolerance · fine tuning';
  if (deltaE <= 20) return 'Approaching · keep dialing';
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

  // F1/F4: home page opens directly on today's Daily Challenge;
  // /?mode=practice deep link opens Practice instead.
  useEffect(() => {
    // Read-once sync from localStorage (external system). Done in an effect
    // rather than the initializer so the server-rendered HTML and the first
    // client render stay identical (no hydration mismatch on stats-driven UI).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStats(loadStats());
    setCbAssist(loadCbAssist());
    if (isCalibrated()) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'practice') startPractice();
      else startDaily();
    } else {
      // First visit: hold the game behind the two-step pre-flight ritual.
      setRitualOpen(true);
    }
  }, [startDaily, startPractice]);

  // Persist the assist preference whenever it changes (ritual toggle only;
  // writing is harmless even if it never changed).
  useEffect(() => {
    saveCbAssist(cbAssist);
  }, [cbAssist]);

  // Completing or skipping the ritual marks it seen. If the game hasn't
  // started yet (first visit), it also deals the first proof; if the ritual
  // was re-opened mid-game via the header CALIBRATE link, the run in progress
  // is left untouched — recalibrating must never eat a streak.
  const finishRitual = useCallback(() => {
    markCalibrated();
    setRitualOpen(false);
    if (gameState === 'idle') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'practice') startPractice();
      else startDaily();
    }
  }, [gameState, startDaily, startPractice]);
  const skipRitual = finishRitual;

  // F1: UTC countdown to the next daily reset
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
      // F3: streak (daily, once per UTC day) + personal best (any mode)
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

  // F2: share text — score + rating + link with UTM, no comparative claims
  const buildShareText = useCallback(() => {
    const average = history.length > 0 ? totalScore / history.length : 0;
    const rating = ratingFor(average);
    const meanDeltaE = history.length > 0
      ? history.reduce((sum, h) => sum + h.deltaE, 0) / history.length
      : 0;
    const shareModeLine = gameMode === 'daily' ? `Daily ${utcDateKey()}` : 'Practice';
    return `ToonTone Proofing Lab — ${shareModeLine}\nScore: ${totalScore}/${TOTAL_ROUNDS * 100} · ${rating.label}\nMean ΔE ${meanDeltaE.toFixed(2)} across ${history.length} proofs\nhttps://toontonegame.org/?utm_source=share&utm_medium=copy`;
  }, [gameMode, history, totalScore]);

  // F2: copy text
  const copyResult = useCallback(() => {
    navigator.clipboard.writeText(buildShareText()).catch(() => {
      // Clipboard can be unavailable (permissions, non-secure context); ignore.
    });
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  }, [buildShareText]);

  // F2: share-card payload (shared by download + Web Share)
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

  // F2: download the PNG share card
  const shareCard = useCallback(() => {
    downloadShareCard(buildCardData());
  }, [buildCardData]);

  // F2: Web Share API — prefer file share, degrade to text-only.
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

  const header = (
    <header className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-hairline">
      <div>
        <h1 className="text-[20px] font-bold uppercase tracking-tight text-ink">ToonTone Proofing Lab</h1>
        <p className="font-mono text-[12px] uppercase tracking-wide text-secondary mt-1">
          Color QC · CIEDE2000 matching · 5 rounds
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setRitualOpen(true)}
          className="px-4 py-1.5 rounded-full font-mono text-[12px] uppercase tracking-wide bg-surface border border-hairline text-secondary hover:text-ink transition-colors"
        >
          Calibrate
        </button>
        <button
          onClick={() => setStatsOpen(true)}
          aria-haspopup="dialog"
          className="px-4 py-1.5 rounded-full font-mono text-[12px] uppercase tracking-wide bg-surface border border-hairline text-secondary hover:text-ink transition-colors"
        >
          Stats
        </button>
        <div className="flex gap-2" role="group" aria-label="Color mode">
        {(['hsb', 'rgb', 'cmyk'] as ColorMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`px-4 py-1.5 rounded-full font-mono text-[12px] uppercase tracking-wide transition-colors ${
              mode === m
                ? 'bg-ink text-surface'
                : 'bg-surface border border-hairline text-secondary hover:text-ink'
            }`}
          >
            {m}
          </button>
        ))}
        </div>
      </div>
    </header>
  );

  // Daily-completed state: finished today's proof (best score shown, replays allowed).
  // lastDailyDate is only ever written on a completed Daily run.
  const todayKey = utcDateKey();
  const dailyDoneToday = gameMode === 'daily' && stats.lastDailyDate === todayKey;

  // Daily / Practice mode line
  const modeLine = (
    <div className="flex flex-wrap items-baseline justify-between gap-2 mt-4">
      <p className="font-mono tabular-nums text-[12px] uppercase tracking-wide text-secondary">
        {gameMode === 'daily'
          ? <>Daily Challenge · {todayKey} · Resets in <span className="text-ink">{countdown}</span></>
          : 'Practice · Endless random proofs · 5 rounds per run'}
      </p>
      <button
        onClick={gameMode === 'daily' ? startPractice : startDaily}
        className="font-mono text-[12px] uppercase tracking-wide text-accent hover:underline"
      >
        {gameMode === 'daily'
          ? 'Switch to Practice →'
          : (dailyDoneToday ? "Replay today's proof →" : 'Switch to Daily →')}
      </button>
    </div>
  );

  // F4: badge shown while today's Daily is already completed
  const dailyDoneBadge = dailyDoneToday && (
    <div
      className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border border-success/40 bg-success/5 rounded-[4px] px-4 py-2.5"
      role="status"
    >
      <span className="font-bold uppercase tracking-wide text-[12px]" style={{ color: '#1E8A4C' }}>
        ✓ Today&apos;s calibration complete
      </span>
      <span className="font-mono tabular-nums text-[12px] text-ink">
        {stats.lastDailyScore}/500 · {ratingLabelForScore(stats.lastDailyScore)}
      </span>
      <span className="font-mono text-[11px] uppercase tracking-wide text-secondary">
        Streak {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}
      </span>
    </div>
  );

  // ——— Pre-flight ritual (first visit, or re-opened via header CALIBRATE) ———
  if (ritualOpen) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        {header}
        {statsOpen && <StatsModal stats={stats} onClose={() => setStatsOpen(false)} />}
        <CalibrationRitual
          assist={cbAssist}
          onAssistChange={setCbAssist}
          onComplete={finishRitual}
          onSkip={skipRitual}
        />
      </div>
    );
  }

  // ——— 结算页：质检报告单 + F2 分享 + F3 统计 ———
  if (gameState === 'finished') {
    const average = history.length > 0 ? totalScore / history.length : 0;
    const meanDeltaE = history.length > 0
      ? history.reduce((sum, h) => sum + h.deltaE, 0) / history.length
      : 0;
    const rating = ratingFor(average);
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        {header}
        {modeLine}
        {statsOpen && <StatsModal stats={stats} onClose={() => setStatsOpen(false)} />}

        <div
          className="mt-6 bg-surface border border-hairline rounded-[8px] p-6 md:p-8"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-start justify-between gap-8 border-b border-hairline pb-6">
            <div>
              <p className="font-mono text-[12px] uppercase tracking-wide text-secondary">Quality control report</p>
              <h2 className="text-[20px] font-bold uppercase tracking-tight text-ink mt-1">Proofing complete</h2>
              <p className="font-mono tabular-nums text-[48px] leading-none text-ink mt-4">
                <CountUp value={totalScore} duration={500} />
                <span className="text-[20px] text-secondary"> /{TOTAL_ROUNDS * 100}</span>
              </p>
              <p className="font-mono tabular-nums text-[13px] text-secondary mt-2">
                AVG {average.toFixed(1)} · MEAN ΔE {meanDeltaE.toFixed(2)}
              </p>
              {/* F3: streak & personal best (streak daily-only) */}
              <p className="font-mono tabular-nums text-[12px] uppercase tracking-wide text-secondary mt-3">
                {gameMode === 'daily' && (
                  <>Streak <span className="text-ink">{stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}</span> · </>
                )}
                Best <span className="text-ink">{stats.bestScore}</span>
              </p>
            </div>
            <div
              className="qc-stamp border-2 rounded-[4px] px-5 py-3 font-bold uppercase tracking-widest text-[20px]"
              style={{ borderColor: rating.color, color: rating.color }}
            >
              {rating.label}
            </div>
          </div>

          <p className="font-mono text-[13px] text-secondary mt-4">{rating.blurb}</p>

          <table className="w-full mt-6 font-mono tabular-nums text-[13px] text-ink">
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
                      className="inline-block w-4 h-4 rounded-[2px] border border-hairline align-[-3px] mr-2"
                      style={{ backgroundColor: h.target }}
                      role="img"
                      aria-label={`Target color ${h.target}`}
                    />
                    {h.target}
                  </td>
                  <td className="py-2.5">
                    <span
                      className="inline-block w-4 h-4 rounded-[2px] border border-hairline align-[-3px] mr-2"
                      style={{ backgroundColor: h.guess }}
                      role="img"
                      aria-label={`Your color ${h.guess}`}
                    />
                    {h.guess}
                  </td>
                  <td className="py-2.5">{h.deltaE.toFixed(2)}</td>
                  <td className="py-2.5 text-right font-bold" style={{ color: scoreColor(h.score) }}>
                    {h.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="font-mono text-[12px] uppercase tracking-wide text-secondary mt-6">
            QC result · {rating.label} · AVG {average.toFixed(1)}/100 · MEAN ΔE {meanDeltaE.toFixed(2)}
          </p>

          {/* COLOR VISION PROFILE — vision grade from mean ΔE (report card) */}
          {(() => {
            const grade = visionGradeFor(meanDeltaE);
            const maxBar = 30; // ΔE scale ceiling for the profile bars
            return (
              <section className="mt-6 border-t border-hairline pt-6" aria-labelledby="vision-profile-title">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[12px] uppercase tracking-wide text-secondary">Color vision profile</p>
                    <h3 id="vision-profile-title" className="text-[16px] font-bold uppercase tracking-tight text-ink mt-1">
                      {grade.label}
                    </h3>
                    <p className="font-mono text-[12px] text-secondary mt-1">
                      MEAN ΔE {meanDeltaE.toFixed(2)} · 5 PROOFS · CIEDE2000
                    </p>
                    <p className="text-[13px] text-ink mt-2">{grade.blurb}</p>
                  </div>
                  <div
                    className="qc-stamp border-2 rounded-[4px] px-4 py-2 font-bold uppercase tracking-widest text-[15px]"
                    style={{ borderColor: grade.color, color: grade.color }}
                  >
                    {grade.label}
                  </div>
                </div>

                <ul className="mt-5 space-y-2">
                  {history.map((h) => {
                    const pct = Math.min(100, (h.deltaE / maxBar) * 100);
                    const barColor = deltaEColor(h.deltaE);
                    return (
                      <li key={h.round} className="flex items-center gap-3">
                        <span className="font-mono tabular-nums text-[11px] text-secondary w-7 shrink-0">R{String(h.round).padStart(2, '0')}</span>
                        <span className="flex-1 h-4 bg-canvas border border-hairline rounded-[2px] overflow-hidden" aria-hidden="true">
                          <span
                            className="block h-full profile-bar"
                            style={{ width: `${pct}%`, backgroundColor: barColor }}
                          />
                        </span>
                        <span className="font-mono tabular-nums text-[11px] text-secondary w-24 shrink-0 text-right">
                          ΔE {h.deltaE.toFixed(2)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className="flex justify-between mt-1 font-mono tabular-nums text-[10px] text-secondary" aria-hidden="true">
                  <span>ΔE 0</span>
                  <span>{maxBar}+</span>
                </div>

                <p className="font-mono text-[11px] leading-[1.7] text-secondary mt-4 max-w-[62ch]">
                  {VISION_FOOTNOTE}
                </p>
              </section>
            );
          })()}

          {/* F2: share actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            {canNativeShare && (
              <button
                onClick={shareNative}
                disabled={shareState === 'sharing'}
                className="px-6 py-2.5 bg-accent text-white font-bold uppercase tracking-wide text-[13px] rounded-[4px] hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {shareState === 'sharing' ? 'Sharing…' : shareState === 'done' ? '✓ Shared' : 'Share'}
              </button>
            )}
            <button
              onClick={shareCard}
              className="px-6 py-2.5 bg-ink text-surface font-bold uppercase tracking-wide text-[13px] rounded-[4px] hover:opacity-90 transition-opacity"
            >
              Download Card
            </button>
            <button
              onClick={copyResult}
              className="px-6 py-2.5 bg-surface border border-hairline text-ink font-bold uppercase tracking-wide text-[13px] rounded-[4px] hover:border-ink transition-colors"
            >
              {showCopied ? '✓ Copied' : 'Copy Result'}
            </button>
            <button
              onClick={gameMode === 'daily' ? startPractice : startDaily}
              className="px-6 py-2.5 bg-surface border border-hairline text-ink font-bold uppercase tracking-wide text-[13px] rounded-[4px] hover:border-ink transition-colors"
            >
              {gameMode === 'daily' ? 'Practice More' : 'Run Daily Proof'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ——— 游玩（首页即 Daily 直接开局；idle 仅 SSR 首帧） ———
  if (gameState === 'idle') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        {header}
        {statsOpen && <StatsModal stats={stats} onClose={() => setStatsOpen(false)} />}
        <div className="py-16" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {header}
      {modeLine}
      {dailyDoneBadge}
      {statsOpen && <StatsModal stats={stats} onClose={() => setStatsOpen(false)} />}

      <div className="grid gap-x-8 gap-y-6 md:grid-cols-12 mt-4">
        {/* 左 5 列：TARGET + YOUR PRINT 打样卡 */}
        <div className="md:col-span-5">
          <div className="proof-frame">
            <div
              className="relative h-44 md:h-[260px] rounded-[8px]"
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
          <p className="font-mono text-[12px] uppercase tracking-wide text-secondary px-3">
            Target / Ref <span className="text-ink">{targetHex}</span>
            {cbAssist && (
              <span className="ml-2 text-accent">
                ◦ code: {shapeCodeLabel(shapesForHsb(rgbToHsbPrecise(targetColor)))}
              </span>
            )}
          </p>

          <div className="proof-frame mt-4">
            <div
              className={`proof-card relative h-44 md:h-[260px] rounded-[8px] ${gameState === 'submitted' ? 'proof-overlap' : ''}`}
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
          <p className="font-mono text-[12px] uppercase tracking-wide text-secondary px-3">
            Your print / Guess <span className="text-ink">{userHex}</span>
            {cbAssist && (
              <span className="ml-2 text-accent">
                ◦ code: {shapeCodeLabel(shapesForHsb(userHsb))}
              </span>
            )}
          </p>
        </div>

        {/* 右 7 列：进度细线 + 通道条 + 操作 + 仪器面板 */}
        {/* Desktop order: progress → sliders → submit → instrument.
            Mobile order: progress → sliders → instrument → sticky submit. */}
        <div className="md:col-span-7 flex flex-col">
          <div className="order-1 flex justify-between font-mono tabular-nums text-[12px] uppercase tracking-wide text-secondary">
            <span>Round {String(round).padStart(2, '0')}/{String(TOTAL_ROUNDS).padStart(2, '0')}</span>
            <span>Total {totalScore} / {TOTAL_ROUNDS * 100}</span>
          </div>
          <div className="order-2 h-[2px] bg-hairline mt-2" aria-hidden="true">
            <div
              className="h-full bg-accent transition-[width] duration-300"
              style={{ width: `${(history.length / TOTAL_ROUNDS) * 100}%` }}
            />
          </div>

          <div className="order-2 mt-6 bg-surface border border-hairline rounded-[8px] p-5 space-y-5">
            {renderSliders()}
          </div>

          <div className="order-3 md:order-4 mt-6">
            <InstrumentPanel liveDeltaE={deltaE2000(targetColor, userColor)} history={history} />
          </div>

          {gameState === 'playing' ? (
            <div className="order-4 md:order-3 mt-6 max-md:sticky max-md:bottom-0 max-md:bg-canvas max-md:py-3 max-md:border-t max-md:border-hairline">
              <button
                onClick={submitGuess}
                className="w-full md:w-auto px-8 py-3 bg-ink text-surface font-bold uppercase tracking-wide text-[13px] rounded-[4px] hover:opacity-90 transition-opacity"
              >
                Submit proof
              </button>
            </div>
          ) : (
            <div className="order-4 md:order-3 mt-6 border-t border-hairline pt-5" role="status" aria-live="polite">
              <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
                <p className="font-mono tabular-nums text-[48px] leading-none text-ink">
                  <CountUp value={score} />
                  <span className="text-[20px] text-secondary">/100</span>
                </p>
                <p className="font-mono tabular-nums text-[13px] text-secondary pb-1">
                  ΔE <CountUp value={history[history.length - 1]?.deltaE ?? 0} decimals={2} />
                </p>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={nextRound}
                  className="px-6 py-2.5 bg-ink text-surface font-bold uppercase tracking-wide text-[13px] rounded-[4px] hover:opacity-90 transition-opacity"
                >
                  {round >= TOTAL_ROUNDS ? 'See results' : `Next round ${round}/${TOTAL_ROUNDS}`}
                </button>
              </div>
            </div>
          )}
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
  const color = deltaEColor(liveDeltaE);
  const fillPct = Math.max(0, Math.min(100, 100 - liveDeltaE));

  return (
    <div className="instrument-panel bg-surface border border-hairline rounded-[8px] p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-wide text-secondary">
          Calibration monitor · CIEDE2000
        </p>
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      </div>

      {/* Live ΔE readout */}
      <p className="font-mono tabular-nums font-bold text-[56px] leading-none mt-4" style={{ color }}>
        ΔE {display.toFixed(1)}
      </p>
      <p className="font-mono text-[11px] uppercase tracking-wide text-secondary mt-2">
        {deltaEVerdict(liveDeltaE)}
      </p>

      {/* Proximity gauge: fill = clamp(100 − ΔE)/100, with scale ticks */}
      <div className="mt-4">
        <div className="h-3 bg-canvas border border-hairline rounded-[2px] overflow-hidden relative" aria-hidden="true">
          <div
            className="h-full transition-[width] duration-150"
            style={{ width: `${fillPct}%`, backgroundColor: color }}
          />
        </div>
        <div className="flex justify-between mt-1 font-mono tabular-nums text-[10px] text-secondary" aria-hidden="true">
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
        <p className="font-mono text-[11px] uppercase tracking-wide text-secondary">Proof log</p>
        {history.length === 0 ? (
          <p className="font-mono text-[12px] text-secondary mt-2">
            No proofs submitted yet — dial in the match and submit to log round 01.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {history.map((h) => (
              <li key={h.round} className="flex items-center gap-3 font-mono tabular-nums text-[12px]">
                <span className="text-secondary w-6 shrink-0">R{String(h.round).padStart(2, '0')}</span>
                <span className="inline-block w-4 h-4 rounded-[2px] border border-hairline shrink-0" style={{ backgroundColor: h.target }} role="img" aria-label={`Target ${h.target}`} />
                <span className="inline-block w-4 h-4 rounded-[2px] border border-hairline shrink-0" style={{ backgroundColor: h.guess }} role="img" aria-label={`Your print ${h.guess}`} />
                <span className="text-secondary text-[11px] truncate">ΔE {h.deltaE.toFixed(1)}</span>
                <span className="ml-auto font-bold" style={{ color: scoreColor(h.score) }}>{h.score}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// Channel-strip slider — mono 通道名 + 18px 渐变轨道 + 3 位定宽读数。
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
      <div className="flex justify-between items-baseline mb-1.5">
        <label htmlFor={id} className="font-mono text-[12px] uppercase tracking-wide text-secondary">
          {label}
        </label>
        <span className="font-mono tabular-nums text-[13px] text-ink w-14 text-right" aria-hidden="true">
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
