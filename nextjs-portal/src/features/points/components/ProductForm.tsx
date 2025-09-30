import React, { useEffect, useState } from 'react';
import type { Product } from '../types';
import useProductStore from '../store/useProductStore';
import { Modal } from '@/components/Modal';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export default function ProductForm({
  isOpen,
  onClose,
  productToEdit,
}: ProductFormProps): React.ReactElement | null {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');

  const { addProduct, updateProduct } = useProductStore();

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setPrice(String(productToEdit.price));
    } else {
      setName('');
      setCategory('');
      setPrice('');
    }
    setError('');
  }, [productToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericPrice = Number(price);
    if (!name || !category || isNaN(numericPrice)) {
      setError('이름, 카테고리, 가격을 올바르게 입력해주세요.');
      return;
    }

    const productData = { name, category, price: numericPrice };
    if (productToEdit) {
      updateProduct(productToEdit.id, productData);
    } else {
      addProduct(productData);
    }
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={onClose} title={productToEdit ? '상품 수정' : '새 상품 추가'}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="product-name" className="block text-sm font-medium text-stone-700">상품명</label>
          <input id="product-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500" required />
        </div>
        <div>
          <label htmlFor="product-category" className="block text-sm font-medium text-stone-700">카테고리</label>
          <input id="product-category" type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500" required />
        </div>
        <div>
          <label htmlFor="product-price" className="block text-sm font-medium text-stone-700">가격(포인트)</label>
          <input id="product-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500" required />
        </div>
        {error && <p className="text-xs italic text-red-500">{error}</p>}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg bg-stone-200 px-4 py-2 font-medium text-stone-800 hover:bg-stone-300">취소</button>
          <button type="submit" className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700">{productToEdit ? '수정' : '추가'}</button>
        </div>
      </form>
    </Modal>
  );
}
