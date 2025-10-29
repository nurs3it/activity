import { useEffect, useRef } from "react"

export function useAutoRefresh(callback: () => void, intervalMs: number = 30000) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const interval = setInterval(() => {
      callbackRef.current()
    }, intervalMs)

    return () => clearInterval(interval)
  }, [intervalMs])
}
