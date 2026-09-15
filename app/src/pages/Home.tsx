import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import BackgroundVideo from '../components/BackgroundVideo'
import Hero from '../components/Hero'
import Marquee from '../components/Marquee'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <>
      <BackgroundVideo />

      {/* Шторка под текстом: фон справа заходит на колонку с заголовком,
          и без неё пилюли и подписи теряют контраст. */}
      <div
        aria-hidden="true"
        className="hidden lg:block absolute inset-y-0 left-0 w-[70%] z-[5] pointer-events-none bg-gradient-to-r from-white via-white/95 to-transparent"
      />

      <div className="relative z-10 flex flex-col order-first lg:order-none w-full bg-white lg:bg-transparent pb-8 lg:pb-0 lg:min-h-screen">
        {/* Шапка зафиксирована — на узких экранах под неё нужен отступ,
            иначе заголовок уезжает под логотип. */}
        <div aria-hidden="true" className="h-16 shrink-0 lg:hidden" />
        <Hero />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="w-full max-w-7xl mx-auto px-6"
        >
          <Marquee />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="w-full max-w-7xl mx-auto px-6 pt-8 pb-10"
        >
          <Link
            to="/work"
            className="group inline-flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-[#1C2E1E] hover:opacity-60 transition-opacity"
          >
            Selected work in 3D
            <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1" />
          </Link>
        </motion.div>

        <div className="lg:hidden">
          <Footer />
        </div>
      </div>
    </>
  )
}
