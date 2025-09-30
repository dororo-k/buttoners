import React, { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import type { MenuItem } from '@/types/points';
import { subscribeMenus, addMenuItemFs, updateMenuItemFs } from '../services/menuRepo';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';

interface MenuSettingsProps {
  openDeleteModal: (item: MenuItem) => void;
  onAddProduct: () => void;
}

const MenuSettings: React.FC<MenuSettingsProps> = ({ openDeleteModal, onAddProduct }) => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [newItem, setNewItem] = useState({ category: '', name: '', price: 0 });
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    const unsub = subscribeMenus(setMenu);
    return () => unsub();
  }, []);

  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.category.trim() || !newItem.name.trim() || newItem.price <= 0) {
      try { notifications.show({ color: 'red', message: '카테고리, 상품 이름, 가격을 바르게 입력해 주세요.' }); } catch {}
      return;
    }
    await addMenuItemFs(newItem);
    setNewItem({ category: '', name: '', price: 0 });
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;
    if (!editingItem.category.trim() || !editingItem.name.trim() || editingItem.price <= 0) {
      try { notifications.show({ color: 'red', message: '카테고리, 상품 이름, 가격을 바르게 입력해 주세요.' }); } catch {}
      return;
    }
    await updateMenuItemFs(editingItem.id, {
      category: editingItem.category,
      name: editingItem.name,
      price: editingItem.price,
    });
    setEditingItem(null);
  };

  const startEditing = (item: MenuItem) => setEditingItem({ ...item });
  const cancelEditing = () => setEditingItem(null);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, itemToUpdate: 'new' | 'editing') => {
    const value = e.target.value;
    const price = value === '' ? 0 : parseInt(value, 10);
    if (isNaN(price)) return;
    if (itemToUpdate === 'new') setNewItem({ ...newItem, price });
    else if (editingItem) setEditingItem({ ...editingItem, price });
  };

  return (
    <div className="space-y-6 my-4 max-h-[60vh] overflow-y-auto scroll-thin pr-2">
      {/* Add New Product Button */}
      <div className="card-elev p-4">
        <h3 className="text-lg font-semibold mb-3">상품 관리</h3>
        <button onClick={onAddProduct} className="btn-primary w-full"><Plus className="w-4 h-4 mr-2" />신규 상품 추가</button>
      </div>

      {/* Menu List */}
      <div className="space-y-2">
        {menu.map((item) => (
          <div key={item.id} className="card-compact p-3 bg-elev rounded-md group">
            {editingItem?.id === item.id ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input type="text" value={editingItem.category} onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })} className="input text-sm sm:col-span-1" />
                  <input type="text" value={editingItem.name} onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} className="input text-sm sm:col-span-2" />
                  <input type="number" value={editingItem.price === 0 ? '' : editingItem.price} onChange={(e) => handlePriceChange(e, 'editing')} className="input text-sm" min="1" />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={handleUpdateItem} className="btn-primary text-xs px-2 py-1"><Save className="w-3 h-3 mr-1" />저장</button>
                  <button onClick={cancelEditing} className="btn-ghost text-xs px-2 py-1"><X className="w-3 h-3 mr-1" />취소</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-1/4 text-sm text-muted truncate">{item.category}</div>
                <div className="flex-1 font-medium text-ink truncate">{item.name}</div>
                <div className="w-1/5 text-sm text-right tabular-nums">{item.price.toLocaleString()}P</div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEditing(item)} className="btn-ghost p-1 h-auto text-sm" title="수정"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => openDeleteModal(item)} className="btn-ghost p-1 h-auto text-red-400 hover:bg-red-500/10" title="삭제"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuSettings;
