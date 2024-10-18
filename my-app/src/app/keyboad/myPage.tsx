'use client'
import React, { useState, useCallback, useRef, useEffect } from 'react'

export default function KeyBoard() {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 許可される文字のパターン
  const allowedPattern = /^[a-zA-Z0-9\s\.,!?@#$%^&*()_+\-=\[\]{};:'\"\\|<>\/]*$/

  const filterInput = useCallback((input: string) => {
    return input.split('').filter(char => allowedPattern.test(char)).join('')
  }, [])

  const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    const input = e.currentTarget.value
    const filteredInput = filterInput(input)
    
    if (filteredInput !== input) {
      const cursorPosition = e.currentTarget.selectionStart || 0
      const diff = input.length - filteredInput.length
      setValue(filteredInput)

      // カーソル位置の調整
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          const newPosition = Math.max(0, cursorPosition - diff)
          textareaRef.current.setSelectionRange(newPosition, newPosition)
        }
      })
    } else {
      setValue(filteredInput)
    }
  }, [filterInput])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const cursorPosition = e.currentTarget.selectionStart || 0
      const newValue = value.slice(0, cursorPosition) + '\n' + value.slice(cursorPosition)
      setValue(newValue)
      
      // Enterキーが押されたら、カーソルを右に移動
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(cursorPosition + 1, cursorPosition + 1)
        }
      })
    }
  }, [value])

  useEffect(() => {
    if (textareaRef.current) {
      const cursorPosition = textareaRef.current.selectionStart
      textareaRef.current.value = value
      textareaRef.current.setSelectionRange(cursorPosition, cursorPosition)
    }
  }, [value])

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
            <li>iOS/iPhone/iPad対応</li>
          </ul>
        </div>
        
        <div className="mb-16">
          <h2 className="text-xl font-bold pb-4">制限付きテキストエリア</h2>
          <textarea
            ref={textareaRef}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
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