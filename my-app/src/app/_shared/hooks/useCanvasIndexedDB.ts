'use client'

import { useState, useEffect, useCallback } from 'react';

/**
 * 描画アクションの型
 * @typedef {Object} DrawAction
 * @property {Object} answers
 * @property {string} answers.userId - ユーザーID
 * @property {string} answers.deliveryId - 配信ID
 * @property {Object} answers.canvas - キャンバスデータ
 * @property {Array<{points: Array<{x: number, y: number}>}>} answers.canvas.paths - 描画パス
 */
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

/**
 * IndexedDBを使用してキャンバスデータを管理するカスタムフック
 * @param {string} deliveryId - 配信ID
 * @param {string} userId - ユーザーID
 * @returns {Object} - データベース操作用の関数群
 */
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
  });


  /**
   * 新しい描画パスを保存する
   * @param {{points: Array<{x: number, y: number}>}} newPath - 新しい描画パス
   * @returns {Promise<void>} - 保存が完了するPromise
   */
  const savePath = useCallback(async (newPath: { points: Array<{ x: number; y: number }> }) => {
    if (!db) return;

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const getRequest = store.get(1);

      getRequest.onerror = () => reject(new Error('Failed to get existing paths'));
      getRequest.onsuccess = () => {
        const existingData: DrawAction = getRequest.result || { answers: { deliveryId, userId, canvas: { paths: [] } } };
        existingData.answers.canvas.paths.push(newPath);

        const putRequest = store.put(existingData, 1);
        putRequest.onerror = () => reject(new Error('Failed to save path'));
        putRequest.onsuccess = () => resolve();
      };
    });
  }, [db, storeName, deliveryId, userId]);

  /**
   * すべての描画パスを取得する
   * @returns {Promise<DrawAction>} - 描画アクションのPromise
   */
  const getAllPaths = useCallback(async (): Promise<DrawAction> => {
    if (!db) return { answers: { deliveryId, userId, canvas: { paths: [] } } };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(1);

      request.onerror = () => reject(new Error('Failed to get paths'));
      request.onsuccess = () => resolve(request.result || { answers: { deliveryId, userId, canvas: { paths: [] } } });
    });
  }, [db, storeName, deliveryId, userId]);

  /**
   * すべての描画パスをクリアする
   * @returns {Promise<void>} - クリアが完了するPromise
   */
  const clearAllPaths = useCallback(async () => {
    if (!db) return;

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put({ answers: { deliveryId, userId, canvas: { paths: [] } } }, 1);

      request.onerror = () => reject(new Error('Failed to clear paths'));
      request.onsuccess = () => resolve();
    });
  }, [db, storeName ,deliveryId, userId]);

  /**
   * 描画パスを更新する
   * @param {Array<{points: Array<{x: number, y: number}>}>} paths - 更新する描画パス
   * @returns {Promise<void>} - 更新が完了するPromise
   */
  const updatePaths = useCallback(async (paths: Array<{ points: Array<{ x: number; y: number }> }>) => {
    if (!db) return;

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put({ answers: { deliveryId, userId, canvas: { paths } } }, 1);

      request.onerror = () => reject(new Error('Failed to update paths'));
      request.onsuccess = () => resolve();
    });
  }, [db, storeName, deliveryId, userId]);

  return { savePath, getAllPaths, clearAllPaths, updatePaths };
}
