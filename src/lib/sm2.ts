// SM-2 spaced repetition algorithm
// q: quality of response (0-5), where 0-1 = fail, 2-5 = pass

export interface SM2State {
  easeFactor: number;
  interval: number;
  repetitions: number;
}

export type SM2Quality = 0 | 1 | 2 | 3 | 4 | 5;

export function sm2(state: SM2State, q: SM2Quality): SM2State & { nextReview: Date } {
  let { easeFactor, interval, repetitions } = state;

  if (q >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
  );

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return { easeFactor, interval, repetitions, nextReview };
}

export function qualityLabel(q: SM2Quality): string {
  const labels: Record<SM2Quality, string> = {
    0: "Blackout",
    1: "Wrong",
    2: "Wrong but familiar",
    3: "Correct (hard)",
    4: "Correct",
    5: "Perfect",
  };
  return labels[q];
}
