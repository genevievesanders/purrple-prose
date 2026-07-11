"use client";

import { useEffect, useRef, useState } from "react";
import type { CatPrompt } from "@/lib/prompts";
import { getCatPromptAction } from "@/app/(app)/cat/actions";
import { SleepingCat, WalkingCat } from "./cat-svgs";
import { pickThinkingPun } from "./thinking";

const WALK_MS = 2600;

type CatState = "sleeping" | "walking" | "speaking" | "returning";

/**
 * The cat. Sleeps in the bottom-right corner; on click it wakes, pads
 * across the screen, and delivers a prompt in a speech bubble. Fetching
 * starts at the moment of the click so the prompt is usually ready by the
 * time the cat arrives.
 */
export function PurrCat() {
  const [state, setState] = useState<CatState>("sleeping");
  const [prompt, setPrompt] = useState<CatPrompt | null>(null);
  const [walkX, setWalkX] = useState(0);
  const [pun, setPun] = useState("paws for thought…");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(
    () => () => timers.current.forEach(clearTimeout),
    []
  );

  function later(fn: () => void, ms: number) {
    timers.current.push(setTimeout(fn, ms));
  }

  function wake() {
    if (state !== "sleeping") return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    setPrompt(null);
    setPun(pickThinkingPun());
    getCatPromptAction()
      .then(setPrompt)
      .catch(() =>
        setPrompt({
          kind: "prompt",
          text: "The cat blinks slowly. Even without a thought to share, it believes in you. (Try again in a moment.)",
        })
      );

    if (reduceMotion) {
      setState("speaking");
      return;
    }

    // Walk from the right corner toward the middle of the screen — but
    // never so far that the speech bubble (288px, right-aligned to the cat)
    // would clip off the left edge.
    const bubbleClearance = 320;
    const distance = Math.max(
      0,
      Math.min(
        window.innerWidth * 0.45,
        560,
        window.innerWidth - 24 - bubbleClearance
      )
    );
    setState("walking");
    // Let the browser paint the standing cat before the transform starts.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setWalkX(-distance))
    );
    later(() => setState("speaking"), WALK_MS);
  }

  function dismiss() {
    if (state !== "speaking") return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion || walkX === 0) {
      setState("sleeping");
      setWalkX(0);
      return;
    }
    setState("returning");
    setWalkX(0);
    later(() => setState("sleeping"), WALK_MS);
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
      <div
        className="absolute bottom-1 right-6"
        style={{
          transform: `translateX(${state === "sleeping" ? 0 : walkX}px)`,
          transition:
            state === "walking" || state === "returning"
              ? `transform ${WALK_MS}ms ease-in-out`
              : undefined,
        }}
      >
        {/* Speech bubble */}
        {state === "speaking" && (
          <div className="cat-bubble pointer-events-auto absolute bottom-full right-0 mb-3 w-72 rounded-2xl border border-plum-200 bg-cream-50 p-4 shadow-lg">
            {prompt ? (
              <>
                <p className="text-sm leading-relaxed text-plum-900">
                  {prompt.text}
                </p>
                {prompt.words && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {prompt.words.map((w) => (
                      <span
                        key={w}
                        className="rounded-full bg-plum-100 px-2.5 py-0.5 font-serif text-sm text-plum-800"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={dismiss}
                  className="mt-3 rounded-lg bg-plum-700 px-3 py-1 text-xs font-medium text-white transition hover:bg-plum-800"
                >
                  purrfect, thanks
                </button>
              </>
            ) : (
              <p className="text-sm text-plum-400">
                <span className="cat-thinking">{pun}</span>
              </p>
            )}
            {/* bubble tail */}
            <div className="absolute -bottom-[7px] right-10 size-3.5 rotate-45 border-b border-r border-plum-200 bg-cream-50" />
          </div>
        )}

        {/* The cat itself */}
        <button
          type="button"
          onClick={state === "sleeping" ? wake : state === "speaking" ? dismiss : undefined}
          aria-label={
            state === "sleeping"
              ? "Wake the cat for a writing prompt"
              : "The cat"
          }
          className="pointer-events-auto relative block cursor-pointer bg-transparent"
        >
          {state === "sleeping" ? (
            <span className="relative block">
              <SleepingCat />
              <span className="cat-zzz absolute -top-4 right-3 font-serif text-sm text-plum-400">
                z
              </span>
              <span
                className="cat-zzz absolute -top-8 right-6 font-serif text-xs text-plum-300"
                style={{ animationDelay: "0.9s" }}
              >
                z
              </span>
            </span>
          ) : (
            // Face left when heading out, right when walking home.
            <span className={state === "returning" ? "block -scale-x-100" : "block"}>
              <WalkingCat walking={state === "walking" || state === "returning"} />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
