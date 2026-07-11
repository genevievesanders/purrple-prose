/**
 * Server-boot hook (Next.js instrumentation). Starts the in-process coach
 * scheduler: an hourly sweep that lets the cat leave overnight notes.
 *
 * Deliberately not a job queue — this app runs as a single long-lived
 * process for a single user. The sweep is idempotent (one note per user
 * per day, DB-enforced), so restarts and overlapping runs are harmless.
 * Swap for Inngest/cron at the point this deploys serverless.
 */

const SWEEP_INTERVAL_MS = 60 * 60 * 1000; // hourly
const BOOT_DELAY_MS = 15 * 1000; // let the server settle first

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.COACH_DISABLED === "1") return;

  const { runCoachSweep } = await import("@/lib/agents/coach");

  const sweep = async () => {
    try {
      const created = await runCoachSweep();
      if (created > 0) console.log(`[coach] left ${created} note(s) 🐾`);
    } catch (err) {
      console.warn("[coach] sweep error:", err);
    }
  };

  setTimeout(sweep, BOOT_DELAY_MS);
  setInterval(sweep, SWEEP_INTERVAL_MS);
}
