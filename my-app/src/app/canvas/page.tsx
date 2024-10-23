'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';


export default function CanvasPage() {

  return(
    <section className="p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 md:mb-10">キャンバス保存</h1>
        <div className="mb-16">
          <h2 className="text-xl font-bold pb-4">実装要件</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>リアルタイム保存</li>
            <li>IndexedDb使用</li>
            <li>undo / redo対応</li>
            <li>全て消すボタン</li>
            <li>プレビュー</li>
          </ul>
        </div>

      </div>
    </section>
  )
}