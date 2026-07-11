import { requireUserId } from "@/lib/auth";
import {
  getDailyCounts,
  getMilwordyGoal,
  getWordsInRange,
} from "@/lib/db/progress";
import { computeMilwordyStats } from "@/lib/milwordy/math";
import { buildHeatmapGrid, goalThresholds } from "@/lib/words/heatmap";
import { Heatmap } from "@/components/heatmap";
import { joinMilwordyAction, leaveMilwordyAction } from "./actions";

export const metadata = { title: "Progress · Purrple Prose" };

function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function prettyDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "good" | "bad";
}) {
  return (
    <div className="rounded-2xl border border-plum-100 bg-white/60 p-4">
      <div className="text-xs uppercase tracking-wide text-plum-400">
        {label}
      </div>
      <div
        className={`mt-1 font-serif text-2xl ${
          tone === "good"
            ? "text-emerald-700"
            : tone === "bad"
              ? "text-rose-600"
              : "text-plum-900"
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-plum-400">{hint}</div>}
    </div>
  );
}

export default async function ProgressPage() {
  const userId = await requireUserId();
  const today = todayLocalISO();
  const year = Number(today.slice(0, 4));

  const [goal, counts] = await Promise.all([
    getMilwordyGoal(userId),
    getDailyCounts(userId, year),
  ]);

  const yearWords = Object.values(counts).reduce((a, b) => a + b, 0);
  const grid = buildHeatmapGrid({
    year,
    counts,
    today,
    thresholds: goal ? goalThresholds(goal.targetWords, year) : undefined,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-1 font-serif text-2xl text-plum-900">
          Your year in words
        </h1>
        <p className="text-sm text-plum-500">
          {yearWords.toLocaleString()} words written in {year}
        </p>
      </div>

      <section className="rounded-2xl border border-plum-100 bg-white/60 p-5">
        <Heatmap weeks={grid.weeks} monthLabels={grid.monthLabels} />
      </section>

      {goal ? (
        <MilwordySection
          targetWords={goal.targetWords}
          startDate={goal.startDate.toISOString().slice(0, 10)}
          userId={userId}
          today={today}
        />
      ) : (
        <JoinCard today={today} />
      )}
    </div>
  );
}

async function MilwordySection({
  targetWords,
  startDate,
  userId,
  today,
}: {
  targetWords: number;
  startDate: string;
  userId: string;
  today: string;
}) {
  // Words inside the challenge window only.
  const preview = computeMilwordyStats({
    targetWords,
    totalWords: 0,
    today,
    startDate,
  });
  const totalWords = await getWordsInRange(userId, startDate, preview.endDate);
  const s = computeMilwordyStats({ targetWords, totalWords, today, startDate });
  const ahead = s.aheadBy >= 0;

  return (
    <section>
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-serif text-xl text-plum-900">
          Milwordy — {targetWords.toLocaleString()} words
        </h2>
        <form action={leaveMilwordyAction}>
          <button
            type="submit"
            className="text-xs text-plum-400 underline hover:text-plum-600"
          >
            leave the challenge
          </button>
        </form>
      </div>
      <p className="mb-4 text-xs text-plum-400">
        {prettyDate(startDate)} → {prettyDate(s.endDate)}
      </p>

      {!s.started ? (
        <div className="rounded-2xl border border-dashed border-plum-200 p-6 text-center text-sm text-plum-500">
          The challenge begins {prettyDate(startDate)}. The cat is napping
          until then.
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="mb-4 h-3 overflow-hidden rounded-full bg-plum-100">
            <div
              className="h-full rounded-full bg-plum-600 transition-all"
              style={{ width: `${(s.progress * 100).toFixed(2)}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat
              label={ahead ? "Ahead by" : "Behind by"}
              value={`${Math.abs(s.aheadBy).toLocaleString()} words`}
              hint={`expected ${s.expectedToDate.toLocaleString()} by today`}
              tone={ahead ? "good" : "bad"}
            />
            <Stat
              label="Current pace"
              value={`${Math.round(s.pace).toLocaleString()}/day`}
              hint={`needs ${Math.round(s.requiredPace).toLocaleString()}/day to finish`}
            />
            <Stat
              label="Projected total"
              value={s.projectedTotal.toLocaleString()}
              hint={`of ${targetWords.toLocaleString()}`}
            />
            <Stat
              label="Projected finish"
              value={
                s.projectedFinish
                  ? prettyDate(s.projectedFinish)
                  : s.finishBeyondHorizon
                    ? "not at this pace 🐾"
                    : "—"
              }
              hint={
                s.projectedFinish
                  ? "at your current pace"
                  : "the cat believes in you"
              }
            />
          </div>
        </>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer text-xs text-plum-400 hover:text-plum-600">
          adjust goal
        </summary>
        <GoalForm
          submitLabel="Update"
          defaultTarget={targetWords}
          defaultStart={startDate}
        />
      </details>
    </section>
  );
}

function JoinCard({ today }: { today: string }) {
  return (
    <section className="rounded-2xl border border-dashed border-plum-200 p-8 text-center">
      <div className="mb-2 text-4xl" aria-hidden>
        🐈‍⬛
      </div>
      <h2 className="font-serif text-xl text-plum-900">Join Milwordy</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-plum-500">
        A million words in a year — starting whenever you say. The cat will
        keep score, track your pace, and judge you only slightly.
      </p>
      <GoalForm
        submitLabel="Opt in"
        defaultTarget={1_000_000}
        defaultStart={today}
        centered
      />
    </section>
  );
}

function GoalForm({
  submitLabel,
  defaultTarget,
  defaultStart,
  centered,
}: {
  submitLabel: string;
  defaultTarget: number;
  defaultStart: string;
  centered?: boolean;
}) {
  return (
    <form
      action={joinMilwordyAction}
      className={`mt-4 flex max-w-md flex-wrap items-end gap-2 ${
        centered ? "mx-auto justify-center" : ""
      }`}
    >
      <label className="block text-left">
        <span className="mb-1 block text-xs text-plum-500">Target words</span>
        <input
          name="targetWords"
          type="number"
          defaultValue={defaultTarget}
          min={1000}
          max={10_000_000}
          step={1000}
          className="w-36 rounded-xl border border-plum-200 bg-white/70 px-3 py-2 text-sm text-plum-900 outline-none focus:border-plum-400"
        />
      </label>
      <label className="block text-left">
        <span className="mb-1 block text-xs text-plum-500">Start date</span>
        <input
          name="startDate"
          type="date"
          defaultValue={defaultStart}
          className="rounded-xl border border-plum-200 bg-white/70 px-3 py-2 text-sm text-plum-900 outline-none focus:border-plum-400"
        />
      </label>
      <button
        type="submit"
        className="rounded-xl bg-plum-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-plum-800"
      >
        {submitLabel}
      </button>
    </form>
  );
}
