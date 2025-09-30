// src/features/points/components/ShoppingCart.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { useAppStore } from '@/components/providers/StoreProvider';
import useProductStore from '../store/useProductStore'; // Import product store
import type { CartItem, Product } from '../types';
import { addPurchaseTransaction } from '../services/pointTransactionsRepo';
import { Modal } from '@/components/Modal'; // Keep Modal for purchase confirmation
import { CheckCircle2 } from 'lucide-react';
import { auth } from '@/lib/firebaseClient'; // Import auth
import { notifications } from '@mantine/notifications';
import { usePurchaseAnimation } from '@/hooks/usePurchaseAnimation'; // Import custom hook

// 장바구니와 상품모델을 조인한 형태)
type JoinedCartItem = CartItem & { product: Product };

const QuantityStepper: React.FC<{ item: CartItem }> = ({ item }) => {
  const updateQuantity = useAppStore('pointStore', (state) => state.updateQuantity);
  return (
    <div className="flex items-center border border-border rounded-md">
      <button
        onClick={() => updateQuantity(item.productId, item.qty - 1)}
        aria-label="수량 감소"
        className="px-2 py-1 text-muted hover:bg-elev rounded-l-md"
      >
        -
      </button>
      <span className="px-3 text-center text-sm w-10 tabular-nums">{item.qty}</span>
      <button
        onClick={() => updateQuantity(item.productId, item.qty + 1)}
        aria-label="수량 증가"
        className="px-2 py-1 text-muted hover:bg-elev rounded-r-md"
      >
        +
      </button>
    </div>
  );
};

// ... existing code ...

const ShoppingCart: React.FC = () => {
  const cart = useAppStore('pointStore', (state) => state.cart);
  const removeFromCart = useAppStore('pointStore', (state) => state.removeFromCart);
  const purchase = useAppStore('pointStore', (state) => state.purchase);
  const clearCart = useAppStore('pointStore', (state) => state.clearCart);
  const replaceCartItem = useAppStore('pointStore', (state) => state.replaceCartItem);

  const products = useProductStore((state) => state.products); // Get products from the correct store
  const currentUser = useAppStore(
    'staffSession',
    (state) => state.currentUser
  );
  const updateUserPoints = useAppStore(
    'staffSession',
    (state) => state.updateUserPoints
  );

  const [isPurchasing, setIsPurchasing] = useState(false); // 로딩 상태 추가
  const { isSuccessModalOpen, triggerPurchaseAnimation } = usePurchaseAnimation();

  const isLoggedIn = !!currentUser; // Determine login status
  // currentUser에서 직접 포인트를 가져옵니다. 로그인하지 않았으면 0으로 처리합니다.
  const userPoints = currentUser?.points ?? 0;


  const productsById = useMemo(
    () => {
      const map = new Map<string, Omit<Product, 'options'>>();
      products.forEach((p) => {
        map.set(p.id, { id: p.id, name: p.name, price: p.price, category: p.category });
        if (p.options) {
          p.options.forEach((opt) => {
            map.set(opt.id, { ...opt, name: `${p.name} ${opt.name}`, category: p.category });
          });
        }
      });
      return map;
    },
    [products]
  );

  // null 제거를 확실히 하는 타입가드
  const cartDetails: JoinedCartItem[] = useMemo(() => {
    const joined = cart.map((ci) => {
      const product = productsById.get(ci.productId);
      return product ? ({ ...ci, product } as JoinedCartItem) : null;
    });
    return joined.filter((i): i is JoinedCartItem => i !== null);
  }, [cart, productsById]);

  const findBaseProduct = (productId: string): Product | undefined => {
    for (const p of products) {
      if (p.id === productId) {
        return p;
      }
      if (p.options?.some((opt) => opt.id === productId)) {
        return p;
      }
    }
    return undefined;
  };

  // ... existing code ...

  const netPointChange = useMemo(() => {
    return cart.reduce((total, item) => {
      const product = productsById.get(item.productId);
      const itemPrice = product?.price ?? 0;
      return total + itemPrice * item.qty;
    }, 0);
  }, [cart, productsById]);
  // netPointChange가 음수일 때만 차감될 포인트(비용)를 계산합니다.
  const cost = netPointChange; // calculateCartNetChange는 이제 항상 양수 비용을 반환합니다.
  const pointsNeeded = Math.max(0, cost - userPoints);
  const estimatedPointsAfterPurchase = userPoints - cost; // 차감으로 계산
  const canPurchase = pointsNeeded === 0 && cart.length > 0;

  // New variable to control button disabled state based on login and purchase capability
  const isPurchaseButtonDisabled = !canPurchase || !isLoggedIn || isPurchasing;

  const confirmPurchase = async () => {
    if (isPurchaseButtonDisabled) return;

    if (!auth.currentUser) {
      try { notifications.show({ color: 'red', message: '로그인이 필요합니다.' }); } catch {}
      return;
    }

    setIsPurchasing(true); // 로딩 시작

    // 낙관적 포인트 반영: 결제 직후 사용자에게 즉시 반영
    const prevPoints = currentUser?.points ?? 0;
    const optimisticPoints = prevPoints - cost;
    if (isLoggedIn) {
      updateUserPoints(optimisticPoints);
    }
    try {
      const idToken = await auth.currentUser.getIdToken();
      const result = await purchase(idToken);

      // 구매 성공! 이제 UI 변경을 순서대로 처리합니다.
      // 1. 즉시 성공 애니메이션을 트리거합니다.
      //    애니메이션이 끝난 후 실행될 콜백에 상태 업데이트 로직을 전달합니다.
      // 1-1. 구매 트랜잭션 기록(요약 텍스트)
      try {
        const itemsSummary = cartDetails.map(ci => `${ci.product.name}x${ci.qty}`).join(', ');
        if (currentUser?.uid) {
          void addPurchaseTransaction({
            uid: currentUser.uid,
            userName: currentUser.name,
            userNickname: currentUser.nickname,
            itemsSummary,
            amount: -cost,
          });
        }
      } catch {}

      triggerPurchaseAnimation(() => {
        // 2. 글로벌 포인트 상태 업데이트(최종 서버 값으로 확정)
        updateUserPoints(result.newPoints);
        // 3. 장바구니 비우기
        clearCart();
      });
    } catch (error: any) {
      console.error('구매 처리 중 오류 발생:', error);
      // 낙관적 업데이트 롤백
      if (isLoggedIn) {
        updateUserPoints(prevPoints);
      }
      const msg = `구매 실패: ${error?.message || '예상치 못한 오류가 발생했습니다.'}`;
      try { notifications.show({ color: 'red', message: msg }); } catch {}
    } finally {
      setIsPurchasing(false); // 로딩 종료
    }
  };



  if (cart.length === 0) {
    return (
      <div className="card text-center">
        <h2 className="text-xl font-bold mb-4 text-ink">장바구니</h2>
        <div className="py-10">
          <p className="text-muted mb-4 text-sm">장바구니가 비어 있습니다.</p>
          <p className="text-sm text-muted">상품을 담아주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-ink">장바구니</h2>
        <button onClick={clearCart} className="text-sm text-muted hover:text-red-400">
          전체 삭제
        </button>
      </div>

      <div className="flex-grow overflow-y-auto -mr-3 pr-3 space-y-3">
        {cartDetails.map((item, idx) => {
          const baseProduct = findBaseProduct(item.productId);
          const hasOptions = baseProduct && baseProduct.options && baseProduct.options.length > 0;

          return (
            <div key={item.productId} className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <div className="flex-grow">
                  <p className="font-medium text-ink text-sm">{item.product.name}</p>
                </div>
                {/* QuantityStepper는 CartItem을 받으므로 OK */}
                <QuantityStepper item={item} />
                <p className="w-20 text-right font-semibold tabular-nums text-sm">
                  {''}
                  {Math.abs(item.product.price * item.qty).toLocaleString()}P
                </p>
                <button onClick={() => removeFromCart(item.productId)} aria-label={`${item.product.name} 삭제`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted hover:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              {hasOptions && baseProduct && (
                <div className="flex items-center gap-3 pl-2">
                  {[
                    { id: baseProduct.id, name: '기본' },
                    ...baseProduct.options!,
                  ].map((opt) => (
                    <label key={opt.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input type="radio" name={`option-${baseProduct.id}-${idx}`} value={opt.id} checked={item.productId === opt.id} onChange={() => replaceCartItem(item.productId, opt.id)} className="radio radio-xs radio-primary" />
                      <span>{opt.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <div className="space-y-2 text-sm">
          {isLoggedIn && ( // Conditionally render if logged in
            <div className="flex justify-between">
              <span>보유 포인트</span>
              <span className="font-medium tabular-nums">{userPoints.toLocaleString()} P</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>{'차감'}</span>
            <span
              className={`font-semibold tabular-nums ${
                cost > 0 ? 'text-red-500' : 'text-ink'
              }`}
            >
              {cost > 0 ? '-' : ''}
              {cost.toLocaleString()} P
            </span>
          </div>
          {isLoggedIn && ( // Conditionally render if logged in
            <div className="flex justify-between border-t border-border pt-2">
              <span>결제 후 포인트</span>
              <span className={`font-bold text-base tabular-nums ${estimatedPointsAfterPurchase < 0 ? 'text-red-500' : ''}`}>
                {estimatedPointsAfterPurchase.toLocaleString()} P
              </span>
            </div>
          )}
        </div>
        <div className="mt-4 relative group">
          <button
            onClick={confirmPurchase}
            disabled={isPurchaseButtonDisabled} // Use the new disabled variable
            aria-disabled={isPurchaseButtonDisabled}
            aria-describedby={!isLoggedIn ? 'login-required-tooltip' : (!canPurchase ? 'points-needed-tooltip' : undefined)} // Conditional aria-describedby
            className="w-full px-4 py-3 bg-red-500 text-white rounded-lg font-bold text-base transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600 active:scale-[.99]"
          >
            {isPurchasing ? <span className="loading loading-spinner"></span> : '구매하기'}
          </button>
          {/* Hover tooltips + persistent hint on touch devices */}
          <div className="absolute bottom-full mb-2 w-full text-center">
            {!isLoggedIn && (
              <div id="login-required-tooltip" role="tooltip" className="hidden group-hover:block px-3 py-1.5 text-xs font-medium text-ink bg-elev rounded-lg shadow-sm">
                로그인이 필요합니다.
              </div>
            )}
            {!canPurchase && isLoggedIn && (
              <div role="tooltip" className="hidden group-hover:block px-3 py-1.5 text-xs font-medium text-ink bg-elev rounded-lg shadow-sm">
                포인트가 부족합니다.
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Success Modal */}
            <Modal open={isSuccessModalOpen} onClose={() => {}} showCloseButton={false}>
        <div className="flex flex-col items-center justify-center p-8">
          <CheckCircle2
            className="w-20 h-20 text-green-500 mb-4"
            strokeWidth={1.5}
          />
          <h2 className="text-2xl font-bold text-ink">구매가 완료되었습니다.</h2>
        </div>
      </Modal>
    </div>
  );
};

export default ShoppingCart;
