export interface PointProduct {
  id: string;
  name: string;
  category: string;
  price: number;
}

export interface PointCategory {
  id: string;
  name: string;
}

export interface PointItem {
  productId: string;
  qty: number;
}

export interface PointState {
  products: PointProduct[];
  categories: PointCategory[];
  cart: PointItem[];
  userPoints: number;
  activeCategory: string;
  userFavorites: Set<string>;
  userFavoritesLoading?: boolean;
}

export type MenuItem = PointProduct;
export type Product = PointProduct;

export interface PointActions {
  setProducts: (products: PointProduct[]) => void;
  setCategories: (categories: PointCategory[]) => void;
  setUserPoints: (points: number) => void;
  setActiveCategory: (category: string) => void;
  setUserFavorites: (favorites: Set<string>) => void;
  fetchUserFavorites: (userId: string) => Promise<void>;
  addFavorite: (userId: string, productId: string) => Promise<void>;
  removeFavorite: (userId: string, productId: string) => Promise<void>;
  toggleFavorite: (userId: string, productId: string) => Promise<void>;
  addToCart: (product: PointProduct) => void;
  updateQuantity: (productId: string, newQty: number) => void;
  removeFromCart: (productId: string) => void;
  replaceCartItem: (oldProductId: string, newProductId: string) => void;
  clearCart: () => void;
  purchase: (idToken: string) => Promise<{ newPoints: number; [key: string]: any; }>;
}
