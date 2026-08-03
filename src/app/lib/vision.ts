// Color vision grade — a shareable, print-trade flavored reading of the mean
// CIEDE2000 ΔE across a finished run. This is a "vision grade", deliberately
// distinct from the score rating (COLOR NOVICE..COLOR MASTER): the rating
// judges the score, the grade judges the eye. The two coexist on the report.
//
// Always presented as an approximation — never a diagnosis, never a substitute
// for a clinical vision test.
//
// Colors follow the MindMarket palette; text-on-white variants are darkened
// versions of the same hue so the stamps stay readable.

const GRASS_TEXT = '#4d8b31';
const SUNSHINE_TEXT = '#8a7500';
const CORAL_TEXT = '#d94a35';
const SKY_TEXT = '#1a6fb5';

export interface VisionGrade {
  label: string; // e.g. "PROOFER"
  blurb: string; // one-line shop-floor reading
  color: string; // MindMarket palette, readable text variant
}

export function visionGradeFor(meanDeltaE: number): VisionGrade {
  if (meanDeltaE < 2) {
    return {
      label: 'PRESS-ROOM GRADE',
      blurb: 'Your eye signs off proofs the press would accept.',
      color: SKY_TEXT,
    };
  }
  if (meanDeltaE < 5) {
    return {
      label: 'PROOFER',
      blurb: 'A working proofreader’s eye — small errors, caught early.',
      color: GRASS_TEXT,
    };
  }
  if (meanDeltaE < 10) {
    return {
      label: 'APPRENTICE',
      blurb: 'Learning the trade; the hue wheel is yours to master.',
      color: SUNSHINE_TEXT,
    };
  }
  return {
    label: 'TRAINEE',
    blurb: 'First week on the floor — the sliders will teach you.',
    color: CORAL_TEXT,
  };
}

// One-line science footnote. Phrased as a rule of thumb on purpose: ΔE ≈ 1 is
// the commonly cited just-noticeable-difference under ideal conditions, and
// 2–5 is a realistic sharp range for screen viewing — both are approximations,
// not lab constants, and we say so.
export const VISION_FOOTNOTE =
  'Rule of thumb, not gospel: under ideal viewing conditions the human eye can tell apart differences down to about ΔE ≈ 1, and a typical screen observer averaging ΔE 2–5 across five proofs already has a sharp eye. Thresholds vary with observer, medium and formula — treat this grade as a shop-floor honorific, never as a vision test.';
