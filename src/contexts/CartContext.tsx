import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { cartAPI, vouchersAPI } from '../api.ts';
import { useToast } from './ToastContext.tsx';
import { getProductImage } from '../utils/productImage.ts';

export interface CartItem {
  productId: string;
  code: string;
  name: string;
  image: string;
  price: number;
  originalPrice: number;
  unit: string;
  stock: number;
  quantity: number;
}

export interface AppliedVoucher {
  code: string;
  name: string;
  discount: number;
  voucher: any;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  appliedVoucher: AppliedVoucher | null;
  addToCart: (product: any, quantity?: number) => boolean;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  applyVoucher: (code: string) => Promise<boolean>;
  removeVoucher: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_SESSION_KEY = 'stationery_cart_session_id';

function getCartSessionId(): string {
  try {
    let sessionId = localStorage.getItem(CART_SESSION_KEY);
    if (!sessionId) {
      sessionId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `cart_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
      localStorage.setItem(CART_SESSION_KEY, sessionId);
    }
    // Remove the old browser-stored cart payload; MongoDB now stores cart contents.
    localStorage.removeItem('stationery_cart_items');
    localStorage.removeItem('stationery_applied_voucher');
    return sessionId;
  } catch {
    return `cart_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [sessionId] = useState<string>(() => getCartSessionId());
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(null);
  const [cartLoaded, setCartLoaded] = useState(false);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  // Restore the guest cart from MongoDB; the browser stores only an opaque session ID.
  useEffect(() => {
    let active = true;
    cartAPI.getCart(sessionId)
      .then((response) => {
        if (!active) return;
        setItems(Array.isArray(response.data?.items) ? response.data.items : []);
        setAppliedVoucher(response.data?.appliedVoucher || null);
      })
      .catch((error) => {
        console.error('Không thể tải giỏ hàng từ MongoDB:', error);
      })
      .finally(() => {
        if (active) setCartLoaded(true);
      });
    return () => { active = false; };
  }, [sessionId]);

  // Serialize writes so rapid cart changes cannot arrive out of order.
  useEffect(() => {
    if (!cartLoaded) return;
    const snapshot = { items, appliedVoucher };
    saveQueue.current = saveQueue.current
      .catch(() => undefined)
      .then(() => cartAPI.saveCart(sessionId, snapshot).then(() => undefined))
      .catch((error) => console.error('Không thể đồng bộ giỏ hàng lên MongoDB:', error));
  }, [items, appliedVoucher, cartLoaded, sessionId]);

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const shippingFee = useMemo(() => {
    if (subtotal === 0 || subtotal >= 300000) return 0;
    return 20000;
  }, [subtotal]);

  const discount = useMemo(() => {
    if (!appliedVoucher || subtotal === 0) return 0;
    const v = appliedVoucher.voucher;
    if (v.minimumOrder && subtotal < v.minimumOrder) {
      return 0;
    }
    if (v.type === 'PERCENTAGE') {
      let val = Math.round((subtotal * v.value) / 100);
      if (v.maximumDiscount > 0 && val > v.maximumDiscount) {
        val = v.maximumDiscount;
      }
      return val;
    }
    return Math.min(v.value, subtotal);
  }, [appliedVoucher, subtotal]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discount + shippingFee);
  }, [subtotal, discount, shippingFee]);

  const addToCart = (product: any, quantity: number = 1): boolean => {
    if (product.stock <= 0) {
      showToast(`Sản phẩm "${product.name}" hiện đang tạm hết hàng`, 'warning');
      return false;
    }

    let success = true;
    setItems(prevItems => {
      const existingIdx = prevItems.findIndex(i => i.productId === product.id);
      if (existingIdx > -1) {
        const currentQty = prevItems[existingIdx].quantity;
        const newQty = currentQty + quantity;
        if (newQty > product.stock) {
          showToast(
            `Kho chỉ còn ${product.stock} ${product.unit}. Bạn đã có ${currentQty} trong giỏ hàng.`,
            'warning'
          );
          success = false;
          return prevItems;
        }
        const updated = [...prevItems];
        updated[existingIdx].quantity = newQty;
        showToast(`Đã cập nhật số lượng: ${updated[existingIdx].name} (${newQty})`, 'success');
        return updated;
      } else {
        if (quantity > product.stock) {
          showToast(`Kho chỉ còn ${product.stock} ${product.unit}`, 'warning');
          success = false;
          return prevItems;
        }
        const newItem: CartItem = {
          productId: product.id,
          code: product.code,
          name: product.name,
          image: getProductImage(product),
          price: product.salePrice || product.price,
          originalPrice: product.price,
          unit: product.unit || 'Cái',
          stock: product.stock,
          quantity,
        };
        showToast(`Đã thêm "${newItem.name}" vào giỏ hàng`, 'success');
        return [...prevItems, newItem];
      }
    });

    return success;
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.productId === productId) {
          if (quantity > item.stock) {
            showToast(`Sản phẩm chỉ còn ${item.stock} ${item.unit} trong kho`, 'warning');
            return { ...item, quantity: item.stock };
          }
          return { ...item, quantity };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prevItems => {
      const item = prevItems.find(i => i.productId === productId);
      if (item) {
        showToast(`Đã xóa "${item.name}" khỏi giỏ hàng`, 'info');
      }
      return prevItems.filter(i => i.productId !== productId);
    });
  };

  const clearCart = () => {
    setItems([]);
    setAppliedVoucher(null);
  };

  const applyVoucher = async (code: string): Promise<boolean> => {
    if (!code || !code.trim()) {
      showToast('Vui lòng nhập mã giảm giá', 'warning');
      return false;
    }

    try {
      const res = await vouchersAPI.validateVoucher(code, subtotal);
      if (res.success && res.data) {
        setAppliedVoucher(res.data);
        showToast(`Áp dụng mã ${res.data.code} thành công: -${res.data.discount.toLocaleString('vi-VN')}đ`, 'success');
        return true;
      }
      return false;
    } catch (err: any) {
      showToast(err.message || 'Mã giảm giá không hợp lệ hoặc không đủ điều kiện', 'error');
      return false;
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    showToast('Đã gỡ bỏ mã giảm giá', 'info');
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        discount,
        shippingFee,
        total,
        appliedVoucher,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyVoucher,
        removeVoucher,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
