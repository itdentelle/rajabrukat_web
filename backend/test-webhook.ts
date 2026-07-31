import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function main() {
  const order = await prisma.order.findFirst({
    where: { status: 'SHIPPED' },
    orderBy: { createdAt: 'desc' }
  });

  if (!order) {
    console.log('Tidak ada pesanan dengan status SHIPPED.');
    return;
  }

  console.log('Menemukan pesanan SHIPPED:', order.id);
  console.log('Biteship Order ID:', order.biteshipOrderId);

  // Simulasi webhook Biteship bahwa paket Delivered (Selesai)
  const payload = {
    event: 'order.status',
    order_id: order.biteshipOrderId,
    status: 'delivered'
  };

  try {
    const res = await axios.post('http://localhost:5000/api/webhooks/logistics', payload);
    console.log('Webhook berhasil dikirim! Status response:', res.status);
    console.log('Pesanan sekarang harusnya berstatus Selesai (COMPLETED).');
  } catch (error: any) {
    console.error('Gagal mengirim webhook:', error.response?.data || error.message);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
