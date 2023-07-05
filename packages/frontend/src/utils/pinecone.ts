import { PineconeClient } from '@pinecone-database/pinecone';

export async function getVectors(vectorIds: string[], namespace: string) {
  const environment = process.env.PINECONE_ENVIRONMENT;
  const apiKey = process.env.PINECONE_API_KEY;

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
