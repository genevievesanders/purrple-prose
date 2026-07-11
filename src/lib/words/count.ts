/**
 * Count words in a piece of writing.
 *
 * A "word" is any run of non-whitespace characters containing at least one
 * letter or digit (so `—` alone or `...` don't count, but `it's`,
 * `well-known`, and `café` each count once).
 */
export function countWords(text: string): number {
  if (!text) return 0;
  const tokens = text.split(/\s+/);
  let count = 0;
  for (const token of tokens) {
    if (/[\p{L}\p{N}]/u.test(token)) count++;
  }
  return count;
}
