"use client"

import { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Undo, Redo, Trash2 } from 'lucide-react'

/**
 * 描画アクションを表す型
 */
type DrawAction = {
  path: { x: number; y: number }[];
}

/**
 * 描画アプリケーションのメインコンポーネント
 * キャンバス上で描画を行い、undo/redo機能を提供します
 * @returns {JSX.Element} 描画アプリケーションのUI
 */
export default function DrawingApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawHistory, setDrawHistory] = useState<DrawAction[]>([])
  const [redoHistory, setRedoHistory] = useState<DrawAction[]>([])
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([])

  /**
   * キャンバスに全ての描画履歴を再描画する関数
   */
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    context.clearRect(0, 0, canvas.width, canvas.height)

    context.strokeStyle = 'black'
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.lineWidth = 2

    // 全てのパスを再描画
    drawHistory.forEach(action => {
      context.beginPath()
      action.path.forEach((point, index) => {
        if (index === 0) {
          context.moveTo(point.x, point.y)
        } else {
          context.lineTo(point.x, point.y)
        }
      })
      context.stroke()
    })
  }, [drawHistory])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  /**
   * 描画開始時の処理
   * @param {React.MouseEvent<HTMLCanvasElement>} e - マウスイベント
   */
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setCurrentPath([{ x, y }])
    setIsDrawing(true)
  }

  /**
   * 描画中の処理
   * @param {React.MouseEvent<HTMLCanvasElement>} e - マウスイベント
   */
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setCurrentPath(prev => {
      const newPath = [...prev, { x, y }]
      
      context.strokeStyle = 'black'
      context.beginPath()
      context.moveTo(prev[prev.length - 1].x, prev[prev.length - 1].y)
      context.lineTo(x, y)
      context.stroke()

      return newPath
    })
  }

  /**
   * 描画終了時の処理
   */
  const stopDrawing = () => {
    if (currentPath.length > 1) {
      setDrawHistory(prev => [...prev, { path: currentPath }])
      setRedoHistory([])
    }
    setCurrentPath([])
    setIsDrawing(false)
  }

  /**
   * キャンバスをクリアする処理
   */
  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    context.clearRect(0, 0, canvas.width, canvas.height)
    setDrawHistory([])
    setRedoHistory([])
  }

  /**
   * 直前の描画をundoする処理
   */
  const undo = () => {
    if (drawHistory.length === 0) return

    const lastAction = drawHistory[drawHistory.length - 1]
    setRedoHistory(prev => [...prev, lastAction])
    setDrawHistory(prev => prev.slice(0, -1))
    drawCanvas()
  }

  /**
   * 直前のundoをredoする処理
   */
  const redo = () => {
    if (redoHistory.length === 0) return

    const nextAction = redoHistory[redoHistory.length - 1] // redoHistoryの最後の要素（最後にundoしたアクション）を取得
    setDrawHistory(prev => [...prev, nextAction]) // 取得したアクションを描画履歴（drawHistory）の末尾に追加
    setRedoHistory(prev => prev.slice(0, -1)) // アクションが描画履歴に戻されたため、redoHistoryから最後の要素を削除
    drawCanvas()
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="border border-gray-300"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
      />
      <div className="flex items-center justify-between w-full max-w-md">
        <div className="flex items-center space-x-2">
          <Button onClick={undo} disabled={drawHistory.length === 0}>
            <Undo className="w-4 h-4 mr-2" />
            元に戻す
          </Button>
          <Button onClick={redo} disabled={redoHistory.length === 0}>
            <Redo className="w-4 h-4 mr-2" />
            やり直す
          </Button>
        </div>
        <Button onClick={clearCanvas}>
          <Trash2 className="w-4 h-4 mr-2" />
          全て消す
        </Button>
      </div>
    </div>
  )
}