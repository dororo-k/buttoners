import React, { useRef } from 'react';
import { createStore, set, clear } from 'idb-keyval';
import { notifications } from '@mantine/notifications';

const manualStore = createStore('redbutton-manuals', 'pdf-store');

const Restore: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm("정말 데이터를 복구하시겠습니까? 현재 모든 데이터가 삭제되고 백업 파일로 덮어씌워집니다.")) {
      return;
    }

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      // 1. Clear existing data
      localStorage.clear();
      await clear(manualStore);

      // 2. Restore localStorage
      for (const key in backupData.localStorage) {
        const value = backupData.localStorage[key];
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      }

      // 3. Restore IndexedDB
      for (const key in backupData.indexedDB) {
        const value = backupData.indexedDB[key];
        if (typeof value === 'string' && value.startsWith('data:')) {
          const blob = await base64ToBlob(value);
          await set(key, blob, manualStore);
        } else {
            await set(key, value, manualStore);
        }
      }

      try { notifications.show({ color: 'green', message: '데이터 복구가 완료되었습니다. 새로고침합니다.' }); } catch {}
      window.location.reload();

    } catch (error) {
      console.error("Restore failed:", error);
      try { notifications.show({ color: 'red', message: '데이터 복구에 실패했습니다.' }); } catch {}
    }
  };

  const base64ToBlob = async (base64: string): Promise<Blob> => {
    const res = await fetch(base64);
    return await res.blob();
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="card card-compact mt-6">
      <h2 className="text-xl font-bold">데이터 복구</h2>
      <p className="text-muted mt-1">JSON 백업 파일에서 데이터를 복구합니다. 되돌릴 수 없습니다.</p>
      <input type="file" accept=".json" ref={fileInputRef} onChange={handleRestore} className="hidden" />
      <button onClick={triggerFileInput} className="btn-primary mt-4 bg-red-600 hover:bg-red-700">
        백업 파일 선택 및 복구
      </button>
    </div>
  );
};

export default Restore;
