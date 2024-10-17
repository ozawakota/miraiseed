'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'

export default function KeyBoard() {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isComposing, setIsComposing] = useState(false)

  // 許可される文字のパターン
  const allowedPattern = /^[a-zA-Z0-9\s\.,!?@#$%^&*()_+\-=\[\]{};:'\"\\|<>\/]*$/

  const filterInput = useCallback((input: string) => {
    return input.split('').filter(char => allowedPattern.test(char)).join('')
  }, [])

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isComposing) {
      const input = e.target.value
      const filteredInput = filterInput(input)
      setValue(filteredInput)

      // カーソル位置の調整
      const cursorPosition = e.target.selectionStart
      if (cursorPosition !== null) {
        window.requestAnimationFrame(() => {
          e.target.setSelectionRange(cursorPosition, cursorPosition)
        })
      }
    }
  }, [filterInput, isComposing])

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      const handleCompositionStart = () => setIsComposing(true)
      const handleCompositionEnd = () => {
        setIsComposing(false)
        const filteredValue = filterInput(textarea.value)
        setValue(filteredValue)
        
        // Set cursor to the end
        textarea.setSelectionRange(filteredValue.length, filteredValue.length)
      }

      textarea.addEventListener('compositionstart', handleCompositionStart)
      textarea.addEventListener('compositionend', handleCompositionEnd)

      return () => {
        textarea.removeEventListener('compositionstart', handleCompositionStart)
        textarea.removeEventListener('compositionend', handleCompositionEnd)
      }
    }
  }, [filterInput])

  return (
    <section className="p-4 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 md:mb-10">キーボード制御</h1>
        <div className="mb-16">
          <h2 className="text-xl font-bold pb-4">実装要件</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>onChangeイベントハンドラー</li>
            <li>リアルタイムフィルタリング</li>
            <li>カーソル位置の調整</li>
            <li>iOS/iPhone対応</li>
          </ul>
        </div>
        
        <div className="mb-16">
          <h2 className="text-xl font-bold pb-4">制限付きテキストエリア</h2>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            placeholder="英語のみ入力可能です"
            className="w-full p-2 border rounded resize-none bg-gray-700 text-white"
            rows={4}
            aria-label="英語と記号のみ入力可能なテキストエリア"
          />
          <p className="mt-2 text-sm text-gray-300">
            注意：このテキストエリアは英数字と一般的な記号のみ入力可能です。日本語文字は入力できません。
          </p>
        </div>
      </div>
    </section>
  )
}