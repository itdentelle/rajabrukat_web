import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { redisClient } from '../config/redis';

export const getCatalog = async (req: Request, res: Response) => {
  try {
    let config = await prisma.siteConfig.findUnique({ where: { id: 'hero-banner' } });

    const catalogData = {
      title: 'Katalog Koleksi Terbaik Raja Brukat 2026',
      subtitle: 'Brukat premium untuk kebaya, wisuda, lamaran, dan momen istimewa',
      pdfUrl: config?.catalogPdfUrl || '/Katalog.pdf',
      totalPages: 14,
      pageRatio: 1.414,
      productMap: {
        1: '1638',
        2: '1638',
        3: '1639',
        4: '1639',
        5: '1640',
        6: '1640',
        7: '1641',
        8: '1641',
        9: '1642',
        10: '1642',
        11: '1643',
        12: '1643',
        13: '1644',
        14: '1644',
      },
      cachedAt: new Date().toISOString(),
    };
    res.json(catalogData);
  } catch (error) {
    console.error('Error fetching catalog endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch catalog data' });
  }
};

export const updateCatalog = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: 'Unauthorized' });

    if (redisClient) {
      await redisClient.del('cache:/api/catalog');
    }

    res.json({
      message: 'Catalog updated successfully and Redis cache cleared',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating catalog endpoint:', error);
    res.status(500).json({ error: 'Failed to update catalog' });
  }
};
