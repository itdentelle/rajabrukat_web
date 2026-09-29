import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const getWishlist = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) return res.status(400).json({ error: 'Invalid user session' });

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(wishlistItems.map((w: any) => w.product));
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
};

export const toggleWishlist = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) return res.status(400).json({ error: 'Invalid user session' });

    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID is required' });

    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    if (existing) {
      await prisma.wishlistItem.delete({
        where: { id: existing.id },
      });
      res.json({ message: 'Removed from wishlist', added: false });
    } else {
      await prisma.wishlistItem.create({
        data: {
          userId: user.id,
          productId,
        },
      });
      res.json({ message: 'Added to wishlist', added: true });
    }
  } catch (error) {
    console.error('Error toggling wishlist:', error);
    res.status(500).json({ error: 'Failed to update wishlist' });
  }
};
