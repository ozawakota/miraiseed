'use client'
import React, { useState, useRef, useCallback, useMemo } from 'react';

export default function KeyBoard() {
  const [value, setValue] = useState('');
  const [composingValue, setComposingValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isComposing, setIsComposing] = useState(false);

  const filterInput = useMemo(() => (input: string) => {
    return input.replace(/[^a-zA-Z0-9\s]/g, '');
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isComposing) {
      setComposingValue(e.target.value);
    } else {
      const filteredInput = filterInput(e.target.value);
      setValue(filteredInput);

      // カーソル位置を保持
      const cursorPos = e.target.selectionStart;
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(cursorPos, cursorPos);
        }
      }, 0);
    }
  }, [isComposing, filterInput]);

  const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    if (isComposing) {
      setComposingValue(e.currentTarget.value);
    }
  }, [isComposing]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (textareaRef.current) {
        const cursorPos = textareaRef.current.selectionStart;
        const newValue = value.slice(0, cursorPos) + '\n' + value.slice(cursorPos);
        setValue(newValue);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(cursorPos + 1, cursorPos + 1);
          }
        }, 0);
      }
    }
  }, [value]);

  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  const handleCompositionEnd = useCallback(() => {
    setIsComposing(false);
    if (textareaRef.current) {
      const filteredInput = filterInput(textareaRef.current.value);
      setValue(filteredInput);
      setComposingValue('');
    }
  }, [filterInput]);

  return (
    <section className="p-4 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 md:mb-10">キーボード制御</h1>
        <div className="mb-16">
          <h2 className="text-xl font-bold pb-4">実装要件</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>onInputイベントハンドラー</li>
            <li>リアルタイムフィルタリング</li>
            <li>Enterキーでカーソルを右に移動</li>
            <li>日本語入力の防止</li>
            <li>ローマ字入力の防止</li>
            <li>iOS/iPhone/iPad対応</li>
          </ul>
        </div>
        
        <div className="mb-16">
          <h2 className="text-xl font-bold pb-4">制限付きテキストエリア</h2>
          <textarea
            ref={textareaRef}
            value={isComposing ? composingValue : value}
            onChange={handleChange}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder="英語のみ入力可能です"
            className="w-full p-2 border rounded resize-none bg-gray-700 text-white"
            rows={4}
            aria-label="英語と記号のみ入力可能なテキストエリア"
            lang="en"
          />
          <p className="mt-2 text-sm text-gray-300">
            注意：このテキストエリアは英数字と一般的な記号のみ入力可能です。日本語文字は入力できません。
          </p>
        </div>
      </div>
    </section>
  )
}