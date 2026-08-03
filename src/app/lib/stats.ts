// Lab statistics — localStorage only, never uploaded.
// Degrades silently when storage is unavailable (private mode, disabled).
//
// Schema v2 (key: toontone.lab.stats.v2) extends the legacy v1 shape
// ({streak, lastDailyDate, bestScore}) with Wordle-style aggregates.
// loadStats() transparently migrates v1 -> v2 without losing streak/best.

export interface DailyHistoryEntry {
  date: string;   // UTC date key, e.g. "2026-08-03"
  score: number;  // best total (out of 500) for that day
  rating: string; // rating label for that score, e.g. "COLOR PRO"
}

export interface LabStats {
  version: 2;
  played: number;             // finished games, any mode
  dailyPlayed: number;        // finished Daily runs (replays included)
  currentStreak: number;      // consecutive UTC days with a finished Daily
  maxStreak: number;          // best streak ever
  bestScore: number;          // best total (out of 500), any mode
  lastDailyDate: string;      // UTC date key of last completed Daily, '' if none
  lastDailyScore: number;     // best total for lastDailyDate (0 if unknown)
  sumScore: number;           // sum of totals across all finished games
  scoreDistribution: number[]; // 5 buckets: 0-99 / 100-199 / 200-299 / 300-399 / 400-500
  dailyHistory: DailyHistoryEntry[]; // ascending by date, capped at 60 entries
}

export const KEY = 'toontone.lab.stats.v2';
const LEGACY_KEY = 'toontone.lab.stats.v1';

export const SCORE_BUCKETS = ['0–99', '100–199', '200–299', '300–399', '400–500'];

export const DEFAULT_STATS: LabStats = {
  version: 2,
  played: 0,
  dailyPlayed: 0,
  currentStreak: 0,
  maxStreak: 0,
  bestScore: 0,
  lastDailyDate: '',
  lastDailyScore: 0,
  sumScore: 0,
  scoreDistribution: [0, 0, 0, 0, 0],
  dailyHistory: [],
};

const HISTORY_LIMIT = 60;

// Rating label for a total score out of 500. Mirrors the thresholds used by
// the game (average >= 90/75/60), kept here so stats.ts stays self-contained.
export function ratingLabelForScore(totalScore: number): string {
  const average = totalScore / 5;
  if (average >= 90) return 'COLOR MASTER';
  if (average >= 75) return 'COLOR PRO';
  if (average >= 60) return 'COLOR APPRENTICE';
  return 'COLOR NOVICE';
}

function bucketIndex(totalScore: number): number {
  return totalScore >= 400 ? 4 : Math.max(0, Math.floor(totalScore / 100));
}

function asNumber(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

// Migrate the legacy v1 payload ({streak, lastDailyDate, bestScore}).
// Everything v1 tracked is preserved; new fields start at their defaults.
function migrateV1(parsed: Record<string, unknown>): LabStats {
  const streak = asNumber(parsed.streak);
  return {
    ...DEFAULT_STATS,
    currentStreak: streak,
    maxStreak: streak,
    bestScore: asNumber(parsed.bestScore),
    lastDailyDate: typeof parsed.lastDailyDate === 'string' ? parsed.lastDailyDate : '',
  };
}

function sanitizeV2(parsed: Record<string, unknown>): LabStats {
  const distribution = Array.isArray(parsed.scoreDistribution)
    ? SCORE_BUCKETS.map((_, i) => asNumber((parsed.scoreDistribution as unknown[])[i]))
    : [...DEFAULT_STATS.scoreDistribution];
  const history = Array.isArray(parsed.dailyHistory)
    ? (parsed.dailyHistory as unknown[])
        .filter((e): e is DailyHistoryEntry =>
          typeof e === 'object' && e !== null &&
          typeof (e as DailyHistoryEntry).date === 'string' &&
          typeof (e as DailyHistoryEntry).score === 'number')
        .slice(-HISTORY_LIMIT)
    : [];
  return {
    version: 2,
    played: asNumber(parsed.played),
    dailyPlayed: asNumber(parsed.dailyPlayed),
    currentStreak: asNumber(parsed.currentStreak),
    maxStreak: asNumber(parsed.maxStreak),
    bestScore: asNumber(parsed.bestScore),
    lastDailyDate: typeof parsed.lastDailyDate === 'string' ? parsed.lastDailyDate : '',
    lastDailyScore: asNumber(parsed.lastDailyScore),
    sumScore: asNumber(parsed.sumScore),
    scoreDistribution: distribution,
    dailyHistory: history,
  };
}

export function loadStats(): LabStats {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return sanitizeV2(parsed);
    }
    // No v2 yet — try to carry over the legacy v1 streak/best.
    const legacyRaw = window.localStorage.getItem(LEGACY_KEY);
    if (legacyRaw) {
      const migrated = migrateV1(JSON.parse(legacyRaw) as Record<string, unknown>);
      // Persist the migration so v1 is never read twice. The legacy key is
      // left in place as a rollback safety net.
      try { window.localStorage.setItem(KEY, JSON.stringify(migrated)); } catch { /* ignore */ }
      return migrated;
    }
    return { ...DEFAULT_STATS, scoreDistribution: [...DEFAULT_STATS.scoreDistribution] };
  } catch {
    return { ...DEFAULT_STATS, scoreDistribution: [...DEFAULT_STATS.scoreDistribution] };
  }
}

export function saveStats(stats: LabStats): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(stats));
  } catch {
    // Storage unavailable — stats simply don't persist.
  }
}

// Record a finished game. Daily completion advances the streak at most once
// per UTC day; replays never double-count it. Best score updates in any mode,
// and per-day history keeps the best score for that day.
export function recordGame(
  prev: LabStats,
  opts: { isDaily: boolean; totalScore: number; todayKey: string; yesterdayKey: string },
): LabStats {
  const next: LabStats = {
    ...prev,
    scoreDistribution: [...prev.scoreDistribution],
    dailyHistory: [...prev.dailyHistory],
  };

  next.played = prev.played + 1;
  next.sumScore = prev.sumScore + opts.totalScore;
  next.scoreDistribution[bucketIndex(opts.totalScore)] += 1;
  next.bestScore = Math.max(prev.bestScore, opts.totalScore);

  if (opts.isDaily) {
    next.dailyPlayed = prev.dailyPlayed + 1;
    if (prev.lastDailyDate !== opts.todayKey) {
      // First completion of this UTC day advances the streak (at most once/day).
      next.currentStreak = prev.lastDailyDate === opts.yesterdayKey ? prev.currentStreak + 1 : 1;
      next.lastDailyDate = opts.todayKey;
      next.lastDailyScore = opts.totalScore;
    } else {
      // Replay of an already-completed day: streak untouched, keep the day's best.
      next.lastDailyScore = Math.max(prev.lastDailyScore, opts.totalScore);
    }
    next.maxStreak = Math.max(prev.maxStreak, next.currentStreak);

    const bestToday = Math.max(
      opts.totalScore,
      prev.dailyHistory.find(e => e.date === opts.todayKey)?.score ?? 0,
    );
    const entry: DailyHistoryEntry = {
      date: opts.todayKey,
      score: bestToday,
      rating: ratingLabelForScore(bestToday),
    };
    next.dailyHistory = [
      ...prev.dailyHistory.filter(e => e.date !== opts.todayKey),
      entry,
    ].slice(-HISTORY_LIMIT);
  }

  return next;
}
