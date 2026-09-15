import { motion } from 'motion/react'
import { useTypewriter } from '../hooks/useTypewriter'
import ServicePills from './ServicePills'

export default function Hero() {
  const { displayed, done } = useTypewriter("we'd love to\nhear from you!")

  return (
    <main
      id="spade-hero"
      className="w-full max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-5xl md:text-6xl lg:text-[76px] font-normal tracking-tight text-black leading-[1.08] mb-8 select-none w-full whitespace-pre-wrap">
          {displayed}
          {!done && (
            <span className="inline-block w-[2px] h-[1.1em] bg-black align-middle ml-[2px] animate-blink" />
          )}
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <p className="text-lg md:text-xl text-[#5A635A] leading-relaxed font-normal mb-14 max-w-2xl">
          Whether you have questions, feedback, <br /> drop us a message and we&rsquo;ll get back to
          you as soon as possible.
        </p>
      </motion.div>

      <motion.div
        id="contact"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <ServicePills />
      </motion.div>
    </main>
  )
}
