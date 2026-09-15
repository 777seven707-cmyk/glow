import { useEffect, useRef } from 'react'

const ROWS = 26
const COLS = 34
const INK = '28, 46, 30'

/**
 * Сетка в перспективе, по которой бежит волна. Точки считаются в нормальных
 * координатах и проецируются делением на глубину — дальние ряды сходятся
 * к горизонту и становятся бледнее.
 *
 * Рисуется линиями, а не заливками: на светлом фоне это читается как
 * графика, а не как размытое пятно, и стоит дешевле любого блюра.
 * Это же полотно работает запасным фоном, когда ролик с CDN недоступен.
 */
export default function WaveField({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const pointer = useRef({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let width = 0
    let height = 0
    let dpr = 1
    let raf = 0
    let running = true

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = Math.max(1, rect.width)
      height = Math.max(1, rect.height)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    /** Проекция узла сетки: z растёт вглубь, x и y делятся на глубину. */
    const project = (u: number, v: number, time: number) => {
      const depth = 0.55 + v * 2.6
      const sway = (pointer.current.x - 0.5) * 0.5
      const wave =
        Math.sin(u * 3.1 + time * 0.0007 + v * 2.2) * 0.06 +
        Math.cos(v * 5.5 - time * 0.0011) * 0.035 +
        (pointer.current.y - 0.5) * 0.06 * (1 - v)

      return {
        x: width * (0.5 + ((u - 0.5) * 1.45 + sway * (1 - v)) / depth),
        y: height * (0.46 + (wave - v * 0.2) / (depth * 0.5)),
        fade: Math.max(0, 1 - v * 1.15),
      }
    }

    const draw = (time: number) => {
      if (width < 2 || height < 2) {
        if (running && !reduced) raf = requestAnimationFrame(draw)
        return
      }

      pointer.current.x += (pointer.current.tx - pointer.current.x) * 0.05
      pointer.current.y += (pointer.current.ty - pointer.current.y) * 0.05

      ctx.clearRect(0, 0, width, height)
      ctx.lineWidth = 1

      // Поперечные линии — горизонты волны.
      for (let r = 0; r < ROWS; r++) {
        const v = r / (ROWS - 1)
        ctx.beginPath()
        for (let c = 0; c < COLS; c++) {
          const point = project(c / (COLS - 1), v, time)
          if (c === 0) ctx.moveTo(point.x, point.y)
          else ctx.lineTo(point.x, point.y)
        }
        ctx.strokeStyle = `rgba(${INK}, ${0.07 + (1 - v) * 0.4})`
        ctx.stroke()
      }

      // Продольные — задают перспективу и глубину кадра.
      for (let c = 0; c < COLS; c += 2) {
        const u = c / (COLS - 1)
        ctx.beginPath()
        for (let r = 0; r < ROWS; r++) {
          const point = project(u, r / (ROWS - 1), time)
          if (r === 0) ctx.moveTo(point.x, point.y)
          else ctx.lineTo(point.x, point.y)
        }
        ctx.strokeStyle = `rgba(${INK}, 0.16)`
        ctx.stroke()
      }

      // Узлы на ближних рядах — акцент, который ловит глаз.
      for (let r = 0; r < ROWS; r += 3) {
        const v = r / (ROWS - 1)
        for (let c = 0; c < COLS; c += 3) {
          const point = project(c / (COLS - 1), v, time)
          if (point.fade <= 0.05) continue
          ctx.fillStyle = `rgba(77, 109, 71, ${point.fade * 0.85})`
          ctx.beginPath()
          ctx.arc(point.x, point.y, 2 * point.fade + 0.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      if (running && !reduced) raf = requestAnimationFrame(draw)
    }

    const onPointerMove = (e: PointerEvent) => {
      pointer.current.tx = e.clientX / window.innerWidth
      pointer.current.ty = e.clientY / window.innerHeight
    }

    // Вне экрана цикл простаивает.
    const observer = new IntersectionObserver(([entry]) => {
      running = entry.isIntersecting
      cancelAnimationFrame(raf)
      if (running) raf = requestAnimationFrame(draw)
    })

    resize()
    observer.observe(canvas)
    // Высота полотна задаётся aspect-ratio контейнера и на момент монтирования
    // ещё равна нулю — без наблюдателя canvas оставался размером 1×1 и
    // растягивался в серое пятно.
    const sizeObserver = new ResizeObserver(resize)
    sizeObserver.observe(canvas)
    raf = requestAnimationFrame(draw)
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onPointerMove)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      sizeObserver.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />
}
