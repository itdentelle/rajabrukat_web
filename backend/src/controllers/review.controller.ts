import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const productId = req.params.id as string;
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

export const createProductReview = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const productId = req.params.id as string;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid rating' });
    }

    // Verify user has purchased this product AND order is COMPLETED
    const hasPurchased = await prisma.order.findFirst({
      where: {
        userId: user.id,
        status: 'COMPLETED',
        items: {
          some: { productId },
        },
      },
    });

    if (!hasPurchased) {
      return res.status(403).json({
        error: 'You can only review products you have purchased and received (COMPLETED status).',
      });
    }

    const existingReview = await prisma.review.findFirst({
      where: { userId: user.id, productId },
    });

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this product.' });
    }

    const review = await prisma.review.create({
      data: {
        rating: Number(rating),
        comment,
        productId,
        userId: user.id,
      },
      include: {
        user: { select: { name: true } },
      },
    });

    res.status(201).json(review);
  } catch (error) {
    console.error('Error posting review:', error);
    res.status(500).json({ error: 'Failed to post review' });
  }
};
