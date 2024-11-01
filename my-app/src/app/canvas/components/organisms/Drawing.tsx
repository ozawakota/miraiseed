"use client"

import { useRef, useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Undo, Redo, Trash2 } from 'lucide-react'
import { useCanvasIndexedDB, DrawAction } from '../../../_shared/hooks/useCanvasIndexedDB'

/**
 * キャンバスベースの描画アプリケーションのDrawingコンポーネント。
 * このコンポーネントは、ユーザーがブラウザ上でインタラクティブに絵を描くことができる機能を提供します。
 * 主な機能には以下が含まれます：
 * - マウスを使用したフリーハンド描画
 * - 描画のアンドゥ（元に戻す）とリドゥ（やり直し）
 * - キャンバスのクリア
 * - IndexedDBを使用した描画データの永続化
 * 
 * このコンポーネントは、Next.jsのApp Routerと互換性があり、クライアントサイドでのみ動作します。
 *
 * @returns {JSX.Element} レンダリングされたDrawingコンポーネント
 */
export default function Drawing() {
  /**
   * キャンバス要素への参照
   * @type {React.RefObject<HTMLCanvasElement>}
   */
  const canvasRef = useRef<HTMLCanvasElement>(null)

  /**
   * ユーザーが現在描画中かどうかを追跡する状態
   * @type {boolean}
   */
  const [isDrawing, setIsDrawing] = useState(false)

  /**
   * 描画履歴を保存する状態
   * この状態は、ユーザーのすべての描画アクションを追跡し、アンドゥ/リドゥ機能を可能にします
   * @type {DrawAction | undefined}
   */
  const [drawHistory, setDrawHistory] = useState<DrawAction>()

  /**
   * やり直し履歴を保存する状態
   * この状態は、アンドゥされたアクションを追跡し、リドゥ機能を可能にします
   * @type {Array<{ points: Array<{ x: number; y: number }> }>}
   */
  const [redoHistory, setRedoHistory] = useState<Array<{ points: Array<{ x: number; y: number }> }>>([])

  /**
   * 現在の描画パスを保存する状態
   * この状態は、ユーザーが現在描画中のパスのポイントを追跡します
   * @type {Array<{ x: number; y: number }>}
   */
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([])

  /**
   * URLから検索パラメータを取得
   * @type {ReadonlyURLSearchParams}
   */
  const searchParams = useSearchParams()

  /**
   * 検索パラメータからdeliveryIdを取得、または'default'を使用
   * このIDは、IndexedDBでの保存に使用されます
   * @type {string}
   */
  const deliveryId = searchParams.get('deliveryId') || 'default'

  /**
   * 検索パラメータからuserIdを取得、または'default'を使用
   * このIDは、IndexedDBでの保存に使用されます
   * @type {string}
   */
  const userId = searchParams.get('userId') || 'default'

  /**
   * IndexedDB操作のためのカスタムフック
   * このフックは、描画データの保存、取得、更新、削除の機能を提供します
   */
  const { savePath, getAllPaths, clearAllPaths, updatePaths } = useCanvasIndexedDB(deliveryId, userId)

  /**
   * コンポーネントがマウントされたときにIndexedDBから保存されたパスを読み込むためのエフェクトフック
   * このフックは、ページがロードされたときに以前の描画を復元します
   */
  useEffect(() => {
    const loadPaths = async () => {
      const storedPaths = await getAllPaths()
      const limitedPaths = storedPaths.answers && storedPaths.answers.canvas && Array.isArray(storedPaths.answers.canvas.paths)
        ? {
            ...storedPaths,
            answers: {
              ...storedPaths.answers,
              canvas: {
                ...storedPaths.answers.canvas,
                paths: storedPaths.answers.canvas.paths.map(path => ({
                  ...path,
                  points: path.points.slice(0, 1000)
                }))
              }
            }
          }
        : { 
            answers: { 
              userId,
              deliveryId,
              canvas: { paths: [] } 
            } 
          } as DrawAction
      setDrawHistory(limitedPaths)
    }
    loadPaths()
  }, [getAllPaths, deliveryId, userId])

  /**
   * キャンバス上にすべてのパスを描画するコールバック関数
   * この関数は、現在の描画履歴と現在のパスに基づいてキャンバスを更新します
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

    const paths = drawHistory?.answers.canvas.paths
    if (Array.isArray(paths)) {
      paths.forEach((path, index) => {
        if (path && path.points) {
          console.log(`パス ${index + 1} のポイント数: ${path.points.length}`)
          drawSmoothPath(context, path.points)
        }
      })
    }

    // 現在のパスを描画し、その長さをログに出力
    if (currentPath.length > 1) {
      console.log(`現在のパスのポイント数: ${currentPath.length}`)
      drawSmoothPath(context, currentPath)
    }
  }, [drawHistory, currentPath])

  /**
   * キャンバス上に滑らかなパスを描画する関数
   * この関数は、与えられたポイントを使用して、スムーズな曲線を描画します
   * @param {CanvasRenderingContext2D} context - キャンバスの2D描画コンテキスト
   * @param {Array<{x: number, y: number}>} points - 描画するポイントの配列
   */
  const drawSmoothPath = (context: CanvasRenderingContext2D, points: Array<{ x: number; y: number }>) => {
    if (points.length < 2) return

    context.beginPath()
    context.moveTo(points[0].x, points[0].y)

    for (let i = 1; i < points.length - 2; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2
      const yc = (points[i].y + points[i + 1].y) / 2
      context.quadraticCurveTo(points[i].x, points[i].y, xc, yc)
    }

    if (points.length > 2) {
      context.quadraticCurveTo(
        points[points.length - 2].x,
        points[points.length - 2].y,
        points[points.length - 1].x,
        points[points.length - 1].y
      )
    } else {
      context.lineTo(points[points.length - 1].x, points[points.length - 1].y)
    }

    context.stroke()
  }

  /**
   * drawCanvas関数が変更されたときにキャンバスを再描画するためのエフェクトフック
   * このフックは、描画履歴や現在のパスが変更されるたびにキャンバスを更新します
   */
  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  /**
   * マウスが押されたときに描画を開始する関数
   * この関数は、新しいパスの開始点を設定し、描画状態をtrueに設定します
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
   * マウスが移動するにつれて描画を続ける関数
   * この関数は、現在のパスに新しいポイントを追加し、キャンバスを更新します
   * @param {React.MouseEvent<HTMLCanvasElement>} e - マウスイベント
   */
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setCurrentPath(prev => [...prev, { x, y }])
    drawCanvas()
  }

  /**
   * マウスが離されたかキャンバスから出たときに描画を停止する関数
   * この関数は、現在のパスを描画履歴に追加し、IndexedDBに保存します
   */
  const stopDrawing = async () => {
    if (currentPath.length > 1) {
      let limitedPath = currentPath
      if (currentPath.length > 1000) {
        const step = Math.floor(currentPath.length / 1000)
        limitedPath = currentPath.filter((_, index) => index % step === 0).slice(0, 1000)
      }
      const newPath = { points: limitedPath }
      setDrawHistory(prev => {
        if (!prev) return { 
          answers: { 
            userId,
            deliveryId,
            canvas: { paths: [] } 
          } 
        }
        const updatedHistory = {
          ...prev,
          answers: {
            ...prev.answers,
            canvas: {
              ...prev.answers.canvas,
              paths: [...prev.answers.canvas.paths, newPath]
            }
          }
        };
        console.log('更新された描画履歴:', updatedHistory);
        return updatedHistory;
      })
      setRedoHistory([])
      await savePath(newPath)
    }
    setCurrentPath([])
    setIsDrawing(false)
  }

  /**
   * キャンバス全体をクリアする関数
   * この関数は、キャンバスをクリアし、描画履歴とやり直し履歴をリセットします
   */
  const clearCanvas = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    context.clearRect(0, 0, canvas.width, canvas.height)
    setDrawHistory({ 
      answers: { 
        userId,
        deliveryId,
        canvas: { paths: [] } 
      } 
    })
    setRedoHistory([])
    await clearAllPaths()
  }

  /**
   * 最後の描画アクションを元に戻す関数
   * この関数は、描画履歴から最後のパスを削除し、やり直し履歴に追加します
   */
  const undo = async () => {
    if (drawHistory?.answers.canvas.paths.length === 0) return

    const lastPath = drawHistory?.answers.canvas.paths[drawHistory.answers.canvas.paths.length - 1]
    if (lastPath) {
      setRedoHistory(prev => [...prev, lastPath])
    }
    setDrawHistory(prev => {
      if (!prev) return prev;
      const newPaths = prev.answers.canvas.paths.slice(0, -1)
      updatePaths(newPaths)
      return {
        ...prev,
        answers: {
          ...prev.answers,
          canvas: {
            ...prev.answers.canvas,
            paths: newPaths.length > 0 ? newPaths : []
          }
        }
      }
    })
  }

  /**
   * 最後に元に戻したアクションをやり直す関数
   * この関数は、やり直し履歴から最後のパスを取り出し、描画履歴に追加します
   */
  const redo = async () => {
    if (redoHistory.length === 0) return
    
    const nextPath = redoHistory[redoHistory.length - 1]
    setDrawHistory(prev => {
      if (!prev) return prev;
      const newPaths = [...prev.answers.canvas.paths, nextPath]
      const newHistory = {
        ...prev,
        answers: {
          ...prev.answers,
          canvas: {
            ...prev.answers.canvas,
            paths: newPaths
          }
        }
      }
      updatePaths(newPaths)
      return newHistory
    })
    setRedoHistory(prev => prev.slice(0, -1))
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
          <Button onClick={undo} disabled={drawHistory?.answers.canvas.paths.length === 0}>
            <Undo className="w-4 h-4 mr-2" />
            元に戻す
          </Button>
          <Button onClick={redo} disabled={redoHistory.length === 0}>
            <Redo className="w-4 h-4 mr-2"   />
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