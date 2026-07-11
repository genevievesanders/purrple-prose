/** The cat's thinking states — one is chosen at random each time. */
export const THINKING_PUNS = [
  "kneading an idea…",
  "pawndering…",
  "chasing the thought's tail…",
  "whisker-deep in thought…",
  "paws for thought…",
] as const;

export function pickThinkingPun(): string {
  return THINKING_PUNS[Math.floor(Math.random() * THINKING_PUNS.length)];
}
