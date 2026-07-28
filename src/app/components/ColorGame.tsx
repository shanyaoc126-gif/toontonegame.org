'use client';

import { useState, useCallback, useId } from 'react';
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

function ratingFor(average: number): { label: string; blurb: string } {
  if (average >= 90) return { label: '🏆 Color Master', blurb: 'Near-perfect pitch. Your eyes are basically a spectrophotometer.' };
  if (average >= 75) return { label: '🥇 Color Pro', blurb: 'Great color perception — only subtle shades slip past you.' };
  if (average >= 60) return { label: '🎨 Color Apprentice', blurb: 'Solid eye! A bit more practice with saturation and brightness.' };
  return { label: '🌱 Color Novice', blurb: 'Warming up! Try focusing on one channel at a time.' };
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
    const text = `🎨 ToonTone Challenge - Round ${round}/${TOTAL_ROUNDS}\nScore: ${score}/100 | ΔE: ${last ? last.deltaE.toFixed(2) : '0'}\nTarget: ${rgbToHex(targetColor)} | My guess: ${rgbToHex(userColor)}`;
    navigator.clipboard.writeText(text).catch(() => {
      // Clipboard can be unavailable (permissions, non-secure context); ignore.
    });
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  }, [round, score, history, targetColor, userColor]);

  // Slider components based on mode — every mode edits userHsb only.
  const renderSliders = () => {
    if (mode === 'hsb') {
      const hsb = userHsb;
      return (
        <div className="space-y-4">
          <Slider label="Hue" value={Math.round(hsb.h)} min={0} max={360} unit="°"
            gradient="linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)"
            onChange={(v) => setUserHsb({ ...hsb, h: v })} />
          <Slider label="Saturation" value={Math.round(hsb.s)} min={0} max={100} unit="%"
            gradient={`linear-gradient(to right, gray, ${rgbToHex(hsbToRgb({ ...hsb, s: 100 }))})`}
            onChange={(v) => setUserHsb({ ...hsb, s: v })} />
          <Slider label="Brightness" value={Math.round(hsb.b)} min={0} max={100} unit="%"
            gradient={`linear-gradient(to right, black, ${rgbToHex(hsbToRgb({ ...hsb, b: 100 }))})`}
            onChange={(v) => setUserHsb({ ...hsb, b: v })} />
        </div>
      );
    }

    if (mode === 'rgb') {
      const rgb = userColor;
      return (
        <div className="space-y-4">
          <Slider label="Red" value={rgb.r} min={0} max={255} unit=""
            gradient="linear-gradient(to right, #000, #f00)"
            onChange={(v) => setUserHsb(rgbToHsbPrecise({ ...rgb, r: v }))} />
          <Slider label="Green" value={rgb.g} min={0} max={255} unit=""
            gradient="linear-gradient(to right, #000, #0f0)"
            onChange={(v) => setUserHsb(rgbToHsbPrecise({ ...rgb, g: v }))} />
          <Slider label="Blue" value={rgb.b} min={0} max={255} unit=""
            gradient="linear-gradient(to right, #000, #00f)"
            onChange={(v) => setUserHsb(rgbToHsbPrecise({ ...rgb, b: v }))} />
        </div>
      );
    }

    if (mode === 'cmyk') {
      const cmyk = rgbToCmyk(userColor);
      return (
        <div className="space-y-4">
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
        </div>
      );
    }
  };

  // Final settlement screen after round 5
  if (gameState === 'finished') {
    const average = history.length > 0 ? totalScore / history.length : 0;
    const rating = ratingFor(average);
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🎨 ToonTone Challenge</h1>
          <p className="text-gray-600">Match the target color as closely as possible!</p>
        </div>

        <div
          className="bg-white rounded-xl p-6 shadow-md text-center"
          role="status"
          aria-live="polite"
        >
          <h2 className="text-2xl font-bold mb-1">Game Over</h2>
          <p className="text-xl font-bold text-blue-600 mb-1">{rating.label}</p>
          <p className="text-sm text-gray-500 mb-6">{rating.blurb}</p>

          <div className="flex justify-center gap-8 mb-6">
            <div>
              <p className="text-3xl font-bold">{totalScore}</p>
              <p className="text-xs text-gray-500">Total / {TOTAL_ROUNDS * 100}</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{average.toFixed(1)}</p>
              <p className="text-xs text-gray-500">Avg per round</p>
            </div>
          </div>

          <div className="text-left mb-6">
            <h3 className="font-bold mb-2 text-sm text-gray-700">Round breakdown</h3>
            <ul className="space-y-2">
              {history.map((h) => (
                <li
                  key={h.round}
                  className="flex items-center gap-3 text-sm border border-gray-100 rounded-lg px-3 py-2"
                >
                  <span className="font-medium w-14">R{h.round}</span>
                  <span
                    className="w-6 h-6 rounded border border-gray-200 inline-block"
                    style={{ backgroundColor: h.target }}
                    role="img"
                    aria-label={`Target color ${h.target}`}
                  />
                  <span className="text-gray-400">→</span>
                  <span
                    className="w-6 h-6 rounded border border-gray-200 inline-block"
                    style={{ backgroundColor: h.guess }}
                    role="img"
                    aria-label={`Your color ${h.guess}`}
                  />
                  <span className="font-mono text-xs text-gray-500">ΔE {h.deltaE.toFixed(2)}</span>
                  <span
                    className={`ml-auto px-2 py-0.5 rounded text-xs font-medium ${
                      h.score >= 90 ? 'bg-green-100 text-green-700' :
                      h.score >= 70 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}
                  >
                    {h.score}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={startGame}
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">🎨 ToonTone Challenge</h1>
        <p className="text-gray-600">Match the target color as closely as possible!</p>
      </div>

      {/* Mode Selector */}
      <div className="flex justify-center gap-2 mb-6">
        {(['hsb', 'rgb', 'cmyk'] as ColorMode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); if (gameState === 'idle') startGame(); }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              mode === m
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Game Area */}
      {gameState === 'idle' ? (
        <div className="text-center py-12">
          <button
            onClick={startGame}
            className="px-8 py-4 bg-blue-600 text-white text-xl font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            Start Game
          </button>
        </div>
      ) : (
        <>
          {/* Round indicator */}
          <p className="text-center text-sm font-medium text-gray-600 mb-4">
            Round {round}/{TOTAL_ROUNDS}
          </p>

          {/* Color Comparison */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Target Color</p>
              <div
                className="w-full h-32 rounded-xl shadow-inner border-2 border-gray-200"
                style={{ backgroundColor: rgbToHex(targetColor) }}
                role="img"
                aria-label={`Target color ${rgbToHex(targetColor)}`}
              />
              <p className="text-xs text-gray-400 mt-1 font-mono">{rgbToHex(targetColor)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Your Color</p>
              <div
                className="w-full h-32 rounded-xl shadow-inner border-2 border-gray-200"
                style={{ backgroundColor: rgbToHex(userColor) }}
                role="img"
                aria-label={`Your color ${rgbToHex(userColor)}`}
              />
              <p className="text-xs text-gray-400 mt-1 font-mono">{rgbToHex(userColor)}</p>
            </div>
          </div>

          {/* Sliders */}
          <div className="bg-white rounded-xl p-6 shadow-md mb-6">
            {renderSliders()}
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4 mb-6">
            {gameState === 'playing' ? (
              <button
                onClick={submitGuess}
                className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg"
              >
                Submit Guess
              </button>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="text-center" role="status" aria-live="polite">
                  <p className="text-3xl font-bold text-blue-600">{score}/100</p>
                  <p className="text-sm text-gray-500">ΔE = {history[history.length - 1]?.deltaE.toFixed(2)}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={nextRound}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
                  >
                    {round >= TOTAL_ROUNDS ? 'See Results' : `Next Round (${round}/${TOTAL_ROUNDS})`}
                  </button>
                  <button
                    onClick={copyResult}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
                  >
                    {showCopied ? '✓ Copied!' : 'Copy Result'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Score History */}
          {history.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-bold mb-2">History</h3>
              <div className="flex gap-2 flex-wrap">
                {history.map((h) => (
                  <div
                    key={h.round}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      h.score >= 90 ? 'bg-green-100 text-green-700' :
                      h.score >= 70 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}
                  >
                    R{h.round}: {h.score}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">Total: {totalScore} / {history.length * 100}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Slider Component — label is linked via htmlFor/id; native range input
// supports arrow-key fine adjustment (step 1) out of the box.
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
      <div className="flex justify-between mb-1">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm text-gray-500 font-mono" aria-hidden="true">{value}{unit}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-3 rounded-lg appearance-none cursor-pointer"
        style={{
          background: gradient,
          accentColor: '#2563eb',
        }}
      />
    </div>
  );
}
