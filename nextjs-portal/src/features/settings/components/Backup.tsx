import React from 'react';
import { createStore, get, keys } from 'idb-keyval';
import { notifications } from '@mantine/notifications';

const manualStore = createStore('redbutton-manuals', 'pdf-store');

const Backup: React.FC = () => {
  const handleBackup = async () => {
    try {
      // 1. Get localStorage data
      const localStorageData: { [key: string]: unknown } = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          try {
            localStorageData[key] = JSON.parse(value!);
          } catch {
            localStorageData[key] = value;
          }
        }
      }

      // 2. Get IndexedDB data
      const indexedDBData: { [key: string]: unknown } = {};
      const idbKeys = await keys(manualStore);
      for (const key of idbKeys) {
        indexedDBData[key as string] = await get(key, manualStore);
      }

      // Convert blobs to base64
      for (const key in indexedDBData) {
        if (indexedDBData[key] instanceof Blob) {
          indexedDBData[key] = await blobToBase64(indexedDBData[key]);
        }
      }
      
      // 3. Combine data
      const backupData = {
        localStorage: localStorageData,
        indexedDB: indexedDBData,
      };

      const json = JSON.stringify(backupData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `redbutton-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Backup failed:", error);
      try { notifications.show({ color: 'red', message: '백업에 실패했습니다.' }); } catch {}
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blob);
    });
  }

  return (
    <div className="card card-compact">
      <h2 className="text-xl font-bold">데이터 백업</h2>
      <p className="text-muted mt-1">모든 데이터를 JSON 파일로 저장합니다.</p>
      <button onClick={handleBackup} className="btn-primary mt-4">
        백업 파일 생성
      </button>
    </div>
  );
};

export default Backup;
