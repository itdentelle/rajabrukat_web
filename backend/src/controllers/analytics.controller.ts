import { Request, Response } from 'express';
import { prisma } from '../config/database';

export async function ensureVisitorLogTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "VisitorLog" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "ip" TEXT,
        "path" TEXT NOT NULL,
        "userAgent" TEXT,
        "device" TEXT DEFAULT 'Desktop',
        "city" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "VisitorLog_createdAt_idx" ON "VisitorLog"("createdAt");
      CREATE INDEX IF NOT EXISTS "VisitorLog_path_idx" ON "VisitorLog"("path");
    `);
  } catch (err) {
    console.warn('Notice: ensureVisitorLogTable warning:', err);
  }
}

export const logVisitor = async (req: Request, res: Response) => {
  try {
    await ensureVisitorLogTable();
    const { path, userAgent } = req.body || {};
    if (!path || typeof path !== 'string' || path.startsWith('/admin') || path.startsWith('/api')) {
      return res.status(200).json({ success: true, ignored: true });
    }

    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const ip = Array.isArray(rawIp) ? rawIp[0] : (rawIp as string).split(',')[0].trim();
    const ua = userAgent || req.headers['user-agent'] || '';

    let device = 'Desktop';
    if (/mobile/i.test(ua)) device = 'Mobile';
    else if (/tablet|ipad/i.test(ua)) device = 'Tablet';

    if ((prisma as any).visitorLog) {
      await (prisma as any).visitorLog.create({
        data: {
          path,
          ip,
          userAgent: ua,
          device,
        },
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Analytics log error:', err);
    res.status(200).json({ success: false });
  }
};

export const getVisitorStats = async (req: Request, res: Response) => {
  try {
    await ensureVisitorLogTable();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const vLog = (prisma as any).visitorLog;
    if (!vLog) {
      return res.json({
        todayCount: 0,
        monthCount: 0,
        totalCount: 0,
        topPages: [],
        devices: [],
        dailyChart: [],
      });
    }

    const [todayCount, monthCount, totalCount, topPagesGroup, deviceGroup] = await Promise.all([
      vLog.count({ where: { createdAt: { gte: startOfToday } } }),
      vLog.count({ where: { createdAt: { gte: startOfMonth } } }),
      vLog.count(),
      vLog.groupBy({
        by: ['path'],
        _count: { path: true },
        orderBy: { _count: { path: 'desc' } },
        take: 6,
      }),
      vLog.groupBy({
        by: ['device'],
        _count: { device: true },
      }),
    ]);

    const dailyChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const count = await vLog.count({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });

      const dayLabel = dayStart.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      dailyChart.push({ date: dayLabel, visits: count });
    }

    res.json({
      todayCount,
      monthCount,
      totalCount,
      topPages: (topPagesGroup as any[]).map((item: any) => ({
        path: item.path,
        count: item._count.path,
      })),
      devices: (deviceGroup as any[]).map((item: any) => ({
        device: item.device || 'Desktop',
        count: item._count.device,
      })),
      dailyChart,
    });
  } catch (err) {
    console.error('Analytics stats error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics stats' });
  }
};
