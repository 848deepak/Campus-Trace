type EmbeddingResponse = {
  data?: Array<{ embedding?: number[] }>;
};

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
const ENABLE_SEMANTIC_MATCHING = process.env.ENABLE_SEMANTIC_MATCHING === "true";

function cosineSimilarity(a: number[], b: number[]) {
  if (!a.length || !b.length || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    magA += a[index] * a[index];
    magB += b[index] * b[index];
  }

  if (!magA || !magB) {
    return 0;
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function normalizeToUnitRange(score: number) {
  return Math.max(0, Math.min(1, (score + 1) / 2));
}

export function hashSimilarity(hashA?: string | null, hashB?: string | null) {
  if (!hashA || !hashB || hashA.length !== hashB.length) {
    return null;
  }

  let different = 0;
  for (let index = 0; index < hashA.length; index += 1) {
    if (hashA[index] !== hashB[index]) {
      different += 1;
    }
  }

  return Math.max(0, 1 - different / hashA.length);
}

export async function semanticSimilarity(textA: string, textB: string) {
  if (!ENABLE_SEMANTIC_MATCHING || !OPENAI_API_KEY) {
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input: [textA, textB],
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as EmbeddingResponse;
  const embA = payload.data?.[0]?.embedding;
  const embB = payload.data?.[1]?.embedding;

  if (!embA || !embB) {
    return null;
  }

  return normalizeToUnitRange(cosineSimilarity(embA, embB));
}
