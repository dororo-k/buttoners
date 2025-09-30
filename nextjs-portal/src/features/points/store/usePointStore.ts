import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { db } from '@/lib/firebaseClient';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { notifications } from '@mantine/notifications';
import type { PointState, PointActions, PointItem as CartItem, PointProduct } from '@/types/points';

// This is now the single source of truth for the point store.
// It is created by the StoreProvider and conforms to the shared types.

interface PointStoreState extends PointState {
  userFavorites: Set<string>;
}

interface PointStoreActions extends PointActions {
  setUserFavorites: (favorites: Set<string>) => void;
  fetchUserFavorites: (userId: string) => Promise<void>;
  addFavorite: (userId: string, productId: string) => Promise<void>;
  removeFavorite: (userId: string, productId: string) => Promise<void>;
  toggleFavorite: (userId: string, productId: string) => Promise<void>; // Modified to be async
}

export const createPointStore = (initialState: Partial<PointStoreState & PointStoreActions> = {}) =>
  create(immer<PointStoreState & PointStoreActions>((set, get) => ({
    // Initial state from types
    products: [],
    categories: [],
    cart: [],
    userPoints: 0,
    activeCategory: 'all',
    userFavorites: new Set<string>(), // Initialize userFavorites as a Set
    userFavoritesLoading: false,
    ...initialState,

    // Actions
    setProducts: (products) => set(state => { state.products = products; }),
    setCategories: (categories) => set(state => { state.categories = categories; }),
    setUserPoints: (points) => set(state => { state.userPoints = points; }),
    setActiveCategory: (category) => set(state => { state.activeCategory = category; }),
    setUserFavorites: (favorites) => set(state => { state.userFavorites = new Set(favorites); state.userFavoritesLoading = false; }),

    fetchUserFavorites: async (userId: string) => {
      try {
        set(state => { state.userFavoritesLoading = true; });
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const favoritesArray = userData?.favorites || [];
          set(state => { state.userFavorites = new Set(favoritesArray); state.userFavoritesLoading = false; });
        } else {
          // If user document doesn't exist, create it with empty favorites
          await setDoc(userDocRef, { favorites: [] }, { merge: true });
          set(state => { state.userFavorites = new Set(); state.userFavoritesLoading = false; });
        }
      } catch (error) {
        console.error('Error fetching user favorites:', error);
        set(state => { state.userFavoritesLoading = false; });
      }
    },

    addFavorite: async (userId: string, productId: string) => {
      // Optimistic add
      let rolledBack = false;
      set(state => {
        const next = new Set(state.userFavorites);
        next.add(productId);
        state.userFavorites = next;
      });
      try {
        const userDocRef = doc(db, 'users', userId);
        // Ensure user doc exists (merge)
        await setDoc(userDocRef, { favorites: [] }, { merge: true });
        await updateDoc(userDocRef, { favorites: arrayUnion(productId) });
      } catch (error) {
        // Rollback
        rolledBack = true;
        set(state => {
          const next = new Set(state.userFavorites);
          next.delete(productId);
          state.userFavorites = next;
        });
        console.error('Error adding favorite:', error);
        try { notifications.show({ color: 'red', message: '즐겨찾기 추가에 실패했습니다. 잠시 후 다시 시도해주세요.' }); } catch {}
      } finally {
        if (!rolledBack) {
          try { notifications.show({ color: 'green', message: '즐겨찾기에 추가되었습니다.' }); } catch {}
        }
      }
    },

    removeFavorite: async (userId: string, productId: string) => {
      // Optimistic remove
      let rolledBack = false;
      set(state => {
        const next = new Set(state.userFavorites);
        next.delete(productId);
        state.userFavorites = next;
      });
      try {
        const userDocRef = doc(db, 'users', userId);
        await setDoc(userDocRef, { favorites: [] }, { merge: true });
        await updateDoc(userDocRef, { favorites: arrayRemove(productId) });
      } catch (error) {
        // Rollback
        rolledBack = true;
        set(state => {
          const next = new Set(state.userFavorites);
          next.add(productId);
          state.userFavorites = next;
        });
        console.error('Error removing favorite:', error);
        try { notifications.show({ color: 'red', message: '즐겨찾기 해제에 실패했습니다. 잠시 후 다시 시도해주세요.' }); } catch {}
      } finally {
        if (!rolledBack) {
          try { notifications.show({ color: 'gray', message: '즐겨찾기에서 제거되었습니다.' }); } catch {}
        }
      }
    },

    toggleFavorite: async (userId: string, productId: string) => {
      const { userFavorites } = get();
      if (userFavorites.has(productId)) {
        await get().removeFavorite(userId, productId);
      } else {
        await get().addFavorite(userId, productId);
      }
    },

    addToCart: (product) => {
      const { cart } = get();
      const existingItem = cart.find((item) => item.productId === product.id);
      if (existingItem) {
        get().updateQuantity(product.id, existingItem.qty + 1);
      } else {
        set(state => { state.cart.push({ productId: product.id, qty: 1 }); });
      }
    },

    removeFromCart: (productId) =>
      set(state => {
        state.cart = state.cart.filter((item) => item.productId !== productId);
      }),

    updateQuantity: (productId, newQty) => {
      if (newQty <= 0) {
        get().removeFromCart(productId);
      } else {
        set(state => {
          const item = state.cart.find((i) => i.productId === productId);
          if (item) item.qty = newQty;
        });
      }
    },

    replaceCartItem: (oldProductId, newProductId) => {
        set((state) => {
          const cartItem = state.cart.find((item) => item.productId === oldProductId);
          if (!cartItem) return state;

          const itemIndex = state.cart.findIndex(item => item.productId === oldProductId);
          if (itemIndex > -1) {
            state.cart[itemIndex].productId = newProductId;
          }
        });
      },

    clearCart: () => set(state => { state.cart = []; }),

    purchase: async (idToken: string) => {
      const { cart } = get();
      if (cart.length === 0) {
        throw new Error('장바구니가 비어있습니다.');
      }

      const CLOUD_FUNCTION_URL = process.env.NEXT_PUBLIC_FIREBASE_PROCESS_PURCHASE_URL || 'https://us-central1-buttoners-ad811.cloudfunctions.net/processPurchase';

      try {
        const idem = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`;
        let response = await fetch(CLOUD_FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
            'X-Idempotency-Key': idem,
          },
          body: JSON.stringify({ cart }),
        });
        // 401/403 처리: 토큰 재발급 후 1회 재시도
        if (response.status === 401 || response.status === 403) {
          try {
            const { auth } = await import('@/lib/firebaseClient');
            const fresh = await auth.currentUser?.getIdToken(true);
            if (fresh) {
              response = await fetch(CLOUD_FUNCTION_URL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${fresh}`,
                  'X-Idempotency-Key': idem,
                },
                body: JSON.stringify({ cart }),
              });
            }
          } catch {}
        }

        const result = await response.json();

        if (response.ok && result.success) {
          return result;
        } else {
          throw new Error(result.message || '알 수 없는 오류가 발생했습니다.');
        }
      } catch (error) {
        console.error('Error during purchase:', error);
        throw error;
      }
    },
  })));
