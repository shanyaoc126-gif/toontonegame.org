'use client';

import { useState, useCallback, useEffect, useId } from 'react';
import {
  RGB, HSB, ColorMode,
  generateRandomColor, hsbToRgb, rgbToHsbPrecise, rgbToCmyk, cmykToRgb,
  deltaE2000, calculateScore, rgbToHex,
} from '../lib/color-utils';

type GameState = 'idle' | 'playing' | 'submitted' | 'finished';

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
  return score >= 90 ? 'var(--color-success)' : score >= 70 ? 'var(--color-near)' : 'var(--color-fail)';
}

function ratingFor(average: number): { label: string; blurb: string; color: string } {
  if (average >= 90) return { label: 'COLOR MASTER', blurb: 'Near-perfect pitch. This proof passes on the first pull.', color: 'var(--color-success)' };
  if (average >= 75) return { label: 'COLOR PRO', blurb: 'Press-ready. Only subtle shades slip past your eye.', color: 'var(--color-success)' };
  if (average >= 60) return { label: 'COLOR APPRENTICE', blurb: 'Solid eye. A little more time at the proofing table.', color: 'var(--color-near)' };
  return { label: 'COLOR NOVICE', blurb: 'Warming up. Try nailing one channel at a time.', color: 'var(--color-fail)' };
}

// Numeric readout that counts up on mount / value change (300ms).
// Falls back to the final value instantly under prefers-reduced-motion.
function CountUp({ value, decimals = 0, duration = 300 }: { value: number; decimals?: number; duration?: number }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setDisplay(value * p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{display.toFixed(decimals)}</>;
}

export default function ColorGame() {
  const [mode, setMode] = useState<ColorMode>('hsb');
  const [targetColor, setTargetColor] = useState<RGB>({ r: 128, g: 128, b: 128 });
  // HSB is the single internal source of truth. RGB/CMYK are one-way derived
  // for display only, which eliminates round-trip rounding drift between modes.
  const [userHsb, setUserHsb] = useState<HSB>(INITIAL_HSB);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState<number>(0);
  const [round, setRound] = useState<number>(1);
  const [history, setHistory] = useState<RoundResult[]>([]);
  const [showCopied, setShowCopied] = useState(false);

  const userColor = hsbToRgb(userHsb);
  const totalScore = history.reduce((sum, h) => sum + h.score, 0);
  const targetHex = rgbToHex(targetColor);
  const userHex = rgbToHex(userColor);

  const startGame = useCallback(() => {
    setTargetColor(generateRandomColor());
    setUserHsb(INITIAL_HSB);
    setGameState('playing');
    setScore(0);
    setRound(1);
    setHistory([]);
  }, []);

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
    setHistory(prev => [...prev, entry]);
    setGameState(round >= TOTAL_ROUNDS ? 'finished' : 'submitted');
  }, [targetColor, userColor, round]);

  const nextRound = useCallback(() => {
    if (round >= TOTAL_ROUNDS) return;
    setTargetColor(generateRandomColor());
    setUserHsb(INITIAL_HSB);
    setRound(prev => prev + 1);
    setGameState('playing');
  }, [round]);

  const copyResult = useCallback(() => {
    const last = history[history.length - 1];
    const text = `ToonTone Proofing Lab - Round ${round}/${TOTAL_ROUNDS}\nScore: ${score}/100 | dE: ${last ? last.deltaE.toFixed(2) : '0'}\nTarget: ${rgbToHex(targetColor)} | My print: ${rgbToHex(userColor)}`;
    navigator.clipboard.writeText(text).catch(() => {
      // Clipboard can be unavailable (permissions, non-secure context); ignore.
    });
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  }, [round, score, history, targetColor, userColor]);

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
      <div className="flex gap-2" role="group" aria-label="Color mode">
        {(['hsb', 'rgb', 'cmyk'] as ColorMode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); if (gameState === 'idle') startGame(); }}
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
    </header>
  );

  // ——— 结算页：质检报告单 ———
  if (gameState === 'finished') {
    const average = history.length > 0 ? totalScore / history.length : 0;
    const meanDeltaE = history.length > 0
      ? history.reduce((sum, h) => sum + h.deltaE, 0) / history.length
      : 0;
    const rating = ratingFor(average);
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        {header}

        <div
          className="mt-8 bg-surface border border-hairline rounded-[8px] p-6 md:p-8"
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

          <button
            onClick={startGame}
            className="mt-6 px-8 py-3 bg-ink text-surface font-bold uppercase tracking-wide text-[13px] rounded-[4px] hover:opacity-90 transition-opacity"
          >
            Run new proof
          </button>
        </div>
      </div>
    );
  }

  // ——— 游玩 / 待开始 ———
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {header}

      {gameState === 'idle' ? (
        <div className="py-16 text-center">
          <p className="font-mono text-[12px] uppercase tracking-wide text-secondary">
            Match the target color as closely as possible · scored by ΔE
          </p>
          <button
            onClick={startGame}
            className="mt-6 px-10 py-4 bg-ink text-surface font-bold uppercase tracking-wide text-[15px] rounded-[4px] hover:opacity-90 transition-opacity"
          >
            Start proofing
          </button>
        </div>
      ) : (
        <div className="grid gap-x-8 gap-y-6 md:grid-cols-12 mt-6">
          {/* 左 5 列：TARGET + YOUR PRINT 打样卡 */}
          <div className="md:col-span-5">
            <div className="proof-frame">
              <div
                className="relative h-44 md:h-[260px] rounded-[8px]"
                style={{ backgroundColor: targetHex }}
                role="img"
                aria-label={`Target color ${targetHex}`}
              >
                <span key={`dev-${round}-${targetHex}`} className="develop-overlay" />
              </div>
            </div>
            <p className="font-mono text-[12px] uppercase tracking-wide text-secondary px-3">
              Target / Ref <span className="text-ink">{targetHex}</span>
            </p>

            <div className="proof-frame mt-4">
              <div
                className={`proof-card relative h-44 md:h-[260px] rounded-[8px] ${gameState === 'submitted' ? 'proof-overlap' : ''}`}
                style={{ backgroundColor: userHex }}
                role="img"
                aria-label={`Your color ${userHex}`}
              />
            </div>
            <p className="font-mono text-[12px] uppercase tracking-wide text-secondary px-3">
              Your print / Guess <span className="text-ink">{userHex}</span>
            </p>
          </div>

          {/* 右 7 列：进度细线 + 通道条 + 操作 */}
          <div className="md:col-span-7">
            <div className="flex justify-between font-mono tabular-nums text-[12px] uppercase tracking-wide text-secondary">
              <span>Round {String(round).padStart(2, '0')}/{String(TOTAL_ROUNDS).padStart(2, '0')}</span>
              <span>Total {totalScore} / {TOTAL_ROUNDS * 100}</span>
            </div>
            <div className="h-[2px] bg-hairline mt-2" aria-hidden="true">
              <div
                className="h-full bg-accent transition-[width] duration-300"
                style={{ width: `${(history.length / TOTAL_ROUNDS) * 100}%` }}
              />
            </div>

            <div className="mt-6 bg-surface border border-hairline rounded-[8px] p-5 space-y-5">
              {renderSliders()}
            </div>

            {gameState === 'playing' ? (
              <div className="mt-6 max-md:sticky max-md:bottom-0 max-md:bg-canvas max-md:py-3 max-md:border-t max-md:border-hairline">
                <button
                  onClick={submitGuess}
                  className="w-full md:w-auto px-8 py-3 bg-ink text-surface font-bold uppercase tracking-wide text-[13px] rounded-[4px] hover:opacity-90 transition-opacity"
                >
                  Submit proof
                </button>
              </div>
            ) : (
              <div className="mt-6 border-t border-hairline pt-5" role="status" aria-live="polite">
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
                  <button
                    onClick={copyResult}
                    className="px-6 py-2.5 bg-surface border border-hairline text-ink font-bold uppercase tracking-wide text-[13px] rounded-[4px] hover:border-ink transition-colors"
                  >
                    {showCopied ? '✓ Copied' : 'Copy result'}
                  </button>
                </div>
              </div>
            )}

            {history.length > 0 && (
              <p className="mt-6 font-mono tabular-nums text-[12px] uppercase tracking-wide text-secondary">
                QC log&nbsp;&nbsp;
                {history.map((h) => (
                  <span key={h.round} className="mr-3">
                    R{h.round} <span style={{ color: scoreColor(h.score) }}>{h.score}</span>
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>
      )}
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
