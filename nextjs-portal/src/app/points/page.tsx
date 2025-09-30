'use client';

import PageLayout from '@/components/PageLayout';
import React, { useState } from 'react';
import { useAppStore } from '@/components/providers/StoreProvider';
import { useToggle } from '@/hooks/useToggle';

import ProductList from '@/features/points/components/ProductList';
import ShoppingCart from '@/features/points/components/ShoppingCart';
import MenuSettings from '@/features/points/components/MenuSettings';
import ProductForm from '@/features/points/components/ProductForm';
import MyPointHistoryModal from '@/features/points/components/MyPointHistoryModal';
import MyPointGiftModal from '@/features/points/components/MyPointGiftModal';
import PointsGiftIndicator from '@/features/points/components/PointsGiftIndicator';

import { deleteMenuItemFs } from '@/features/points/services/menuRepo';
import { Modal } from '@/components/Modal';
import type { MenuItem } from '@/types/points';
import type { Product } from '@/features/points/types';

export default function PointsPage() {
  const isAdmin = useAppStore('adminSession', (state) => state.isAdmin);

  // ProductForm Modal State
  const [isFormOpen, , openForm, closeForm] = useToggle(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);

  // 삭제는 Firestore에 반영
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);

  const confirmDelete = async () => {
    if (itemToDelete) {
      await deleteMenuItemFs(itemToDelete.id);
    }
    setItemToDelete(null);
  };

  const handleAddProduct = () => {
    setProductToEdit(null);
    setIsMenuModalOpen(false); // Close settings modal
    openForm(); // Open product form modal
  };

  const handleCloseForm = () => {
    setProductToEdit(null);
    closeForm();
  };

  return (
    <PageLayout title="포인트 사용" description="보유하신 포인트로 상품을 구매할 수 있습니다.">
      {/* <PageHeader title="포인트 사용" description="보유하신 포인트로 상품을 구매할 수 있습니다." /> */}
      <div className="space-y-6 mt-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PointsGiftIndicator />
            <button onClick={() => setHistoryOpen(true)} className="btn-ghost">내 구매내역</button>
            <button onClick={() => setGiftOpen(true)} className="btn-ghost">포인트 선물</button>
          </div>
          {isAdmin && (<button onClick={() => setIsMenuModalOpen(true)} className="btn-primary">메뉴 설정</button>)}
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><ProductList onEditRequest={setProductToEdit} onAddRequest={openForm} /></div>
          <div className="mt-8 lg:mt-0"><ShoppingCart /></div>
        </div>
      </div>
      <Modal open={isMenuModalOpen} onClose={() => setIsMenuModalOpen(false)} title="메뉴 설정" desc="포인트로 구매 가능한 메뉴를 관리합니다.">
        <MenuSettings openDeleteModal={setItemToDelete} onAddProduct={handleAddProduct} />
      </Modal>
      <Modal open={!!itemToDelete} onClose={() => setItemToDelete(null)} title="메뉴 삭제 확인" desc={`'${itemToDelete?.name}' 메뉴를 정말 삭제하시겠습니까?`} actions={<><button onClick={() => setItemToDelete(null)} className="btn-ghost">취소</button><button onClick={confirmDelete} className="btn-primary bg-red-600 hover:bg-red-700">삭제</button></>}/>
      <ProductForm isOpen={isFormOpen} onClose={handleCloseForm} productToEdit={productToEdit} />
      <MyPointHistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <MyPointGiftModal open={giftOpen} onClose={() => setGiftOpen(false)} />
    </PageLayout>
  );
}
