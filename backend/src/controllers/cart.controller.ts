import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const getCart = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.email) return res.status(400).json({ error: 'Invalid user session' });

    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    if (!dbUser) return res.status(404).json({ error: 'User not found' });

    let cart = await prisma.cart.findUnique({
      where: { userId: dbUser.id },
      include: { items: { include: { product: true } } },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: dbUser.id },
        include: { items: { include: { product: true } } },
      });
    }

    res.json(cart.items);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
};

export const mergeCart = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { items } = req.body;

    if (!user || !user.email) return res.status(400).json({ error: 'Invalid user session' });

    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    if (!dbUser) return res.status(404).json({ error: 'User not found' });

    let cart = await prisma.cart.findUnique({ where: { userId: dbUser.id } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: dbUser.id } });
    }

    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const size = item.size || null;
        const color = item.color || null;

        const existingItem = await prisma.cartItem.findFirst({
          where: {
            cartId: cart.id,
            productId: String(item.productId || item.id),
            size: size || null,
            color: color || null,
          },
        });

        if (existingItem) {
          await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + item.quantity },
          });
        } else {
          await prisma.cartItem.create({
            data: {
              cartId: cart.id,
              productId: item.productId || item.id,
              quantity: item.quantity,
              size,
              color,
            },
          });
        }
      }
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true } } },
    });

    res.json(updatedCart?.items || []);
  } catch (error) {
    console.error('Error merging cart:', error);
    res.status(500).json({ error: 'Failed to merge cart' });
  }
};

export const addCartItem = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { productId, quantity = 1, size = null, color = null } = req.body;

    if (!user || !user.email) return res.status(400).json({ error: 'Invalid user session' });
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    if (!dbUser) return res.status(404).json({ error: 'User not found' });

    let cart = await prisma.cart.findUnique({ where: { userId: dbUser.id } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: dbUser.id } });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: String(productId),
        size: size || null,
        color: color || null,
      },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          size,
          color,
        },
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true } } },
    });

    res.json(updatedCart?.items || []);
  } catch (error) {
    console.error('Error adding cart item:', error);
    res.status(500).json({ error: 'Failed to add cart item' });
  }
};

export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.email) return res.status(400).json({ error: 'Invalid user session' });
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    if (!dbUser) return res.status(404).json({ error: 'User not found' });

    const { productId, size = null, color = null, quantity } = req.body;

    const cart = await prisma.cart.findUnique({ where: { userId: dbUser.id } });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: String(productId),
        size: size || null,
        color: color || null,
      },
    });

    if (!existingItem) return res.status(404).json({ error: 'Item not found' });

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: existingItem.id } });
    } else {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
};

export const removeCartItem = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.email) return res.status(400).json({ error: 'Invalid user session' });
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    if (!dbUser) return res.status(404).json({ error: 'User not found' });

    const { productId } = req.params;
    const size = req.query.size ? String(req.query.size) : null;
    const color = req.query.color ? String(req.query.color) : null;

    const cart = await prisma.cart.findUnique({ where: { userId: dbUser.id } });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: String(productId),
        size: size === 'default' ? null : size,
        color: color === 'default' ? null : color,
      },
    });

    if (existingItem) {
      await prisma.cartItem.delete({ where: { id: existingItem.id } });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({ error: 'Failed to remove cart item' });
  }
};

export const clearCart = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.email) return res.status(400).json({ error: 'Invalid user session' });
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    if (!dbUser) return res.status(404).json({ error: 'User not found' });

    const cart = await prisma.cart.findUnique({ where: { userId: dbUser.id } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
};
