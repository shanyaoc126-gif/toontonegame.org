// Streak & personal best — localStorage only, never uploaded.
// Degrades silently when storage is unavailable (private mode, disabled).

export interface LabStats {
  streak: number;
  lastDailyDate: string; // UTC date key of last completed Daily, '' if none
  bestScore: number;     // best total (out of 500), any mode
}

const KEY = 'toontone.lab.stats.v1';

const DEFAULTS: LabStats = { streak: 0, lastDailyDate: '', bestScore: 0 };

export function loadStats(): LabStats {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<LabStats>;
    return {
      streak: typeof parsed.streak === 'number' ? parsed.streak : 0,
      lastDailyDate: typeof parsed.lastDailyDate === 'string' ? parsed.lastDailyDate : '',
      bestScore: typeof parsed.bestScore === 'number' ? parsed.bestScore : 0,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveStats(stats: LabStats): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(stats));
  } catch {
    // Storage unavailable — stats simply don't persist.
  }
}

// Record a finished game. Daily completion advances the streak at most
// once per UTC day; best score updates in any mode.
export function recordGame(
  prev: LabStats,
  opts: { isDaily: boolean; totalScore: number; todayKey: string; yesterdayKey: string },
): LabStats {
  let { streak, lastDailyDate } = prev;
  if (opts.isDaily && lastDailyDate !== opts.todayKey) {
    streak = lastDailyDate === opts.yesterdayKey ? streak + 1 : 1;
    lastDailyDate = opts.todayKey;
  }
  return {
    streak,
    lastDailyDate,
    bestScore: Math.max(prev.bestScore, opts.totalScore),
  };
}
