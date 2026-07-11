import type { HeatmapWeek } from "@/lib/words/heatmap";

const LEVEL_CLASSES = [
  "bg-plum-100/60", // 0
  "bg-plum-200", // 1
  "bg-plum-400", // 2
  "bg-plum-600", // 3
  "bg-plum-800", // 4
] as const;

function prettyDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function Heatmap({
  weeks,
  monthLabels,
}: {
  weeks: HeatmapWeek[];
  monthLabels: { index: number; label: string }[];
}) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="inline-block">
        {/* Month labels */}
        <div className="relative mb-1 ml-8 h-4 text-[10px] text-plum-400">
          {monthLabels.map((m) => (
            <span
              key={m.label}
              className="absolute"
              style={{ left: `${m.index * 15}px` }}
            >
              {m.label}
            </span>
          ))}
        </div>

        <div className="flex gap-1">
          {/* Weekday labels */}
          <div className="mr-1 flex w-6 flex-col justify-between py-[2px] text-[10px] text-plum-400">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
          </div>

          {/* Grid */}
          <div className="flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((cell, di) =>
                  cell === null ? (
                    <div key={di} className="size-3" />
                  ) : (
                    <div
                      key={cell.date}
                      title={
                        cell.future
                          ? undefined
                          : `${cell.words.toLocaleString()} words on ${prettyDate(cell.date)}`
                      }
                      aria-label={
                        cell.future
                          ? undefined
                          : `${cell.words} words on ${cell.date}`
                      }
                      className={`size-3 rounded-[3px] ${
                        cell.future
                          ? "bg-transparent"
                          : LEVEL_CLASSES[cell.level]
                      }`}
                    />
                  )
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-plum-400">
          <span>less</span>
          {LEVEL_CLASSES.map((cls) => (
            <div key={cls} className={`size-3 rounded-[3px] ${cls}`} />
          ))}
          <span>more</span>
        </div>
      </div>
    </div>
  );
}
