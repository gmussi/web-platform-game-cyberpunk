import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json({
      name: '2D Platformer Game',
      version: '1.0.0',
      description: 'A 2D side-scrolling platformer game built with Phaser.js and TypeScript',
      author: 'Game Developer',
    });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
