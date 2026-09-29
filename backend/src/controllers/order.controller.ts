import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { redisClient } from '../config/redis';
import { createMidtransTransaction, cancelMidtransTransaction } from '../services/midtrans.service';
import { sendNotificationEmail } from '../services/email.service';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { customerName, email, phone, address, items, userId, shippingMethod, shippingCost } =
      req.body;

    // Idempotency check to prevent double-checkout
    const idempotencyKey = `checkout_lock:${email}`;
    const isLocked = redisClient ? await redisClient.get(idempotencyKey) : null;
    if (isLocked) {
      return res
        .status(429)
        .json({ error: 'Terlalu banyak permintaan checkout. Mohon tunggu beberapa detik.' });
    }
    if (redisClient) await redisClient.setex(idempotencyKey, 5, 'locked');

    // Verify stock first (including color variant stock)
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        if (redisClient) await redisClient.del(idempotencyKey);
        return res.status(404).json({ error: `Produk tidak ditemukan.` });
      }

      const colorStocks: any =
        product.colorStocks && typeof product.colorStocks === 'object'
          ? (product.colorStocks as any)
          : null;
      if (item.color && colorStocks && colorStocks[item.color] !== undefined) {
        const variantStock = Number(colorStocks[item.color]);
        if (variantStock < item.quantity) {
          if (redisClient) await redisClient.del(idempotencyKey);
          return res.status(400).json({
            error: `Stok warna "${item.color}" untuk ${product.name} tidak mencukupi. Tersisa: ${variantStock}`,
          });
        }
      } else if (product.stock < item.quantity) {
        if (redisClient) await redisClient.del(idempotencyKey);
        return res
          .status(400)
          .json({ error: `Stok tidak mencukupi untuk ${product.name}. Tersisa: ${product.stock}` });
      }
    }

    // calculate totalAmount and decrease stock
    let totalItemsAmount = 0;
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      let updatedColorStocks =
        product?.colorStocks && typeof product.colorStocks === 'object'
          ? { ...(product.colorStocks as any) }
          : null;

      if (item.color && updatedColorStocks && updatedColorStocks[item.color] !== undefined) {
        updatedColorStocks[item.color] = Math.max(
          0,
          Number(updatedColorStocks[item.color]) - item.quantity
        );
      }

      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
          colorStocks: updatedColorStocks ? updatedColorStocks : undefined,
        },
      });
      totalItemsAmount += item.price * item.quantity;
    }

    const finalShippingCost = shippingCost ? Number(shippingCost) : 0;
    const totalAmount = totalItemsAmount + finalShippingCost;

    const orderData: any = {
      customerName,
      email,
      phone,
      address,
      shippingMethod: shippingMethod || null,
      shippingCost: finalShippingCost,
      totalAmount,
      status: 'PENDING',
      items: {
        create: items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    };

    if (userId) {
      orderData.userId = userId;
    }

    let order = await prisma.order.create({
      data: orderData,
      include: {
        items: true,
      },
    });

    // Buat tagihan Midtrans
    try {
      const redirectUrl = await createMidtransTransaction({
        orderId: order.id,
        totalAmount,
        customerName,
        email,
        phone,
      });

      if (redirectUrl) {
        order = await prisma.order.update({
          where: { id: order.id },
          data: { paymentUrl: redirectUrl },
          include: { items: true },
        });
      }
    } catch (paymentErr: any) {
      console.error('Midtrans Snap Error:', paymentErr.message);
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = (req as any).user;

    if (!user || !user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userId !== user.id) {
      return res.status(403).json({ error: 'Forbidden: Not your order' });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only PENDING orders can be cancelled' });
    }

    await cancelMidtransTransaction(order.id);

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { items: true },
    });

    // Restore stock
    for (const item of updatedOrder.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    return res.json(updatedOrder);
  } catch (error) {
    console.error('Error cancelling order:', error);
    return res.status(500).json({ error: 'Failed to cancel order' });
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(400).json({ error: 'Invalid user session' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { userId: user.id } }),
    ]);

    res.json({
      orders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching my orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        skip,
        take: limit,
      }),
      prisma.order.count(),
    ]);

    res.json({
      orders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const status = req.body.status as string;

    if (!['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: { user: true },
    });

    // Send Shipping Email
    if (status === 'SHIPPED' && order.user?.email) {
      const bodyHTML = `
        <p>Hi ${order.user.name},</p>
        <p>Kabar gembira! Pesanan Anda (ID: ${order.id}) telah diserahkan ke kurir pengiriman dan sedang dalam perjalanan menuju Anda.</p>
        <p>Nomor Resi: <b>${order.trackingNumber || 'Akan Segera Diperbarui'}</b></p>
        <p>Anda bisa melacak pergerakan paket secara langsung melalui halaman profil Anda.</p>
      `;
      await sendNotificationEmail(
        order.user.email,
        'Paket Anda Sedang Dikirim! 🚀',
        'Pesanan Dikirim',
        bodyHTML,
        'Lacak Paket',
        `${process.env.FRONTEND_URL}/profile`
      );
    }

    // Send Delivery/Completed Email
    if (status === 'COMPLETED' && order.user?.email) {
      const bodyHTML = `
        <p>Hi ${order.user.name},</p>
        <p>Menurut catatan kami, paket Anda telah berhasil mendarat dengan selamat! 🎉</p>
        <p>Kami harap Anda menyukai koleksi Raja Brukat yang baru Anda terima. Kepuasan Anda adalah prioritas utama kami.</p>
        <p>Kami akan sangat menghargai jika Anda mau meluangkan waktu 1 menit untuk meninggalkan ulasan di profil Anda.</p>
      `;
      await sendNotificationEmail(
        order.user.email,
        'Paket Tiba! Terima Kasih dari Raja Brukat 👑',
        'Pesanan Selesai',
        bodyHTML,
        'Beri Ulasan Bintang',
        `${process.env.FRONTEND_URL}/profile`
      );
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};
