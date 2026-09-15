import { useEffect, useState } from 'react'

export type TypewriterState = { displayed: string; done: boolean }

/**
 * Печатает строку посимвольно: пауза startDelay, затем по символу каждые speed мс.
 * Возвращает текущий срез и признак завершения.
 */
export function useTypewriter(text: string, speed = 38, startDelay = 600): TypewriterState {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
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
  }, [text, speed, startDelay])

  return { displayed, done }
}
