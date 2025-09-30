// src/features/points/hooks/useCart.ts
import { useState, useCallback, useMemo } from 'react';
import type { Product, CartItem } from '../types';

/**
 * 장바구니
 * - cart는 CartItem[] = { productId, qty }만 저장 (상품 정보는 저장하지 않음)
 * - totalPoints 계산이 필요하면 products를 인수로 전달받아 가격을 join
 */
export default function useCart(products?: Product[]) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // 참고: product 객체로 추가하는 함수 (선택 사용)
  const addProduct = useCallback((product: Product) => {
    addToCart(product.id, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addToCart = useCallback((productId: string, qty: number = 1) => {
    setCart((currentCart) => {
      const existing = currentCart.find((it) => it.productId === productId);
      if (existing) {
        return currentCart.map((it) =>
          it.productId === productId ? { ...it, qty: it.qty + qty } : it
        );
      }
      return [...currentCart, { productId, qty: Math.max(1, qty) }];
    });
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    setCart((currentCart) => {
      if (qty <= 0) return currentCart.filter((it) => it.productId !== productId);
      return currentCart.map((it) =>
        it.productId === productId ? { ...it, qty } : it
      );
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((currentCart) => currentCart.filter((it) => it.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  // 가격 합계 계산: products가 주어지면 join해서 계산, 없으면 0
  const totalPoints = useMemo(() => {
    if (!products?.length) return 0;
    const byId = Object.fromEntries(products.map((p) => [p.id, p] as const));
    return cart.reduce((sum, it) => {
      const p = byId[it.productId];
      return sum + (p ? p.price * it.qty : 0);
    }, 0);
  }, [cart, products]);

  return {
    cart,
    addToCart,
    addProduct, // (선택) Product로 추가하는 함수 사용
    updateQty,
    removeFromCart,
    clearCart,
    totalPoints,
  };
}
