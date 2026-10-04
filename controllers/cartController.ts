import { Request, Response } from 'express';
import { dataStore } from '../services/dataStore.ts';

export const cartController = {
  // POST /api/cart/validate
  validateCart: (req: Request, res: Response) => {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Danh sách sản phẩm không hợp lệ' });
    }

    const validatedItems = [];
    let subtotal = 0;
    const errors: string[] = [];

    for (const item of items) {
      const prod = dataStore.getProductById(item.productId);
      if (!prod) {
        errors.push(`Sản phẩm không còn tồn tại trên hệ thống`);
        continue;
      }

      if (prod.status !== 'ACTIVE') {
        errors.push(`Sản phẩm "${prod.name}" hiện đã ngừng kinh doanh`);
        continue;
      }

      const availableQty = Math.min(item.quantity, prod.stock);
      if (prod.stock === 0) {
        errors.push(`Sản phẩm "${prod.name}" hiện đã hết hàng`);
      } else if (item.quantity > prod.stock) {
        errors.push(`Sản phẩm "${prod.name}" chỉ còn ${prod.stock} ${prod.unit} trong kho`);
      }

      const price = prod.salePrice || prod.price;
      subtotal += price * (availableQty > 0 ? availableQty : 0);

      validatedItems.push({
        productId: prod.id,
        code: prod.code,
        name: prod.name,
        image: prod.image,
        brand: prod.brand,
        price,
        originalPrice: prod.price,
        stock: prod.stock,
        unit: prod.unit,
        quantity: availableQty,
        requestedQuantity: item.quantity,
        isOutOfStock: prod.stock === 0,
      });
    }

    const shippingFee = subtotal >= 300000 || subtotal === 0 ? 0 : 20000;

    return res.json({
      success: true,
      data: {
        items: validatedItems,
        subtotal,
        shippingFee,
        total: subtotal + shippingFee,
        errors,
      },
    });
  },
};
