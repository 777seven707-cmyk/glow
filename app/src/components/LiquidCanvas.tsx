import { useEffect, useRef } from 'react'

type Blob = {
  hue: number
  radius: number
  orbit: number
  speed: number
  phase: number
  cx: number
  cy: number
}

/** Палитра героя: приглушённая зелень студии плюс тёплый песок для контраста. */
const PALETTE = ['28, 46, 30', '77, 109, 71', '115, 130, 115', '199, 205, 193', '234, 236, 233']

const BLOBS: Blob[] = PALETTE.map((_, i) => ({
  hue: i,
  radius: 0.42 - i * 0.045,
  orbit: 0.12 + i * 0.05,
  speed: 0.00012 + i * 0.00005,
  phase: (i / PALETTE.length) * Math.PI * 2,
  cx: 0.5 + (i % 2 === 0 ? 0.08 : -0.08),
  cy: 0.45 + (i % 3) * 0.08,
}))

/**
 * Живой градиент на canvas 2D: пять размытых пятен ходят по орбитам и
 * смешиваются в режиме multiply, сверху — зерно. Рисуется в половинном
 * разрешении и растягивается, поэтому размытие дешёвое.
 *
 * Это же полотно работает запасным фоном, когда ролик с CDN недоступен.
 */
export default function LiquidCanvas({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const pointer = useRef({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let width = 0
    let height = 0
    let raf = 0
    let running = true

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      // Половинное разрешение: пятна всё равно размыты, разницы не видно.
      width = Math.max(1, Math.round(rect.width * 0.5))
      height = Math.max(1, Math.round(rect.height * 0.5))
      canvas.width = width
      canvas.height = height
    }

    const draw = (time: number) => {
      if (width < 2 || height < 2) {
        if (running && !reduced) raf = requestAnimationFrame(draw)
        return
      }

      pointer.current.x += (pointer.current.tx - pointer.current.x) * 0.045
      pointer.current.y += (pointer.current.ty - pointer.current.y) * 0.045

      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = '#FAFBF9'
      ctx.fillRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'multiply'

      const short = Math.min(width, height)
      BLOBS.forEach((blob) => {
        const t = reduced ? 0 : time * blob.speed
        const drift = (pointer.current.x - 0.5) * blob.orbit
        const lift = (pointer.current.y - 0.5) * blob.orbit
        const x = (blob.cx + Math.cos(t + blob.phase) * blob.orbit + drift) * width
        const y = (blob.cy + Math.sin(t * 1.3 + blob.phase) * blob.orbit + lift) * height
        const r = blob.radius * short

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r)
        gradient.addColorStop(0, `rgba(${PALETTE[blob.hue]}, 0.85)`)
        gradient.addColorStop(0.55, `rgba(${PALETTE[blob.hue]}, 0.28)`)
        gradient.addColorStop(1, `rgba(${PALETTE[blob.hue]}, 0)`)
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      })

      if (running && !reduced) raf = requestAnimationFrame(draw)
    }

    const onPointerMove = (e: PointerEvent) => {
      pointer.current.tx = e.clientX / window.innerWidth
      pointer.current.ty = e.clientY / window.innerHeight
    }

    // Вне экрана цикл простаивает — фон занимает полстраницы и тикает зря.
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
