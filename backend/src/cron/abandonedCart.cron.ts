import cron from 'node-cron';
import { prisma } from '../config/database';
import { sendNotificationEmail } from '../services/email.service';

export const initCronJobs = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const abandonedCarts = await prisma.cart.findMany({
        where: {
          updatedAt: { lt: twentyFourHoursAgo },
          abandonedEmailSent: false,
          items: { some: {} }, // Ensure cart is not empty
        },
        include: {
          user: true,
          items: { include: { product: true } },
        },
      });

      for (const cart of abandonedCarts) {
        if (!cart.user.email) continue;

        const itemsList = cart.items
          .map(
            (item: any) =>
              `<li><b>${item.product.name}</b> (Qty: ${item.quantity}) - Rp ${item.product.price.toLocaleString(
                'id-ID'
              )}</li>`
          )
          .join('');

        const bodyHTML = `
          <p>Hi ${cart.user.name},</p>
          <p>Sepertinya ada beberapa barang luar biasa yang tertinggal di keranjang Anda! Jangan sampai kehabisan, stok sangat terbatas.</p>
          <ul style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; list-style-type: none; margin: 20px 0;">
            ${itemsList}
          </ul>
          <p>Selesaikan pesanan Anda sekarang dan dapatkan kain pilihan terbaik Anda sebelum kehabisan.</p>
        `;

        await sendNotificationEmail(
          cart.user.email,
          'Menunggu di Keranjang Anda... 👀',
          'Keranjang Anda Tertinggal',
          bodyHTML,
          'Lanjutkan Checkout',
          `${process.env.FRONTEND_URL}/cart`
        );

        // Mark as sent to prevent spamming
        await prisma.cart.update({
          where: { id: cart.id },
          data: { abandonedEmailSent: true },
        });
      }
    } catch (error) {
      console.error('Cron Job Error [Abandoned Cart]:', error);
    }
  });

  console.log('Abandoned Cart cron job scheduled (hourly) ⏰');
};
