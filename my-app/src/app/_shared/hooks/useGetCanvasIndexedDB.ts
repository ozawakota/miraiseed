'use client';

import { useState, useEffect, useCallback } from 'react';
import { DatabaseInfo, StoreContent } from '../types/database';

export function useGetCanvasIndexedDB() {
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storeContents, setStoreContents] = useState<{ [dbName: string]: StoreContent }>({});
  const TARGET_DB = 'exam-canvas-db' // 取得する対象のDB(DB名にexam-canvas-dbが含まれている)
  const fetchDatabases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dbList = await indexedDB.databases();
      const filteredDBs = dbList.filter(db => db.name && db.name.includes(TARGET_DB));
      
      const dbInfoPromises = filteredDBs.map(async (db) => {
        if (!db.name) return null;
        const stores = await getObjectStores(db.name);
        return { name: db.name, stores };
      });

      const dbInfos = (await Promise.all(dbInfoPromises)).filter((info): info is DatabaseInfo => info !== null);
      setDatabases(dbInfos);
    } catch (err) {
      setError('データベース情報の取得に失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getObjectStores = (dbName: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName);
      request.onerror = () => reject(new Error(`Failed to open database: ${dbName}`));
      request.onsuccess = () => {
        const db = request.result;
        resolve(Array.from(db.objectStoreNames));
        db.close();
      };
    });
  };

  const fetchStoreContent = async (dbName: string, storeName: string) => {
    return new Promise<unknown[]>((resolve, reject) => {
      const request = indexedDB.open(dbName);
      request.onerror = () => reject(new Error(`Failed to open database: ${dbName}`));
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const getAllRequest = store.getAll();
        getAllRequest.onerror = () => reject(new Error(`Failed to get data from store: ${storeName}`));
        getAllRequest.onsuccess = () => resolve(getAllRequest.result);
        db.close();
      };
    });
  };

  const handleFetchStoreContent = async (dbName: string, storeName: string) => {
    try {
      const content = await fetchStoreContent(dbName, storeName);
      setStoreContents(prev => ({
        ...prev,
        [dbName]: {
          ...prev[dbName],
          [storeName]: content as unknown[]
        }
      }));
    } catch (err) {
      console.error(`Failed to fetch content for ${dbName}.${storeName}:`, err);
    }
  };

  useEffect(() => {
    fetchDatabases();
  }, [fetchDatabases]);

  return {
    databases,
    loading,
    error,
    storeContents,
    fetchDatabases,
    handleFetchStoreContent
  };
}