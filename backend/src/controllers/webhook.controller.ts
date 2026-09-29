import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { verifyMidtransSignature } from '../services/midtrans.service';
import { sendNotificationEmail } from '../services/email.service';

export const handleMidtransWebhook = async (req: Request, res: Response) => {
  try {
    const notification = req.body;

    if (!notification || !notification.order_id) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = notification;

    // Optional signature verification check
    if (signature_key) {
      const isValid = verifyMidtransSignature(order_id, status_code, gross_amount, signature_key);
      if (!isValid) {
        console.error('[WEBHOOK] Invalid signature key for order', order_id);
        return res.status(403).json({ error: 'Invalid Signature Key' });
      }
    }

    let newStatus = 'PENDING';
    if (transaction_status === 'capture') {
      if (fraud_status === 'challenge') {
        newStatus = 'PENDING';
      } else if (fraud_status === 'accept') {
        newStatus = 'PROCESSING';
      }
    } else if (transaction_status === 'settlement') {
      newStatus = 'PROCESSING';
    } else if (
      transaction_status === 'cancel' ||
      transaction_status === 'deny' ||
      transaction_status === 'expire'
    ) {
      newStatus = 'CANCELLED';
    } else if (transaction_status === 'pending') {
      newStatus = 'PENDING';
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: order_id },
      include: { user: true, items: { include: { product: true } } },
    });

    if (!existingOrder) {
      console.log(`Order ${order_id} not found. Ignoring webhook (likely a test notification).`);
      return res.status(200).json({ success: true, message: 'Order not found, likely a test.' });
    }

    const previousStatus = existingOrder.status;

    await prisma.order.update({
      where: { id: order_id },
      data: { status: newStatus },
    });

    // If cancelled, restore stock
    if (newStatus === 'CANCELLED' && previousStatus !== 'CANCELLED') {
      for (const item of existingOrder.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    // Send Payment Success Email
    if (newStatus === 'PROCESSING' && previousStatus !== 'PROCESSING' && existingOrder.user?.email) {
      const itemsList = existingOrder.items
        .map((item: any) => `<li><b>${item.product.name}</b> (Qty: ${item.quantity})</li>`)
        .join('');

      const bodyHTML = `
        <p>Hi ${existingOrder.user.name},</p>
        <p>Hore! Pembayaran Anda sebesar <b>Rp ${existingOrder.totalAmount.toLocaleString(
          'id-ID'
        )}</b> telah kami terima dengan selamat.</p>
        <p>Pesanan Anda (ID: ${
          existingOrder.id
        }) saat ini sedang kami kemas dengan penuh cinta dan akan segera diserahkan ke kurir pengiriman.</p>
        <ul style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; list-style-type: none; margin: 20px 0;">
          ${itemsList}
        </ul>
        <p>Kami akan mengabari Anda lagi begitu paket Anda mulai bergerak ke arah Anda!</p>
      `;

      await sendNotificationEmail(
        existingOrder.user.email,
        'Pembayaran Berhasil! Pesanan Diproses 📦',
        'Pembayaran Diterima',
        bodyHTML,
        'Cek Status Pesanan',
        `${process.env.FRONTEND_URL}/profile`
      );
    }

    console.log(`[WEBHOOK] Order ${order_id} status updated to ${newStatus}`);
    res.status(200).json({ success: true, status: newStatus });
  } catch (error) {
    console.error('[WEBHOOK] Error processing Midtrans notification:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const handleLogisticsWebhook = async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    if (payload.event === 'order.status' || payload.event === 'order.waybill_id' || payload.status) {
      const biteshipOrderId = payload.order_id;
      const trackingStatus = payload.status;

      let newStatus: string | null = null;
      if (trackingStatus === 'picking_up' || trackingStatus === 'allocated') {
        newStatus = 'PROCESSING';
      } else if (trackingStatus === 'picked_up' || trackingStatus === 'dropping_off') {
        newStatus = 'SHIPPED';
      } else if (trackingStatus === 'delivered') {
        newStatus = 'COMPLETED';
      } else if (trackingStatus === 'cancelled' || trackingStatus === 'rejected') {
        newStatus = 'CANCELLED';
      }

      if (newStatus) {
        const existingOrder = await prisma.order.findFirst({
          where: { biteshipOrderId },
          include: { user: true },
        });

        if (existingOrder) {
          const previousStatus = existingOrder.status;

          await prisma.order.update({
            where: { id: existingOrder.id },
            data: { status: newStatus },
          });
          console.log(
            `Order ${existingOrder.id} status updated to ${newStatus} via logistics webhook.`
          );

          // Send Shipping Email
          if (newStatus === 'SHIPPED' && previousStatus !== 'SHIPPED' && existingOrder.user?.email) {
            const bodyHTML = `
              <p>Hi ${existingOrder.user.name},</p>
              <p>Kabar gembira! Pesanan Anda (ID: ${existingOrder.id}) telah diserahkan ke kurir pengiriman dan sedang dalam perjalanan menuju Anda.</p>
              <p>Nomor Resi: <b>${existingOrder.trackingNumber || 'Akan Segera Diperbarui'}</b></p>
              <p>Anda bisa melacak pergerakan paket secara langsung melalui halaman profil Anda.</p>
            `;
            await sendNotificationEmail(
              existingOrder.user.email,
              'Paket Anda Sedang Dikirim! 🚀',
              'Pesanan Dikirim',
              bodyHTML,
              'Lacak Paket',
              `${process.env.FRONTEND_URL}/profile`
            );
          }

          // Send Delivery/Completed Email
          if (
            newStatus === 'COMPLETED' &&
            previousStatus !== 'COMPLETED' &&
            existingOrder.user?.email
          ) {
            const bodyHTML = `
              <p>Hi ${existingOrder.user.name},</p>
              <p>Menurut catatan kurir, paket Anda telah berhasil mendarat dengan selamat! 🎉</p>
              <p>Kami harap Anda menyukai koleksi Raja Brukat yang baru Anda terima. Kepuasan Anda adalah prioritas utama kami.</p>
              <p>Kami akan sangat menghargai jika Anda mau meluangkan waktu 1 menit untuk meninggalkan ulasan di profil Anda.</p>
            `;
            await sendNotificationEmail(
              existingOrder.user.email,
              'Paket Tiba! Terima Kasih dari Raja Brukat 👑',
              'Pesanan Selesai',
              bodyHTML,
              'Beri Ulasan Bintang',
              `${process.env.FRONTEND_URL}/profile`
            );
          }
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing logistics webhook:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
