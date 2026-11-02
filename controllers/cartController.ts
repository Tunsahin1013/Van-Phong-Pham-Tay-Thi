import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { dataStore } from '../services/dataStore.ts';

let cartIndexPromise: Promise<string> | null = null;

function cartCollection() {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    throw new Error('MongoDB Atlas chưa kết nối.');
  }
  const collection = mongoose.connection.db.collection('cart_sessions');
  if (!cartIndexPromise) {
    cartIndexPromise = collection.createIndex({ sessionId: 1 }, { unique: true })
      .catch((error) => {
        cartIndexPromise = null;
        throw error;
      });
  }
  return collection;
}

async function ensureCartIndex() {
  await cartIndexPromise;
}

function validSessionId(value: string): boolean {
  return /^[a-zA-Z0-9_-]{12,100}$/.test(value);
}

export const cartController = {
  // GET /api/cart/:sessionId
  getCart: async (req: Request, res: Response) => {
    const sessionId = String(req.params.sessionId || '');
    if (!validSessionId(sessionId)) {
      return res.status(400).json({ success: false, message: 'Mã phiên giỏ hàng không hợp lệ.' });
    }
    try {
      const collection = cartCollection();
      await ensureCartIndex();
      const saved = await collection.findOne({ sessionId }, { projection: { _id: 0 } });
      return res.json({
        success: true,
        data: {
          items: Array.isArray(saved?.items) ? saved.items : [],
          appliedVoucher: saved?.appliedVoucher || null,
        },
      });
    } catch (error) {
      console.error('Không thể đọc giỏ hàng từ MongoDB:', error);
      return res.status(503).json({ success: false, message: 'Không thể tải giỏ hàng từ MongoDB Atlas.' });
    }
  },

  // PUT /api/cart/:sessionId
  saveCart: async (req: Request, res: Response) => {
    const sessionId = String(req.params.sessionId || '');
    if (!validSessionId(sessionId)) {
      return res.status(400).json({ success: false, message: 'Mã phiên giỏ hàng không hợp lệ.' });
    }
    if (!Array.isArray(req.body.items) || req.body.items.length > 100) {
      return res.status(400).json({ success: false, message: 'Danh sách giỏ hàng không hợp lệ.' });
    }

    try {
      const items = [];
      for (const item of req.body.items) {
        const productId = String(item?.productId || '');
        const quantity = Number(item?.quantity);
        if (!productId || !Number.isInteger(quantity) || quantity < 1) continue;
        const product = dataStore.getProductById(productId);
        if (!product || product.status !== 'ACTIVE' || product.stock < 1) continue;
        const safeQuantity = Math.min(quantity, product.stock);
        items.push({
          productId: product.id,
          code: product.code,
          name: product.name,
          image: product.image,
          price: product.salePrice || product.price,
          originalPrice: product.price,
          unit: product.unit || 'Cái',
          stock: product.stock,
          quantity: safeQuantity,
        });
      }

      const requestedVoucherCode = typeof req.body.appliedVoucher?.code === 'string'
        ? req.body.appliedVoucher.code.trim().toUpperCase()
        : '';
      const voucher = requestedVoucherCode ? dataStore.getVoucherByCode(requestedVoucherCode) : undefined;
      const appliedVoucher = voucher && voucher.status === 'ACTIVE'
        ? {
            code: voucher.code,
            name: voucher.name,
            discount: Math.max(0, Number(req.body.appliedVoucher?.discount) || 0),
            voucher,
          }
        : null;
      const collection = cartCollection();
      await ensureCartIndex();
      await collection.updateOne(
        { sessionId },
        {
          $set: { items, appliedVoucher, updatedAt: new Date() },
          $setOnInsert: { sessionId, createdAt: new Date() },
        },
        { upsert: true },
      );

      return res.json({ success: true, message: 'Đã đồng bộ giỏ hàng lên MongoDB.', data: { items, appliedVoucher } });
    } catch (error) {
      console.error('Không thể lưu giỏ hàng vào MongoDB:', error);
      return res.status(503).json({ success: false, message: 'Không thể lưu giỏ hàng vào MongoDB Atlas.' });
    }
  },

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
        errors.push('Sản phẩm không còn tồn tại trên hệ thống');
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
      data: { items: validatedItems, subtotal, shippingFee, total: subtotal + shippingFee, errors },
    });
  },
};
