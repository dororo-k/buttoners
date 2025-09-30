import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Product } from '@/types/points';
import { db } from '@/lib/firebaseClient'; // Import Firestore instance
import { collection, getDocs } from 'firebase/firestore'; // Import Firestore functions

export interface ProductState {
  products: Product[];
  isLoading: boolean; // Add loading state
  fetchProducts: () => Promise<void>; // Add fetchProducts action
  addProduct: (productData: Omit<Product, 'id'>) => void;
  updateProduct: (productId: string, updatedData: Partial<Omit<Product, 'id'>>) => void;
  deleteProduct: (productId: string) => void;
}

const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({ // Add 'get' to access current state
      products: [], // Initialize as empty, will be fetched from Firestore
      isLoading: false, // Initial loading state
      fetchProducts: async () => {
        set({ isLoading: true });
        try {
          const productsCol = collection(db, 'products'); // Assuming 'products' collection
          const productSnapshot = await getDocs(productsCol);
          const productsList = productSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Product[];
          set({ products: productsList });
        } catch (error) {
          console.error("Failed to fetch products:", error);
          // Optionally, set an error state here
        } finally {
          set({ isLoading: false });
        }
      },
      addProduct: (productData) => set((state) => ({ products: [ ...state.products, { id: uuidv4(), ...productData }] })),
      updateProduct: (productId, updatedData) => set((state) => ({ products: state.products.map((p) => (p.id === productId ? { ...p, ...updatedData } : p)) })),
      deleteProduct: (productId) => set((state) => ({ products: state.products.filter((p) => p.id !== productId) })),
    }),
    { name: 'points-product-storage:v1', storage: createJSONStorage(() => localStorage) }
  )
);

export default useProductStore;

