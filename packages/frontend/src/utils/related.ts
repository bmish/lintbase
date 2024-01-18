import { Pinecone } from '@pinecone-database/pinecone';
import { env } from '@/env.mjs';

/**
 * Experimental feature to find related rules or linters.
 */
export async function related(
  params:
    | {
        type: 'rule';
        ecosystemName: string;
        linterName: string;
        ruleName: string;
        count?: number | undefined;
      }
    | {
        type: 'linter';
        ecosystemName: string;
        linterName: string;
        count?: number | undefined;
      },
) {
  const environment = env.PINECONE_ENVIRONMENT;
  const apiKey = env.PINECONE_API_KEY;

  if (!environment || !apiKey) {
    return null;
  }

  const pinecone = new Pinecone({
    environment,
    apiKey,
  });

  const index = pinecone.Index('lintbase');
  const namespace = index.namespace(params.type);

  const vectorId =
    params.type === 'rule'
      ? `${params.ecosystemName}#${params.linterName}#${params.ruleName}`
      : `${params.ecosystemName}#${params.linterName}`;

  const vectorResponse = await namespace.fetch([vectorId]);
  if (!vectorResponse || !vectorResponse.records[vectorId]) {
    throw new Error('No vectors found.');
  }

  const vector = vectorResponse.records[vectorId].values;

  const count = params.count ?? 5;

  const extra =
    params.type === 'rule'
      ? {
          filter: {
            linterName: params.linterName,
          },
        }
      : {};
  const related = await namespace.query({
    vector,
    topK: count + 1, // Add one in case the vector itself is returned.
    ...extra,
  });

  return related.matches
    ?.filter((match) => match.id !== vectorId)
    .slice(0, count);
}
