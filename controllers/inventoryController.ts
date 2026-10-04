import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import { dataStore } from '../services/dataStore.ts';

export const inventoryController = {
  // GET /api/inventory/logs
  getLogs: (_req: AuthRequest, res: Response) => {
    const logs = dataStore.getInventoryLogs();
    return res.json({ success: true, data: logs });
  },

  // POST /api/inventory/in (Stock In / Import)
  stockIn: (req: AuthRequest, res: Response) => {
    try {
      const { productId, quantity, supplierId, note } = req.body;

      if (!productId || !quantity || Number(quantity) <= 0) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn sản phẩm và nhập số lượng nhập hợp lệ' });
      }

      const creator = req.user ? req.user.name : 'Nhân viên';
      const updatedProduct = dataStore.recordStockIn(productId, Number(quantity), supplierId, note, creator);

      if (!updatedProduct) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
      }

      return res.json({
        success: true,
        message: `Đã nhập thêm ${quantity} ${updatedProduct.unit} cho sản phẩm ${updatedProduct.name}`,
        data: updatedProduct,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Lỗi nhập kho: ' + (error as Error).message });
    }
  },

  // POST /api/inventory/adjust (Adjust stock)
  stockAdjust: (req: AuthRequest, res: Response) => {
    try {
      const { productId, adjustmentQty, note } = req.body;

      if (!productId || adjustmentQty === undefined) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp sản phẩm và số lượng điều chỉnh' });
      }

      const creator = req.user ? req.user.name : 'Quản lý kho';
      const updatedProduct = dataStore.recordStockAdjustment(productId, Number(adjustmentQty), note, creator);

      if (!updatedProduct) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
      }

      return res.json({
        success: true,
        message: `Đã điều chỉnh tồn kho thành ${updatedProduct.stock} ${updatedProduct.unit}`,
        data: updatedProduct,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Lỗi điều chỉnh tồn kho: ' + (error as Error).message });
    }
  },

  // GET /api/inventory/low-stock
  getLowStock: (_req: AuthRequest, res: Response) => {
    const list = dataStore.getProducts().filter(p => p.stock < 50);
    return res.json({ success: true, data: list });
  },
};
