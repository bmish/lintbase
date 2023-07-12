import { PineconeClient } from '@pinecone-database/pinecone';
import { env } from '@/env.mjs';

export async function getVectors(vectorIds: string[], namespace: string) {
  const environment = env.PINECONE_ENVIRONMENT;
  const apiKey = env.PINECONE_API_KEY;

  if (!environment || !apiKey) {
    throw new Error('Pinecone environment and API key must be set');
  }

  const pinecone = new PineconeClient();
  await pinecone.init({
    environment,
    apiKey,
  });
  const index = pinecone.Index('lintbase');

  const vectorResponse = await index.fetch({
    ids: vectorIds,
    namespace,
  });

  return vectorResponse.vectors;
}
