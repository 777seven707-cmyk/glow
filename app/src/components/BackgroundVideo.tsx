import { useEffect, useRef } from 'react'

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260601_110537_3a579fa0-7bbc-4d94-9d25-0e816c7840f5.mp4'

const DESKTOP_MIN_WIDTH = 1024
/** Полный проход мыши по экрану прокручивает 80% ролика. */
const SCRUB_FACTOR = 0.8

export default function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null)

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
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className="w-full h-full object-cover object-right lg:object-right-bottom"
      />
    </div>
  )
}
