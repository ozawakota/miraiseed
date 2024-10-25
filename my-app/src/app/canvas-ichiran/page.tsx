'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useGetCanvasIndexedDB } from '../_shared/hooks/useGetCanvasIndexedDB';
import { Image } from 'lucide-react';

type GroupedDatabases = {
  [userId: string]: {
    name: string;
    stores: string[];
  }[];
};

export default function CanvasIchiranPage() {
  const { databases, loading, error, storeContents, fetchDatabases, handleFetchStoreContent } = useGetCanvasIndexedDB();
  const [generatingImages, setGeneratingImages] = useState<{[key: string]: boolean}>({});
  const [generatedImages, setGeneratedImages] = useState<{[key: string]: string}>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getUserIdFromDbName = (dbName: string): string => {
    const parts = dbName.split('-');
    return parts[parts.length - 1];
  };

  const groupedDatabases: GroupedDatabases = useMemo(() => {
    return databases.reduce((acc, db) => {
      if (db.name && db.name.startsWith('exam-canvas-db-')) {
        const userId = getUserIdFromDbName(db.name);
        if (!acc[userId]) {
          acc[userId] = [];
        }
        acc[userId].push(db);
      }
      return acc;
    }, {} as GroupedDatabases);
  }, [databases]);

  const drawPathsOnCanvas = useCallback((canvas: HTMLCanvasElement, paths: any[]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    paths.forEach(path => {
      ctx.beginPath();
      path.points.forEach((point: { x: number; y: number }, index: number) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    });
  }, []);

  const handleGenerateImage = useCallback(async (dbName: string) => {
    setGeneratingImages(prev => ({ ...prev, [dbName]: true }));
    try {
      const stores = storeContents[dbName];
      if (!stores) throw new Error('No stores found for this database');

      const storeWithCanvas = Object.values(stores).find(store => 
        Array.isArray(store) && store.length > 0 && store[0].answers?.canvas
      );

      if (!storeWithCanvas || !Array.isArray(storeWithCanvas)) {
        throw new Error('No canvas data found');
      }

      const canvasData = storeWithCanvas[0].answers.canvas;

      if (!canvasRef.current) {
        throw new Error('Canvas element not found');
      }

      // Set canvas size (you might want to adjust this based on your needs)
      canvasRef.current.width = 200;
      canvasRef.current.height = 200;

      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.scale(0.5, 0.5);
      }

      drawPathsOnCanvas(canvasRef.current, canvasData.paths);

      const imageDataUrl = canvasRef.current.toDataURL('image/png');
      setGeneratedImages(prev => ({ ...prev, [dbName]: imageDataUrl }));
    } catch (err) {
      console.error(`Failed to generate image for ${dbName}:`, err);
    } finally {
      setGeneratingImages(prev => ({ ...prev, [dbName]: false }));
    }
  }, [storeContents, drawPathsOnCanvas]);

  useEffect(() => {
    const generateAllImages = async () => {
      for (const userDatabases of Object.values(groupedDatabases)) {
        for (const db of userDatabases) {
          if (db.name) {
            await handleFetchStoreContent(db.name, db.stores[0]);
            await handleGenerateImage(db.name);
          }
        }
      }
    };

    if (Object.keys(groupedDatabases).length > 0) {
      generateAllImages();
    }
  }, [groupedDatabases, handleFetchStoreContent, handleGenerateImage]);

  return(
    <section className="p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 md:mb-10">キャンバス一覧</h1>
        
        <Button onClick={fetchDatabases} className="mb-4">データベース情報を更新</Button>

        {loading && <p>読み込み中...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {Object.entries(groupedDatabases).map(([userId, userDatabases]) => (
          <div key={userId} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">ユーザーID: {userId}</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {userDatabases.map((db) => (
                db.name && (
                  <div key={db.name} className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2">{db.name}</h3>
                    {generatedImages[db.name] ? (
                      <img src={generatedImages[db.name]} alt={`Generated Canvas for ${db.name}`} className="w-full border border-gray-300" />
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center bg-gray-100">
                        {generatingImages[db.name] ? '生成中...' : '画像なし'}
                      </div>
                    )}
                    <Button 
                      onClick={() => handleGenerateImage(db.name)} 
                      disabled={generatingImages[db.name]}
                      className="mt-2"
                    >
                      <Image className="mr-2 h-4 w-4" />
                      {generatingImages[db.name] ? '生成中...' : '画像を再生成'}
                    </Button>
                  </div>
                )
              ))}
            </div>
          </div>
        ))}

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {databases.length > 0 && (
          <Accordion type="single" collapsible className="w-full mt-4">
            {databases.map((db) => (
              <AccordionItem key={db.name} value={db.name}>
                <AccordionTrigger>{db.name}</AccordionTrigger>
                <AccordionContent>
                  <ul>
                    {db.stores.map((store) => (
                      <li key={store} className="mb-2">
                        <Button 
                          onClick={() => handleFetchStoreContent(db.name, store)}
                          variant="outline"
                          size="sm"
                        >
                          {store}
                        </Button>
                        {storeContents[db.name]?.[store] && (
                          <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40">
                            {JSON.stringify(storeContents[db.name][store], null, 2)}
                          </pre>
                        )}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </section>
  )
}