'use client'

import { useState, useEffect, useCallback } from 'react';

export type DrawAction = {
  answers: {
    userId: string,
    deliveryId: string,
    canvas: {
      paths: Array<{
        points: Array<{ x: number; y: number }>;
      }>;
    };
  };
};

export function useCanvasIndexedDB(deliveryId: string, userId: string) {
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const dbName = `exam-canvas-db-${deliveryId}-${userId}`;
  const storeName = `exam-canvas-store-${deliveryId}-${userId}`;

  useEffect(() => {
    const openDB = () => {
      const request = indexedDB.open(dbName, 4);

      request.onerror = () => console.error("Error opening database");
      request.onsuccess = () => setDb(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (event.oldVersion < 2) {
          if (db.objectStoreNames.contains(storeName)) {
            db.deleteObjectStore(storeName);
          }
          db.createObjectStore(storeName, { autoIncrement: true });
        }
      };
    };

    openDB();

    return () => {
      if (db) db.close();
    };
  }, [dbName, storeName, db]);

  const savePath = useCallback(async (newPath: { points: Array<{ x: number; y: number }> }) => {
    if (!db) return;

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const getRequest = store.get(1); // Assuming we're always using key 1 for the DrawAction

      getRequest.onerror = () => reject(new Error('Failed to get existing paths'));
      getRequest.onsuccess = () => {
        const existingData: DrawAction = getRequest.result || { answers: { deliveryId: `${deliveryId}` , userId: `${userId}` , canvas: { paths: [] } } };
        existingData.answers.canvas.paths.push(newPath);

        const putRequest = store.put(existingData, 1);
        putRequest.onerror = () => reject(new Error('Failed to save path'));
        putRequest.onsuccess = () => resolve();
      };
    });
  }, [db, storeName]);

  const getAllPaths = useCallback(async (): Promise<DrawAction> => {
    if (!db) return { answers: { deliveryId: `${deliveryId}` , userId: `${userId}`, canvas: { paths: [] } } };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(1); // Assuming we're always using key 1 for the DrawAction

      request.onerror = () => reject(new Error('Failed to get paths'));
      request.onsuccess = () => resolve(request.result || { answers: { deliveryId: `${deliveryId}` , userId: `${userId}`, canvas: { paths: [] } } });
    });
  }, [db, storeName]);

  const clearAllPaths = useCallback(async () => {
    if (!db) return;

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put({ answers: { deliveryId: `${deliveryId}` , userId: `${userId}`, canvas: { paths: [] } } }, 1);

      request.onerror = () => reject(new Error('Failed to clear paths'));
      request.onsuccess = () => resolve();
    });
  }, [db, storeName]);

  const updatePaths = useCallback(async (paths: Array<{ points: Array<{ x: number; y: number }> }>) => {
    if (!db) return;

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put({ answers: { deliveryId: `${deliveryId}` , userId: `${userId}`, canvas: { paths } } }, 1);

      request.onerror = () => reject(new Error('Failed to update paths'));
      request.onsuccess = () => resolve();
    });
  }, [db, storeName]);

  return { savePath, getAllPaths, clearAllPaths, updatePaths };
}