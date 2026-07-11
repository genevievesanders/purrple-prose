import { NextRequest } from "next/server";
import { runCoachSweep } from "@/lib/agents/coach";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Coach sweep for serverless deploys (Vercel Cron — see vercel.json).
 * Locally the in-process scheduler (instrumentation.ts) does this instead.
 * Secured with CRON_SECRET so only the platform can trigger it.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const created = await runCoachSweep();
  return Response.json({ created });
}
