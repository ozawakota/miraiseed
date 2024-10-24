'use client';

import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useGetCanvasIndexedDB } from '../_shared/hooks/useGetCanvasIndexedDB';

export default function CanvasIchiranPage() {
  const { databases, loading, error, storeContents, fetchDatabases, handleFetchStoreContent } = useGetCanvasIndexedDB();

  return(
    <section className="p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 md:mb-10">キャンバス一覧</h1>
        
        <Button onClick={fetchDatabases} className="mb-4">データベース情報を更新</Button>

        {loading && <p>読み込み中...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {databases.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
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