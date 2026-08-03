'use client';

// Pre-flight ritual: two skippable steps before the first proof.
//   Step 01 — monitor check (nested near-identical plates)
//   Step 02 — color vision assist toggle (hue → shape coding)
// The ritual never gates anyone out: SKIP CALIBRATION is always one click away.

import { useState } from 'react';
import ShapeBadge, { ShapeGlyphIcon } from './ShapeBadge';
import { SHAPE_WHEEL } from '../lib/calibration';

export default function CalibrationRitual({
  assist,
  onAssistChange,
  onComplete,
  onSkip,
}: {
  assist: boolean;
  onAssistChange: (on: boolean) => void;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);

  const skipLink = (
    <button
      onClick={onSkip}
      className="font-mono text-[12px] uppercase tracking-wide text-accent hover:underline"
    >
      Skip calibration →
    </button>
  );

  const stepTicks = (
    <p className="font-mono tabular-nums text-[11px] uppercase tracking-wide text-secondary">
      <span className={step === 1 ? 'text-ink font-bold' : ''}>01 Monitor</span>
      <span className="mx-2" aria-hidden="true">/</span>
      <span className={step === 2 ? 'text-ink font-bold' : ''}>02 Assist</span>
    </p>
  );

  return (
    <section aria-labelledby="ritual-title" className="mt-6">
      <div className="max-w-2xl mx-auto bg-surface border border-hairline rounded-[8px] p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
          {stepTicks}
          {skipLink}
        </div>

        {step === 1 ? (
          <div key="step1" className="ritual-in">
            <p className="font-mono text-[12px] uppercase tracking-wide text-secondary mt-6">
              Pre-flight · Step 01 of 02
            </p>
            <h2 id="ritual-title" className="text-[20px] font-bold uppercase tracking-tight text-ink mt-1">
              Calibrate your monitor
            </h2>
            <p className="text-[15px] leading-[1.75] text-ink mt-4">
              Every proof in this room is judged under a checked light booth, so we check
              yours before the first pull. The plate below carries two near-identical inks —
              one nested inside the other.
            </p>

            <div className="proof-frame max-w-sm mx-auto mt-6">
              <div
                className="relative h-40 rounded-[6px]"
                style={{ backgroundColor: '#1E1D1B' }}
                role="img"
                aria-label="Monitor check plate: a dark patch with a barely different dark patch nested inside it"
              >
                <div
                  className="absolute inset-6 rounded-[4px]"
                  style={{ backgroundColor: '#262524' }}
                />
              </div>
            </div>

            <p className="text-[15px] leading-[1.75] text-ink mt-6">
              If you can <em>just barely</em> tell the inner plate from the outer one, your
              monitor holds shadow detail and this lab will read true for you. If the two melt
              into one flat block, your display is clipping the darks — raise the brightness
              before playing, or play knowing the lab runs darker for you.
            </p>

            <div className="mt-6">
              <button
                onClick={() => setStep(2)}
                className="px-8 py-3 bg-ink text-surface font-bold uppercase tracking-wide text-[13px] rounded-[4px] hover:opacity-90 transition-opacity"
              >
                Monitor ready
              </button>
            </div>
          </div>
        ) : (
          <div key="step2" className="ritual-in">
            <p className="font-mono text-[12px] uppercase tracking-wide text-secondary mt-6">
              Pre-flight · Step 02 of 02
            </p>
            <h2 id="ritual-title" className="text-[20px] font-bold uppercase tracking-tight text-ink mt-1">
              Color vision assist
            </h2>
            <p className="text-[15px] leading-[1.75] text-ink mt-4">
              Some eyes read hue differently — roughly 1 in 12 men and 1 in 200 women see a
              shifted hue wheel. The assist gives every swatch a <strong>shape code</strong> so
              the game never asks you to bet on eyesight alone: six anchor hues carry six
              shapes, and hues between two anchors carry both neighbors. Match the shapes and
              you match the hue — the code shows on the target and on your print.
            </p>

            <ul className="mt-6 grid grid-cols-3 sm:grid-cols-6 gap-3">
              {SHAPE_WHEEL.map(({ shape, hue, name }) => (
                <li
                  key={shape}
                  className="flex flex-col items-center gap-1.5 border border-hairline rounded-[4px] px-2 py-3"
                >
                  <ShapeGlyphIcon shape={shape} size={22} />
                  <span className="font-mono text-[10px] uppercase tracking-wide text-secondary text-center">
                    {name} {hue}°
                  </span>
                </li>
              ))}
            </ul>
            <p className="font-mono text-[11px] uppercase tracking-wide text-secondary mt-3">
              Between anchors: <ShapeBadge shapes={['triangle', 'square']} size={13} /> = yellow–green.
              Near-neutral swatches: <ShapeBadge shapes={['achro']} size={13} /> = no hue to code.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-hairline pt-5">
              <button
                role="switch"
                aria-checked={assist}
                onClick={() => onAssistChange(!assist)}
                className={`relative inline-flex items-center w-[84px] h-9 rounded-full border transition-colors ${
                  assist ? 'bg-accent border-accent' : 'bg-canvas border-hairline'
                }`}
              >
                <span
                  className={`absolute top-[3px] w-7 h-7 rounded-full bg-white border border-hairline transition-transform ${
                    assist ? 'translate-x-[50px]' : 'translate-x-[3px]'
                  }`}
                  aria-hidden="true"
                />
                <span className="sr-only">Color vision assist</span>
              </button>
              <span className="font-mono text-[12px] uppercase tracking-wide text-ink" aria-hidden="true">
                Assist: {assist ? 'ON' : 'OFF'}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wide text-secondary">
                Stored on this device only
              </span>
            </div>

            <p className="text-[13px] leading-[1.7] text-secondary mt-4">
              The assist is a workaround, not a cure — and ToonTone remains a game, not a
              vision test. If you have concerns about your color vision, a clinician with
              proper test plates is the address.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                onClick={onComplete}
                className="px-8 py-3 bg-ink text-surface font-bold uppercase tracking-wide text-[13px] rounded-[4px] hover:opacity-90 transition-opacity"
              >
                Enter the lab
              </button>
              <button
                onClick={() => setStep(1)}
                className="font-mono text-[12px] uppercase tracking-wide text-secondary hover:text-ink"
              >
                ← Back to monitor check
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
