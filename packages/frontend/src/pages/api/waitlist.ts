import { prisma } from '@/server/db';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function waitlist(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { email } = req.body as { email?: string };

  if (!email || typeof email !== 'string') {
    res.status(400).end();
    return;
  }

  const result = await prisma.userWaitlist.create({
    data: {
      email,
    },
  });

  res.status(200).json({ result });
}
