/**
 * URL slugs derived from entry titles: lowercase, diacritics stripped,
 * non-alphanumerics collapsed to hyphens. Empty/untitled input yields ""
 * (callers fall back to the entry id).
 */

const MAX_LEN = 80;

export function slugify(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_LEN)
    .replace(/-+$/g, "");
  return slug === "untitled" ? "" : slug;
}

/**
 * First candidate not in `taken`: base, base-2, base-3, …
 * (An entry keeping its own slug should be excluded from `taken`.)
 */
export function uniqueSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
}
