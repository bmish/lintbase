/* eslint filenames/match-exported:off */
import { FAKE_PLUGINS } from '@/data';
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ plugins: FAKE_PLUGINS });
}
