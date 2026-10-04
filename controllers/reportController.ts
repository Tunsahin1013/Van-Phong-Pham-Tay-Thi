import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import { dataStore } from '../services/dataStore.ts';

export const reportController = {
  // GET /api/reports/dashboard
  getDashboard: (_req: AuthRequest, res: Response) => {
    const data = dataStore.getReports();
    return res.json({ success: true, data });
  },

  // GET /api/reports/revenue
  getRevenue: (_req: AuthRequest, res: Response) => {
    const reports = dataStore.getReports();
    return res.json({
      success: true,
      data: {
        totalRevenue: reports.summary.totalRevenue,
        monthlyRevenue: reports.monthlyRevenue,
      },
    });
  },

  // GET /api/reports/orders
  getOrders: (_req: AuthRequest, res: Response) => {
    const reports = dataStore.getReports();
    return res.json({
      success: true,
      data: {
        totalOrders: reports.summary.totalOrders,
        completed: reports.summary.completedOrdersCount,
        cancelled: reports.summary.cancelledOrdersCount,
        pending: reports.summary.pendingOrdersCount,
        breakdown: reports.orderStatusBreakdown,
      },
    });
  },

  // GET /api/reports/products
  getProducts: (_req: AuthRequest, res: Response) => {
    const reports = dataStore.getReports();
    return res.json({
      success: true,
      data: {
        bestSelling: reports.bestSellingProducts,
        lowStock: reports.lowStockProducts,
        categoryStats: reports.categoryStats,
      },
    });
  },
};
