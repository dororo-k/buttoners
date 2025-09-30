import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import type { Product } from '../types';

interface ProductState {
  products: Product[];
  isLoading: boolean;
  fetchProducts: () => Promise<void>;
  addProduct: (productData: Omit<Product, 'id'>) => void;
  updateProduct: (productId: string, updatedData: Partial<Omit<Product, 'id'>>) => void;
  deleteProduct: (productId: string) => void;
}

const useProductStore = create(
  immer<ProductState>((set) => ({
  products: [],
  isLoading: true,
  fetchProducts: async () => {
    set({ isLoading: true });
    try {
      const productsCol = collection(db, 'products');
      const productSnapshot = await getDocs(productsCol);
      const productList = productSnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Product[];
      set({ products: productList, isLoading: false });
    } catch (error) {
      console.error('Error fetching products:', error);
      set({ isLoading: false });
    }
  },
  addProduct: async (productData) => {
    try {
      const productsCol = collection(db, 'products');
      const docRef = await addDoc(productsCol, productData);
      const newProduct = { id: docRef.id, ...productData };
      set((state) => { state.products.push(newProduct); });
    } catch (error) {
      console.error('Error adding product:', error);
    }
  },
  updateProduct: async (productId, updatedData) => {
    try {
      const productDoc = doc(db, 'products', productId);
      await updateDoc(productDoc, updatedData);
      set((state) => {
        const productIndex = state.products.findIndex((p) => p.id === productId);
        if (productIndex !== -1) {
          state.products[productIndex] = { ...state.products[productIndex], ...updatedData };
        }
      });
    } catch (error) {
      console.error('Error updating product:', error);
    }
  },
  deleteProduct: async (productId) => {
    try {
      const productDoc = doc(db, 'products', productId);
      await deleteDoc(productDoc);
      set((state) => {
        state.products = state.products.filter((p) => p.id !== productId);
      });
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  },
})),
);

export default useProductStore;
