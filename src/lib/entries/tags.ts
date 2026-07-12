/**
 * Tag parsing: users type freeform ("#Fiction, wip  #short-story") and we
 * normalize to lowercase kebab tokens, deduped, bounded.
 */

const MAX_TAGS = 12;
const MAX_TAG_LEN = 30;

export function parseTags(input: string): string[] {
  const seen = new Set<string>();
  for (const raw of input.split(/[\s,]+/)) {
    const tag = raw
      .replace(/^#+/, "")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, MAX_TAG_LEN);
    if (tag) seen.add(tag);
    if (seen.size >= MAX_TAGS) break;
  }
  return [...seen];
}

/** For editing: tags back to the text form the input shows. */
export function tagsToInput(tags: string[]): string {
  return tags.map((t) => `#${t}`).join(" ");
}
