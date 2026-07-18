import { useEffect, useRef } from 'react'

const PULL_THRESHOLD_PX = 70

/** Minimal pull-to-refresh: dragging down from the very top of the page
 * (window.scrollY === 0) past a threshold fires onRefresh once per
 * gesture. Listens on window since Feed/Discover scroll the whole page,
 * not an inner container. */
export function usePullToRefresh(onRefresh: () => void, enabled: boolean) {
  const startY = useRef<number | null>(null)
  const triggeredRef = useRef(false)
  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh

  useEffect(() => {
    if (!enabled) return

    const onTouchStart = (e: TouchEvent) => {
      startY.current = window.scrollY <= 0 ? e.touches[0].clientY : null
      triggeredRef.current = false
    }
    const onTouchMove = (e: TouchEvent) => {
      if (startY.current === null || triggeredRef.current) return
      const delta = e.touches[0].clientY - startY.current
      if (delta > PULL_THRESHOLD_PX) {
        triggeredRef.current = true
        onRefreshRef.current()
      }
    }
    const onTouchEnd = () => {
      startY.current = null
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [enabled])
}
