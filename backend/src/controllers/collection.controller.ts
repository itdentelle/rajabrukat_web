import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { redisClient } from '../config/redis';

export const getCollections = async (req: Request, res: Response) => {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: { createdAt: 'asc' },
    });
    res.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
};

export const getCollectionById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const collection = await prisma.collection.findUnique({ where: { id } });
    if (!collection) return res.status(404).json({ error: 'Collection not found' });
    res.json(collection);
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
};

export const createCollection = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: 'Unauthorized' });

    const { title, subtitle, description, imageUrl, color, isActive } = req.body;

    const collection = await prisma.collection.create({
      data: {
        title,
        subtitle,
        description,
        imageUrl,
        color,
        isActive,
      },
    });

    if (redisClient) await redisClient.del('cache:/api/collections');
    res.status(201).json(collection);
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({ error: 'Failed to create collection' });
  }
};

export const updateCollection = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: 'Unauthorized' });

    const id = req.params.id as string;
    const { title, subtitle, description, imageUrl, color, isActive } = req.body;

    const collection = await prisma.collection.update({
      where: { id },
      data: { title, subtitle, description, imageUrl, color, isActive },
    });

    if (redisClient) await redisClient.del('cache:/api/collections');
    res.json(collection);
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).json({ error: 'Failed to update collection' });
  }
};

export const deleteCollection = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: 'Unauthorized' });

    const id = req.params.id as string;
    await prisma.collection.delete({ where: { id } });

    if (redisClient) await redisClient.del('cache:/api/collections');
    res.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
};
