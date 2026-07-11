/**
 * Contribution-heatmap grid for a calendar year, GitHub-style:
 * columns are weeks (Sun-start), rows are weekdays.
 */

export type HeatmapCell = {
  date: string; // YYYY-MM-DD
  words: number;
  /** 0 = none … 4 = most. */
  level: 0 | 1 | 2 | 3 | 4;
  future: boolean;
};

export type HeatmapWeek = (HeatmapCell | null)[]; // null = outside the year

/** Default level thresholds (words/day) when the user has no goal. */
export const DEFAULT_THRESHOLDS: [number, number, number, number] = [
  1, 500, 1500, 3000,
];

/**
 * Thresholds tied to a yearly goal: hitting your daily target lands level 3;
 * doubling it lands level 4.
 */
export function goalThresholds(
  targetWords: number,
  year: number
): [number, number, number, number] {
  const daily = targetWords / (isLeap(year) ? 366 : 365);
  return [1, Math.round(daily / 2), Math.round(daily), Math.round(daily * 2)];
}

function isLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function levelFor(
  words: number,
  thresholds: [number, number, number, number]
): 0 | 1 | 2 | 3 | 4 {
  if (words >= thresholds[3]) return 4;
  if (words >= thresholds[2]) return 3;
  if (words >= thresholds[1]) return 2;
  if (words >= thresholds[0]) return 1;
  return 0;
}

export function buildHeatmapGrid(input: {
  year: number;
  counts: Record<string, number>; // date → words
  today: string; // YYYY-MM-DD
  thresholds?: [number, number, number, number];
}): { weeks: HeatmapWeek[]; monthLabels: { index: number; label: string }[] } {
  const { year, counts, today } = input;
  const thresholds = input.thresholds ?? DEFAULT_THRESHOLDS;

  const jan1 = new Date(Date.UTC(year, 0, 1));
  const startPad = jan1.getUTCDay(); // 0 = Sunday

  const weeks: HeatmapWeek[] = [];
  const monthLabels: { index: number; label: string }[] = [];
  let week: HeatmapWeek = new Array(startPad).fill(null);
  let lastMonth = -1;

  const d = new Date(jan1);
  while (d.getUTCFullYear() === year) {
    const date = d.toISOString().slice(0, 10);
    const words = counts[date] ?? 0;

    if (d.getUTCMonth() !== lastMonth) {
      lastMonth = d.getUTCMonth();
      monthLabels.push({
        index: weeks.length,
        label: d.toLocaleString("en-US", {
          month: "short",
          timeZone: "UTC",
        }),
      });
    }

    week.push({
      date,
      words,
      level: date > today ? 0 : levelFor(words, thresholds),
      future: date > today,
    });

    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return { weeks, monthLabels };
}
