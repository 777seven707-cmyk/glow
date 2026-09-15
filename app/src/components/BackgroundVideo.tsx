import { useEffect, useRef, useState } from 'react'
import WaveField from './WaveField'
import LiquidCanvas from './LiquidCanvas'

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260601_110537_3a579fa0-7bbc-4d94-9d25-0e816c7840f5.mp4'

const DESKTOP_MIN_WIDTH = 1024
/** Полный проход мыши по экрану прокручивает 80% ролика. */
const SCRUB_FACTOR = 0.8

export default function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [videoFailed, setVideoFailed] = useState(false)

  // Ролик лежит на внешнем CDN: он может не открыться из-за сети, блокировщика
  // или корпоративного прокси. Тогда вместо белого пятна показываем живой
  // градиент — без него правая половина первого экрана оставалась пустой.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const fail = () => setVideoFailed(true)
    const ok = () => setVideoFailed(false)
    video.addEventListener('error', fail)
    video.addEventListener('loadeddata', ok)

    const timer = setTimeout(() => {
      if (video.readyState < 2) setVideoFailed(true)
    }, 4000)

    return () => {
      clearTimeout(timer)
      video.removeEventListener('error', fail)
      video.removeEventListener('loadeddata', ok)
    }
  }, [])

  // Десктоп: скраб кадра мышью. Курсор вправо — вперёд, влево — назад.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let prevX: number | null = null
    let targetTime = 0
    let seeking = false

    const applySeek = () => {
      if (seeking || !video.duration) return
      if (Math.abs(video.currentTime - targetTime) < 0.001) return
      seeking = true
      video.currentTime = targetTime
    }

    const onSeeked = () => {
      seeking = false
      applySeek()
    }

    const onMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < DESKTOP_MIN_WIDTH) return
      const duration = video.duration
      if (!duration || Number.isNaN(duration)) return

      if (prevX === null) {
        prevX = e.clientX
        targetTime = video.currentTime
        return
      }

      const delta = e.clientX - prevX
      prevX = e.clientX

      targetTime += (delta / window.innerWidth) * SCRUB_FACTOR * duration
      targetTime = Math.min(Math.max(targetTime, 0), duration)
      applySeek()
    }

    video.addEventListener('seeked', onSeeked)
    window.addEventListener('mousemove', onMouseMove)
    return () => {
      video.removeEventListener('seeked', onSeeked)
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  // Мобильные: скраба нет, поэтому просто крутим ролик по кругу.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (window.innerWidth >= DESKTOP_MIN_WIDTH) return

    video.autoplay = true
    video.loop = true
    const play = () => {
      const started = video.play()
      if (started) started.catch(() => {})
    }
    play()
    video.addEventListener('loadeddata', play)
    return () => video.removeEventListener('loadeddata', play)
  }, [])

  return (
    <div className="order-last lg:order-none relative lg:absolute lg:inset-0 lg:z-0 overflow-hidden pointer-events-none w-full aspect-square md:aspect-video lg:aspect-auto lg:h-full bg-neutral-50 lg:bg-transparent">
      {/* На десктопе полотно прижато вправо и занимает чуть больше половины
          экрана — ровно как кадр видео с object-right. Растянутое на всю
          ширину, оно проступало под заголовком. */}
      <div
        className={`absolute inset-y-0 right-0 w-full lg:w-[58%] transition-opacity duration-700 ${
          videoFailed ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Мягкая подложка задаёт цвет, сетка сверху — рисунок. */}
        <LiquidCanvas className="absolute inset-0 w-full h-full opacity-30" />
        <WaveField className="absolute inset-0 w-full h-full" />
      </div>
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className={`relative w-full h-full object-cover object-right lg:object-right-bottom transition-opacity duration-700 ${
          videoFailed ? 'opacity-0' : 'opacity-100'
        }`}
      />
      {/* Зерно поверх фона: убирает полосатость градиента на больших площадях. */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 w-full lg:w-[58%] opacity-[0.16] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  )
}
