import { PineconeClient } from '@pinecone-database/pinecone';
import { env } from '@/env.mjs';

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
      }
) {
  const environment = env.PINECONE_ENVIRONMENT;
  const apiKey = env.PINECONE_API_KEY;

  if (!environment || !apiKey) {
    return null;
  }

  const pinecone = new PineconeClient();
  await pinecone.init({
    environment,
    apiKey,
  });

  const rulesIndex = pinecone.Index('lintbase');

  const vectorId =
    params.type === 'rule'
      ? `${params.ecosystemName}#${params.linterName}#${params.ruleName}`
      : `${params.ecosystemName}#${params.linterName}`;

  const vectorResponse = await rulesIndex.fetch({
    ids: [vectorId],
    namespace: params.type,
  });

  if (!vectorResponse.vectors || !vectorResponse.vectors[vectorId]) {
    throw new Error('No vectors found.');
  }

  const vector = vectorResponse.vectors[vectorId].values;

  const count = params.count ?? 5;

  const extra =
    params.type === 'rule'
      ? {
          filter: {
            linterName: params.linterName,
          },
        }
      : {};
  const related = await rulesIndex.query({
    queryRequest: {
      vector,
      topK: count + 1, // Add one in case the vector itself is returned.
      namespace: params.type,
      ...extra,
    },
  });

  return related.matches
    ?.filter((match) => match.id !== vectorId)
    .slice(0, count);
}
