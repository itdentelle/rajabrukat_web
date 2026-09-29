import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access Denied: Admins Only' });
    }

    const [totalUsers, totalOrders, recentOrders, allOrders, allProducts] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.count(),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { product: true } },
        },
      }),
      prisma.order.findMany({
        select: { createdAt: true, totalAmount: true, status: true },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, stock: true },
      }),
    ]);

    // Calculate stock statistics
    const outOfStockCount = allProducts.filter((p) => p.stock <= 0).length;
    const lowStockCount = allProducts.filter((p) => p.stock > 0 && p.stock <= 10).length;
    const inStockCount = allProducts.filter((p) => p.stock > 10).length;
    const totalProducts = allProducts.length;

    // Calculate total revenue (only from COMPLETED orders)
    const totalRevenue = allOrders
      .filter((o: any) => o.status === 'COMPLETED')
      .reduce((sum: number, order: any) => sum + order.totalAmount, 0);

    // Group Order Status
    const statusCounts: Record<string, number> = {
      PENDING: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    allOrders.forEach((o: any) => {
      if (statusCounts[o.status] !== undefined) statusCounts[o.status]++;
      else statusCounts[o.status] = 1;
    });
    const orderStatusData = Object.keys(statusCounts).map((key) => ({
      name: key,
      count: statusCounts[key],
    }));

    // Group Revenue by Month (Last 6 Months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const revenueData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[d.getMonth()];
      const year = d.getFullYear();

      const monthOrders = allOrders.filter((o: any) => {
        const orderDate = new Date(o.createdAt);
        return (
          orderDate.getMonth() === d.getMonth() &&
          orderDate.getFullYear() === year &&
          o.status === 'COMPLETED'
        );
      });

      const monthRevenue = monthOrders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);
      revenueData.push({
        name: `${monthName} ${year}`,
        revenue: monthRevenue,
      });
    }

    res.json({
      totalUsers,
      totalOrders,
      totalRevenue,
      recentOrders,
      orderStatusData,
      revenueData,
      totalProducts,
      inStockCount,
      lowStockCount,
      outOfStockCount,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
