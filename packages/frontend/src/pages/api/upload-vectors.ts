/* eslint no-console:"off" */
import { NextApiRequest, NextApiResponse } from 'next';
import { Pinecone } from '@pinecone-database/pinecone';
import { prisma } from '@/server/db';
import OpenAI from 'openai';
import chunk from 'lodash.chunk';
import pLimit from 'p-limit';
import { env } from '@/env.mjs';

export default async function uploadVectors(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const environment = env.PINECONE_ENVIRONMENT;
  const apiKey = env.PINECONE_API_KEY;

  if (!environment || !apiKey) {
    res.status(400).end();
    return;
  }

  const pinecone = new Pinecone({
    environment,
    apiKey,
  });

  const index = pinecone.Index('lintbase');
  const namespaceRule = index.namespace('rule');
  const namespaceLinter = index.namespace('linter');

  console.log('Retrieving linters and rules');
  const [linters, rules] = await Promise.all([
    prisma.linter.findMany({
      include: { package: { include: { ecosystem: true } } },
    }),
    prisma.rule.findMany({
      include: {
        linter: { include: { package: { include: { ecosystem: true } } } },
      },
    }),
  ]);

  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  const limitRequests = pLimit(10); // Max 3000 RPM allowed.

  const embeddingsRules = await Promise.all(
    rules.map(async (rule) =>
      limitRequests(async () => {
        console.log(`Creating embedding for rule ${rule.name}...`);
        const embedding = await openai.embeddings.create({
          input: [rule.name, rule.description].filter(Boolean).join(': '),
          // TODO: include more data about rule?
          model: 'text-embedding-ada-002',
        });
        return { rule, embedding: embedding.data[0].embedding };
      }),
    ),
  );
  const embeddingsLinters = await Promise.all(
    linters.map(async (linter) =>
      limitRequests(async () => {
        console.log(`Creating embedding for linter ${linter.package.name}...`);
        const embedding = await openai.embeddings.create({
          input: [linter.package.name, linter.package.description]
            .filter(Boolean)
            .join(': '),
          // TODO: include more data about linter?
          model: 'text-embedding-ada-002',
        });
        return { linter, embedding: embedding.data[0].embedding };
      }),
    ),
  );

  const MAX_UPSERT_PAGE_SIZE = 100;

  console.log('Upserting rules...');
  for (const chunkedRules of chunk(embeddingsRules, MAX_UPSERT_PAGE_SIZE)) {
    await namespaceRule.upsert(
      chunkedRules.map(({ rule, embedding }) => ({
        id: `${rule.linter.package.ecosystem.name}#${rule.linter.package.name}#${rule.name}`,
        values: embedding,
        metadata: {
          ecosystemName: rule.linter.package.ecosystem.name,
          linterName: rule.linter.package.name,
        },
      })),
    );
    console.log('Next page...');
  }

  console.log('Upserting linters...');
  for (const chunkedLinters of chunk(embeddingsLinters, MAX_UPSERT_PAGE_SIZE)) {
    await namespaceLinter.upsert(
      chunkedLinters.map(({ linter, embedding }) => ({
        id: `${linter.package.ecosystem.name}#${linter.package.name}`,
        values: embedding,
        metadata: {
          ecosystemName: linter.package.ecosystem.name,
        },
      })),
    );
    console.log('Next page...');
  }

  console.log('Done.');

  res.status(200).json({
    uploadedRuleCount: embeddingsRules.length,
    uploadedLinterCount: embeddingsLinters.length,
  });
}
