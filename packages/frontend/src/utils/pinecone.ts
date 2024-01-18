import { Pinecone } from '@pinecone-database/pinecone';
import { env } from '@/env.mjs';

/**
 * Get vectors from Pinecone for related/similarity search.
 */
export async function getVectors(vectorIds: string[], namespaceName: string) {
  const environment = env.PINECONE_ENVIRONMENT;
  const apiKey = env.PINECONE_API_KEY;

  if (!environment || !apiKey) {
    throw new Error('Pinecone environment and API key must be set');
  }

  const pinecone = new Pinecone({
    environment,
    apiKey,
  });
  const index = pinecone.Index('lintbase');
  const namespace = index.namespace(namespaceName);
  const vectorResponse = await namespace.fetch(vectorIds);

  return vectorResponse.records;
}
