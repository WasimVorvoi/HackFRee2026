import { useState, useEffect } from "react"

const MIN_LOADING_TIME = 1500 // 1.5 seconds - one full animation cycle

export function useMinLoading(isLoading: boolean): boolean {
  const [showLoader, setShowLoader] = useState(true)
  const [loadStartTime] = useState(() => Date.now())

  useEffect(() => {
    if (!isLoading) {
      const elapsed = Date.now() - loadStartTime
      const remaining = MIN_LOADING_TIME - elapsed

      if (remaining > 0) {
        const timer = setTimeout(() => {
          setShowLoader(false)
        }, remaining)
        return () => clearTimeout(timer)
      } else {
        setShowLoader(false)
      }
    }
  }, [isLoading, loadStartTime])

  return showLoader
}
