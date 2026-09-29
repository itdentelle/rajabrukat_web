import { Request, Response } from 'express';
import { prisma } from '../config/database';
import {
  searchBiteshipAreas,
  calculateBiteshipCost,
  requestBiteshipPickup,
  trackBiteshipOrder,
} from '../services/biteship.service';
import { sendNotificationEmail } from '../services/email.service';

export const searchAreas = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const areas = await searchBiteshipAreas(String(q));
    res.json(areas);
  } catch (error: any) {
    console.error('Error searching destinations:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to search destinations' });
  }
};

export const calculateCost = async (req: Request, res: Response) => {
  try {
    const { destination, weight, courier } = req.body;

    if (!destination || !weight || !courier) {
      return res.status(400).json({ error: 'destination, weight, and courier are required' });
    }

    const rates = await calculateBiteshipCost(destination, parseInt(weight) || 500, courier);
    res.json(rates);
  } catch (error: any) {
    console.error('Error calculating cost:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to calculate cost' });
  }
};

export const requestPickup = async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id as string;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const pickupRes = await requestBiteshipPickup({
      orderId: order.id,
      customerName: order.customerName,
      phone: order.phone,
      address: order.address,
      totalAmount: order.totalAmount,
      shippingMethod: order.shippingMethod,
    });

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        biteshipOrderId: pickupRes.biteshipOrderId,
        trackingNumber: pickupRes.trackingNumber,
        status: 'SHIPPED',
      },
      include: { user: true },
    });

    if (updatedOrder.user?.email) {
      const bodyHTML = `
        <p>Hi ${updatedOrder.user.name},</p>
        <p>Kabar gembira! Pesanan Anda (ID: ${updatedOrder.id}) telah diserahkan ke kurir pengiriman dan sedang dalam perjalanan menuju Anda.</p>
        <p>Nomor Resi: <b>${updatedOrder.trackingNumber || 'Akan Segera Diperbarui'}</b></p>
        <p>Anda bisa melacak pergerakan paket secara langsung melalui halaman profil Anda.</p>
      `;
      await sendNotificationEmail(
        updatedOrder.user.email,
        'Paket Anda Sedang Dikirim! 🚀',
        'Pesanan Dikirim',
        bodyHTML,
        'Lacak Paket',
        `${process.env.FRONTEND_URL}/profile`
      );
    }

    res.json({ success: true, trackingNumber: updatedOrder.trackingNumber });
  } catch (error: any) {
    console.error('Error requesting pickup:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to request pickup', details: error?.response?.data });
  }
};

export const trackPackage = async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id as string;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!order.biteshipOrderId) return res.status(400).json({ error: 'Tracking not available yet' });

    const trackingData = await trackBiteshipOrder(order.biteshipOrderId);
    res.json({
      success: true,
      status: trackingData.status,
      history: trackingData.history,
    });
  } catch (error: any) {
    console.error('Error tracking package:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to track package', details: error?.response?.data });
  }
};
