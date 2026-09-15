import { useEffect, useRef, useState } from 'react'

/**
 * Счётчик, который считает от нуля до target, когда блок появляется в кадре.
 * Ход задан ease-out — числа быстро набирают и мягко останавливаются.
 */
export function useCountUp(target: number, duration = 1400) {
  // Тем, кто просил меньше движения, число показывается сразу готовым.
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const ref = useRef<HTMLSpanElement | null>(null)
  const [value, setValue] = useState(reduced ? target : 0)

  useEffect(() => {
    const node = ref.current
    if (!node || reduced) return

    let raf = 0
    let start = 0

    const step = (time: number) => {
      if (!start) start = time
      const progress = Math.min((time - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) raf = requestAnimationFrame(step)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        raf = requestAnimationFrame(step)
      },
      { threshold: 0.5 },
    )

    observer.observe(node)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [target, duration, reduced])

  return { ref, value }
}
