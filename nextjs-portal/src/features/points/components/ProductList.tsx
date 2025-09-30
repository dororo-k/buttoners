// src/features/points/components/ProductList.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/components/providers/StoreProvider';
import useProductStore from '../store/useProductStore'; // 상품 관리 스토어 import
import type { Account } from '../../../types';
import { Star, PlusCircle, Edit, Trash2 } from 'lucide-react';
import HierarchicalCategorySelector from './HierarchicalCategorySelector';
import type { Product } from '../types';
import { CATEGORY_HIERARCHY, MOCK_PRODUCTS } from '../data'; // Import CATEGORY_HIERARCHY
import ProductForm from './ProductForm'; // 상품 추가/수정 폼 import
import { useToggle } from '@/hooks/useToggle';
import { Modal } from '@/components/Modal';
import { notifications } from '@mantine/notifications';

const ProductListItem: React.FC<{
  product: Product;
  isAdmin: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}> = ({ product, isAdmin, onEdit, onDelete }) => {
  const addToCart = useAppStore('pointStore', (state) => state.addToCart);
  const toggleFavorite = useAppStore('pointStore', (state) => state.toggleFavorite);
  const cart = useAppStore('pointStore', (state) => state.cart);
  const userFavorites = useAppStore('pointStore', (state) => state.userFavorites);
  const currentUser = useAppStore('staffSession', (state) => state.currentUser);
  const favoritesLoading = useAppStore('pointStore', (state) => state.userFavoritesLoading);

  const isFav = userFavorites.has(product.id);
  const isLoggedIn = !!currentUser?.uid;

  const isInCart = useMemo(() => {
    // Create a set of all product IDs in the cart for efficient lookup.
    const cartProductIds = new Set(cart.map((item) => item.productId));

    // Check if the main product ID is in the cart.
    if (cartProductIds.has(product.id)) {
      return true;
    }

    // If the product has options, check if any option ID is in the cart.
    return product.options?.some((option) => cartProductIds.has(option.id)) ?? false;
  }, [cart, product.id, product.options]);

  const handleRowClick = () => {
    // 제안 3: 기본 상품은 바로 장바구니에 추가
    addToCart(product);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      addToCart(product);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentUser?.uid) {
      toggleFavorite(currentUser.uid, product.id);
    } else {
      try { notifications.show({ color: 'red', message: '로그인이 필요합니다.' }); } catch {}
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(product);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(product);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      aria-label={`${product.name} 담기`}
      className="group flex items-center justify-between px-3 py-3 hover:bg-elev cursor-pointer rounded-md"
    >
      <div className="flex items-center gap-1.5">
        <span className={`text-ink font-medium ${isInCart ? 'font-bold' : ''}`}>{product.name}</span>
        {product.options && (
          <span className="text-xs text-brand font-semibold border border-brand/50 rounded px-1.5 py-0.5">
            Size
          </span>
        )}
        <button
          onClick={handleFavoriteClick}
          aria-label="즐겨찾기 추가"
          aria-pressed={isFav}
          className={`transition-transform ${isLoggedIn ? 'hover:scale-110' : 'opacity-50 cursor-not-allowed'}`}
          disabled={!isLoggedIn || !!favoritesLoading}
          title={isLoggedIn ? undefined : '로그인이 필요합니다'}
        >
          <Star
            className={`w-5 h-5 ${
              isFav ? 'stroke-brand fill-brand/50' : 'stroke-muted fill-none'
            }`}
          />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-ink tabular-nums font-medium ${isInCart ? 'font-bold' : ''}`}>
          {Math.abs(product.price).toLocaleString()} P
        </span>
        {isAdmin && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={handleEditClick} className="btn-ghost p-1 h-auto text-sm" title="수정">
              <Edit className="w-4 h-4" />
            </button>
            <button onClick={handleDeleteClick} className="btn-ghost p-1 h-auto text-red-400 hover:bg-red-500/10" title="삭제">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface ProductListProps {
  onEditRequest: (product: Product) => void;
  onAddRequest: () => void;
}

const ProductList: React.FC<ProductListProps> = ({ onEditRequest, onAddRequest }) => {
  // 상품 데이터는 useProductStore에서 가져오도록 변경
  const products = useProductStore((state) => state.products);
  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const isLoading = useProductStore((state) => state.isLoading);
  const deleteProduct = useProductStore((state) => state.deleteProduct);

  const currentUser = useAppStore('staffSession', (state) => state.currentUser);
  const userFavorites = useAppStore('pointStore', (state) => state.userFavorites);
  const fetchUserFavorites = useAppStore('pointStore', (state) => state.fetchUserFavorites);
  const favoritesLoading = useAppStore('pointStore', (state) => state.userFavoritesLoading);

  const isAdmin = useMemo(() => currentUser?.position === 'admin', [currentUser]);

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleteModalOpen, , openDeleteModal, closeDeleteModal] = useToggle(false);
  const [initialCategorySet, setInitialCategorySet] = useState(false);
  const [activeCategory, setActiveCategory] = useState('전체'); // Add activeCategory state

  const handleEditClick = (product: Product) => {
    onEditRequest(product);
    onAddRequest(); // This will open the form which is now in the parent
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    openDeleteModal();
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
    }
    setProductToDelete(null);
    closeDeleteModal();
  };

  // 컴포넌트가 마운트될 때 장바구니와 카테고리를 초기화합니다.
  useEffect(() => {
    fetchProducts(); // Firestore에서 상품 목록을 가져옵니다.
    if (currentUser?.uid) {
      fetchUserFavorites(currentUser.uid);
    }

    // 컴포넌트가 언마운트될 때(페이지를 벗어날 때) 상태를 초기화합니다.
    return () => {
      // No resetPointState() as point state is now backend-driven
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProducts, currentUser?.uid]);

  // 제품이 로드된 후 기본 카테고리 설정
  useEffect(() => {
    if (!initialCategorySet && products.length > 0 && activeCategory === '즐겨찾기') {
      // CATEGORY_HIERARCHY의 첫 번째 키를 기본 카테고리로 설정
      const firstCategory = Object.keys(CATEGORY_HIERARCHY)[0];
      handleSelectCategory(firstCategory);
      setInitialCategorySet(true); // 초기 설정이 완료되었음을 표시
    }
  }, [products, activeCategory, initialCategorySet]);

  const handleSelectCategory = (category: string) => {
    const subCategories =
      CATEGORY_HIERARCHY[category as keyof typeof CATEGORY_HIERARCHY];
    // 1차 카테고리 선택 시 첫 번째 2차 카테고리로 자동 이동
    if (subCategories && subCategories.length > 0) {
      setActiveCategory(subCategories[0]);
    } else {
      setActiveCategory(category);
    }
  };

  const filteredProducts = useMemo(() => {
    if (activeCategory === '즐겨찾기') {
      return products.filter((product) => userFavorites.has(product.id));
    }

    // activeCategory가 항상 특정 하위 카테고리를 가리키므로, 해당 카테고리로 바로 필터링합니다.
    return products.filter((product) => product.category === activeCategory);
  }, [products, activeCategory, userFavorites]);

  return (
    <section>
      <div className="mb-6">
        <HierarchicalCategorySelector
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
        />
      </div>

      {/* 상품 삭제 확인 모달 */}
      <Modal
        open={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="상품 삭제 확인"
        desc={`'${productToDelete?.name}' 상품을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
      >
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={closeDeleteModal} className="btn-ghost">취소</button>
          <button onClick={confirmDelete} className="btn-primary bg-red-600 hover:bg-red-700">삭제</button>
        </div>
      </Modal>

      { (isLoading || (activeCategory === '즐겨찾기' && favoritesLoading)) && (
        <div className="text-center py-10 px-3 md:col-span-2">
          <p className="text-muted">{activeCategory === '즐겨찾기' ? '즐겨찾기 정보를 불러오는 중입니다…' : '상품 목록을 불러오는 중입니다…'}</p>
        </div>
      )}

      {!(isLoading || (activeCategory === '즐겨찾기' && favoritesLoading)) && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductListItem
              key={product.id}
              product={product}
              isAdmin={isAdmin}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))
        ) : (
          <div className="text-center py-10 px-3 md:col-span-2">
            {activeCategory === '즐겨찾기' ? (
              currentUser?.uid ? (
                <p className="text-muted">즐겨찾기가 없습니다. 상품의 별 아이콘을 눌러 추가해 보세요.</p>
              ) : (
                <p className="text-muted">로그인하면 즐겨찾기를 사용할 수 있어요.</p>
              )
            ) : (
              <p className="text-muted">상품이 없습니다.</p>
            )}
          </div>
        )}
      </div>
      )}
    </section>
  );
};

export default ProductList;
