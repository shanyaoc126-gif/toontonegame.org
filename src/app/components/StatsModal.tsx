'use client';

import { useEffect, useRef } from 'react';
import { LabStats, SCORE_BUCKETS } from '../lib/stats';
import { utcDateKey } from '../lib/daily';

// Wordle-style stats modal — MindMarket sticker-card look, Esc to close.

const GRASS = '#8ed462';
const SUNSHINE = '#f5e211';
const CORAL = '#ff705d';
const SUNSHINE_TEXT = '#8a7500';
const CORAL_TEXT = '#d94a35';

function scoreBarColor(score: number): string {
  const average = score / 5;
  return average >= 75 ? GRASS : average >= 60 ? SUNSHINE : CORAL;
}

function scoreTextColor(score: number): string {
  const average = score / 5;
  return average >= 75 ? '#4d8b31' : average >= 60 ? SUNSHINE_TEXT : CORAL_TEXT;
}

export default function StatsModal({ stats, onClose }: { stats: LabStats; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
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

  const average = stats.played > 0 ? stats.sumScore / stats.played : 0;
  const maxBucket = Math.max(1, ...stats.scoreDistribution);

  // Daily history entries within the last 7 UTC days, newest first.
  const today = new Date();
  const cutoff = utcDateKey(new Date(today.getTime() - 6 * 86400000));
  const recent = stats.dailyHistory
    .filter(e => e.date >= cutoff)
    .sort((a, b) => b.date.localeCompare(a.date));

  const tiles = [
    { label: 'Played', value: String(stats.played) },
    { label: 'Daily done', value: String(stats.dailyPlayed) },
    { label: 'Current streak', value: String(stats.currentStreak) },
    { label: 'Max streak', value: String(stats.maxStreak) },
    { label: 'Best score', value: String(stats.bestScore) },
    { label: 'Average score', value: stats.played > 0 ? average.toFixed(1) : '—' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center md:items-center md:p-6"
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="fixed inset-0 bg-ink/40" aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stats-modal-title"
        className="relative z-10 w-full md:max-w-lg max-h-full md:max-h-[85vh] overflow-y-auto p-2 stats-modal-in"
      >
        <div className="sticker-card p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="tt-label text-secondary">Lab records</p>
              <h2 id="stats-modal-title" className="text-[26px] font-medium tracking-[-0.02em] text-ink mt-1">
                Statistics
              </h2>
            </div>
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Close statistics"
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full border-2 border-ink text-[14px] text-ink hover:bg-sunken transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {tiles.map(t => (
              <div key={t.label} className="bg-sunken rounded-[18px] px-3 py-3">
                <p className="tabular text-[22px] leading-none text-ink">{t.value}</p>
                <p className="tt-label text-secondary mt-2">{t.label}</p>
              </div>
            ))}
          </div>

          {/* Score distribution */}
          <p className="tt-label text-secondary mt-7">Score distribution</p>
          <div className="mt-3 space-y-2" role="img" aria-label={`Score distribution across games: ${stats.scoreDistribution.map((c, i) => `${SCORE_BUCKETS[i]} points: ${c} games`).join('; ')}`}>
            {stats.scoreDistribution.map((count, i) => (
              <div key={SCORE_BUCKETS[i]} className="flex items-center gap-3">
                <span className="tabular text-[12px] text-secondary w-16 shrink-0 text-right">{SCORE_BUCKETS[i]}</span>
                <div className="flex-1 h-5 bg-surface border border-hairline rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(count / maxBucket) * 100}%`, backgroundColor: GRASS, opacity: count === 0 ? 0 : 1 }}
                  />
                </div>
                <span className="tabular text-[13px] text-ink w-8 shrink-0">{count}</span>
              </div>
            ))}
          </div>

          {/* Recent daily history (last 7 days) */}
          {recent.length > 0 && (
            <>
              <p className="tt-label text-secondary mt-7">Daily · last 7 days</p>
              <div className="mt-3 space-y-2">
                {recent.map(e => (
                  <div key={e.date} className="flex items-center gap-3">
                    <span className="tabular text-[12px] text-secondary w-16 shrink-0 text-right">{e.date.slice(5)}</span>
                    <div className="flex-1 h-5 bg-surface border border-hairline rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(e.score / 500) * 100}%`, backgroundColor: scoreBarColor(e.score) }}
                      />
                    </div>
                    <span className="tabular text-[13px] text-ink w-8 shrink-0">{e.score}</span>
                    <span
                      className="tt-label w-[74px] shrink-0 text-right"
                      style={{ color: scoreTextColor(e.score) }}
                    >
                      {e.rating.replace('COLOR ', '')}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          <p className="tt-label text-secondary mt-7">
            Stored on this device only · nothing uploaded
          </p>
        </div>
      </div>
    </div>
  );
}
