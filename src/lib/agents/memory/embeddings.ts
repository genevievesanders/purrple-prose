/**
 * Embeddings for the lore bible, behind a swappable interface.
 *
 * Default: HashedNgramEmbedder — feature-hashed words + bigrams into a
 * 384-dim tf vector (FNV-1a), L2-normalized. Zero dependencies, zero keys,
 * deterministic, and cosine over it equals bag-of-words similarity — which
 * is exactly what continuity checking needs (names, places, and concrete
 * details are lexical). Swap in a semantic provider (Voyage/OpenAI) later
 * via EMBEDDINGS_PROVIDER without touching the store.
 */

export const EMBEDDING_DIM = 384;

export interface EmbeddingsProvider {
  readonly name: string;
  embed(text: string): Promise<number[]>;
}

function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function tokenize(text: string): string[] {
  return (
    text
      .toLowerCase()
      .match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? []
  );
}

export class HashedNgramEmbedder implements EmbeddingsProvider {
  readonly name = "hashed-ngram";

  async embed(text: string): Promise<number[]> {
    const vec = new Array<number>(EMBEDDING_DIM).fill(0);
    const words = tokenize(text);

    for (let i = 0; i < words.length; i++) {
      vec[fnv1a(words[i]) % EMBEDDING_DIM] += 1;
      if (i + 1 < words.length) {
        vec[fnv1a(`${words[i]}_${words[i + 1]}`) % EMBEDDING_DIM] += 0.5;
      }
    }

    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    if (norm === 0) return vec;
    return vec.map((v) => v / norm);
  }
}

let cached: EmbeddingsProvider | null = null;

export function getEmbedder(): EmbeddingsProvider {
  if (!cached) {
    // EMBEDDINGS_PROVIDER reserved for future semantic providers; every
    // current value maps to the hashed embedder.
    cached = new HashedNgramEmbedder();
  }
  return cached;
}
