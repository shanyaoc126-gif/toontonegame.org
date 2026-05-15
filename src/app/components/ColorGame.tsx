'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  RGB, HSB, CMYK, ColorMode,
  generateRandomColor, hsbToRgb, rgbToHsb, rgbToCmyk, cmykToRgb,
  deltaE2000, calculateScore, rgbToHex,
} from '../lib/color-utils';

type GameState = 'idle' | 'playing' | 'submitted';

export default function ColorGame() {
  const [mode, setMode] = useState<ColorMode>('hsb');
  const [targetColor, setTargetColor] = useState<RGB>({ r: 128, g: 128, b: 128 });
  const [userColor, setUserColor] = useState<RGB>({ r: 128, g: 128, b: 128 });
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState<number>(0);
  const [round, setRound] = useState<number>(1);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [history, setHistory] = useState<{ round: number; score: number; deltaE: number }[]>([]);
  const [showCopied, setShowCopied] = useState(false);

  const startGame = useCallback(() => {
    const newTarget = generateRandomColor();
    setTargetColor(newTarget);
    setUserColor({ r: 128, g: 128, b: 128 });
    setGameState('playing');
    setScore(0);
    setRound(1);
    setTotalScore(0);
    setHistory([]);
  }, []);

  const submitGuess = useCallback(() => {
    const deltaE = deltaE2000(targetColor, userColor);
    const roundScore = calculateScore(deltaE);
    setScore(roundScore);
    setTotalScore(prev => prev + roundScore);
    setHistory(prev => [...prev, { round, score: roundScore, deltaE }]);
    setGameState('submitted');
  }, [targetColor, userColor, round]);

  const nextRound = useCallback(() => {
    const newTarget = generateRandomColor();
    setTargetColor(newTarget);
    setUserColor({ r: 128, g: 128, b: 128 });
    setRound(prev => prev + 1);
    setGameState('playing');
  }, []);

  const copyResult = useCallback(() => {
    const text = `🎨 ToonTone Challenge - Round ${round}\nScore: ${score}/100 | ΔE: ${history[history.length - 1]?.deltaE.toFixed(2) || 0}\nTarget: ${rgbToHex(targetColor)} | My guess: ${rgbToHex(userColor)}`;
    navigator.clipboard.writeText(text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  }, [round, score, history, targetColor, userColor]);

  // Slider components based on mode
  const renderSliders = () => {
    if (mode === 'hsb') {
      const hsb = rgbToHsb(userColor);
      return (
        <div className="space-y-4">
          <Slider label="Hue" value={hsb.h} min={0} max={360} unit="°"
            gradient="linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)"
            onChange={(v) => setUserColor(hsbToRgb({ ...hsb, h: v }))} />
          <Slider label="Saturation" value={hsb.s} min={0} max={100} unit="%"
            gradient={`linear-gradient(to right, gray, ${rgbToHex(hsbToRgb({ ...hsb, s: 100 }))})`}
            onChange={(v) => setUserColor(hsbToRgb({ ...hsb, s: v }))} />
          <Slider label="Brightness" value={hsb.b} min={0} max={100} unit="%"
            gradient={`linear-gradient(to right, black, ${rgbToHex(hsbToRgb({ ...hsb, b: 100 }))})`}
            onChange={(v) => setUserColor(hsbToRgb({ ...hsb, b: v }))} />
        </div>
      );
    }

    if (mode === 'rgb') {
      return (
        <div className="space-y-4">
          <Slider label="Red" value={userColor.r} min={0} max={255} unit=""
            gradient="linear-gradient(to right, #000, #f00)"
            onChange={(v) => setUserColor({ ...userColor, r: v })} />
          <Slider label="Green" value={userColor.g} min={0} max={255} unit=""
            gradient="linear-gradient(to right, #000, #0f0)"
            onChange={(v) => setUserColor({ ...userColor, g: v })} />
          <Slider label="Blue" value={userColor.b} min={0} max={255} unit=""
            gradient="linear-gradient(to right, #000, #00f)"
            onChange={(v) => setUserColor({ ...userColor, b: v })} />
        </div>
      );
    }

    if (mode === 'cmyk') {
      const cmyk = rgbToCmyk(userColor);
      return (
        <div className="space-y-4">
          <Slider label="Cyan" value={cmyk.c} min={0} max={100} unit="%"
            gradient="linear-gradient(to right, white, #00bcd4)"
            onChange={(v) => setUserColor(cmykToRgb({ ...cmyk, c: v }))} />
          <Slider label="Magenta" value={cmyk.m} min={0} max={100} unit="%"
            gradient="linear-gradient(to right, white, #e91e63)"
            onChange={(v) => setUserColor(cmykToRgb({ ...cmyk, m: v }))} />
          <Slider label="Yellow" value={cmyk.y} min={0} max={100} unit="%"
            gradient="linear-gradient(to right, white, #ffeb3b)"
            onChange={(v) => setUserColor(cmykToRgb({ ...cmyk, y: v }))} />
          <Slider label="Key (Black)" value={cmyk.k} min={0} max={100} unit="%"
            gradient="linear-gradient(to right, white, black)"
            onChange={(v) => setUserColor(cmykToRgb({ ...cmyk, k: v }))} />
        </div>
      );
    }
  };

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
          {/* Color Comparison */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Target Color</p>
              <div
                className="w-full h-32 rounded-xl shadow-inner border-2 border-gray-200"
                style={{ backgroundColor: rgbToHex(targetColor) }}
              />
              <p className="text-xs text-gray-400 mt-1 font-mono">{rgbToHex(targetColor)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Your Color</p>
              <div
                className="w-full h-32 rounded-xl shadow-inner border-2 border-gray-200"
                style={{ backgroundColor: rgbToHex(userColor) }}
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
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{score}/100</p>
                  <p className="text-sm text-gray-500">ΔE = {history[history.length - 1]?.deltaE.toFixed(2)}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={nextRound}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
                  >
                    Next Round ({round}/5)
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
              <div className="flex gap-2">
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

      {/* Disclaimer */}
      <p className="text-center text-xs text-gray-400 mt-8">
        Not affiliated with toontone.com
      </p>
    </div>
  );
}

// Slider Component
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
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm text-gray-500 font-mono">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
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
