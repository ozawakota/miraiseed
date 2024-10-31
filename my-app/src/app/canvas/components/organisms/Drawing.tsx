"use client"

import { useRef, useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Undo, Redo, Trash2 } from 'lucide-react'
import { useCanvasIndexedDB, DrawAction } from '../../../_shared/hooks/useCanvasIndexedDB'

export default function Drawing() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawHistory, setDrawHistory] = useState<DrawAction>()
  const [redoHistory, setRedoHistory] = useState<Array<{ points: Array<{ x: number; y: number }> }>>([])
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([])

  const searchParams = useSearchParams()
  const deliveryId = searchParams.get('deliveryId') || 'default'
  const userId = searchParams.get('userId') || 'default'

  const { savePath, getAllPaths, clearAllPaths, updatePaths } = useCanvasIndexedDB(deliveryId, userId)

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
          console.log(`Path ${index + 1} points length: ${path.points.length}`)
          drawSmoothPath(context, path.points)
        }
      })
    }

    // 現在描画中のパスも描画し、長さをログに出力
    if (currentPath.length > 1) {
      console.log(`Current path points length: ${currentPath.length}`)
      drawSmoothPath(context, currentPath)
    }
  }, [drawHistory, currentPath])

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

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setCurrentPath([{ x, y }])
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setCurrentPath(prev => {
      const newPath = [...prev, { x, y }]
      return newPath.slice(-1000) // 最新の1000ポイントのみを保持
    })
    drawCanvas()
  }

  const stopDrawing = async () => {
    if (currentPath.length > 1) {
      const limitedPath = currentPath.slice(0, 1000) // 1000ポイントまでに制限
      const newPath = { points: limitedPath }
      setDrawHistory(prev => {
        if (!prev) return { 
          answers: { 
            userId,
            deliveryId,
            canvas: { paths: [] } 
          } 
        }
        return {
          ...prev,
          answers: {
            ...prev.answers,
            canvas: {
              ...prev.answers.canvas,
              paths: [...prev.answers.canvas.paths, newPath]
            }
          }
        }
      })
      setRedoHistory([])
      await savePath(newPath)
    }
    setCurrentPath([])
    setIsDrawing(false)
  }

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