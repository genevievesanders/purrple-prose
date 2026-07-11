/**
 * Split entry text into chunks for the lore bible. Paragraph-boundary
 * splits, merged up to ~TARGET chars, so a chunk reads as a coherent beat.
 */

const TARGET = 1000;
const MIN_CHUNK = 20; // ignore fragments that carry no lore

export function chunkText(text: string): string[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const p of paragraphs) {
    if (current && current.length + p.length + 2 > TARGET) {
      chunks.push(current);
      current = p;
    } else {
      current = current ? `${current}\n\n${p}` : p;
    }
    // A single huge paragraph gets hard-split.
    while (current.length > TARGET * 1.5) {
      chunks.push(current.slice(0, TARGET));
      current = current.slice(TARGET);
    }
  }
  if (current) chunks.push(current);

  return chunks.filter((c) => c.length >= MIN_CHUNK);
}
