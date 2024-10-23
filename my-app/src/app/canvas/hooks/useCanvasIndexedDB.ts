'use client'

import { useState, useEffect, useCallback } from 'react';

export type DrawAction = {
  path: { x: number; y: number }[];
};

export function useCanvasIndexedDB(deliveryId: string, userId: string) {
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const dbName = `exam-canvas-db-${deliveryId}-${userId}`;

  useEffect(() => {
    const openDB = () => {
      const request = indexedDB.open(dbName, 1);

      request.onerror = () => console.error("Error opening database");
      request.onsuccess = () => setDb(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        db.createObjectStore('paths', { autoIncrement: true });
      };
    };

    openDB();

    return () => {
      if (db) db.close();
    };
  }, [dbName]);

  const savePath = useCallback(async (path: DrawAction) => {
    if (!db) return;

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['paths'], 'readwrite');
      const store = transaction.objectStore('paths');
      const request = store.add(path);

      request.onerror = () => reject(new Error('Failed to save path'));
      request.onsuccess = () => resolve();
    });
  }, [db]);

  const getAllPaths = useCallback(async (): Promise<DrawAction[]> => {
    if (!db) return [];

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['paths'], 'readonly');
      const store = transaction.objectStore('paths');
      const request = store.getAll();

      request.onerror = () => reject(new Error('Failed to get paths'));
      request.onsuccess = () => resolve(request.result);
    });
  }, [db]);

  const clearAllPaths = useCallback(async () => {
    if (!db) return;

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['paths'], 'readwrite');
      const store = transaction.objectStore('paths');
      const request = store.clear();

      request.onerror = () => reject(new Error('Failed to clear paths'));
      request.onsuccess = () => resolve();
    });
  }, [db]);

  const updatePaths = useCallback(async (paths: DrawAction[]) => {
    await clearAllPaths();
    for (const path of paths) {
      await savePath(path);
    }
  }, [clearAllPaths, savePath]);

  return { savePath, getAllPaths, clearAllPaths, updatePaths };
}