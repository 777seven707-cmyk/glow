import { useEffect, useState } from 'react'

export type TypewriterState = { displayed: string; done: boolean }

/**
 * Печатает строку посимвольно: пауза startDelay, затем по символу каждые speed мс.
 * Возвращает текущий срез и признак завершения.
 */
export function useTypewriter(text: string, speed = 38, startDelay = 600): TypewriterState {
  // Тем, кто просил меньше движения, строка показывается сразу целиком.
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const [displayed, setDisplayed] = useState(reduced ? text : '')
  const [done, setDone] = useState(reduced)

  useEffect(() => {
    // Начальное состояние уже содержит готовую строку — печатать нечего.
    if (reduced) return

    let interval: ReturnType<typeof setInterval> | undefined
    const timeout = setTimeout(() => {
      // Сброс сделан здесь, а не синхронно в эффекте: при монтировании
      // состояние и так пустое, а лишний setState в теле эффекта запускает
      // каскадный рендер.
      setDisplayed('')
      setDone(false)
      let i = 0
      interval = setInterval(() => {
        i += 1
        setDisplayed(text.slice(0, i))
        if (i >= text.length) {
          clearInterval(interval)
          setDone(true)
        }
      }, speed)
    }, startDelay)

    return () => {
      clearTimeout(timeout)
      if (interval) clearInterval(interval)
    }
  }, [text, speed, startDelay, reduced])

  return { displayed, done }
}
