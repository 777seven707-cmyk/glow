import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check } from 'lucide-react'

const OPTIONS = ['Brand', 'Digital', 'Campaign', 'Other']

export default function ServicePills() {
  const [services, setServices] = useState<string[]>([])

  const toggle = (option: string) =>
    setServices((current) =>
      current.includes(option) ? current.filter((s) => s !== option) : [...current, option],
    )

  return (
    <div className="w-full">
      <h2 className="text-2xl font-medium tracking-tight mb-2">What sort of service?</h2>
      <p className="opacity-85 text-[#738273] mb-8">Select all that apply</p>

      <div className="flex flex-wrap gap-3">
        {OPTIONS.map((option) => {
          const active = services.includes(option)
          return (
            <motion.button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`flex items-center gap-2 rounded-full px-6 py-3 text-base transition-colors duration-200 ${
                active
                  ? 'bg-[#1C2E1E] text-white shadow-md shadow-emerald-950/5 transform'
                  : 'bg-white text-[#1C2E1E] border border-[#F1F3F1] hover:bg-[#F1F3F1]/55'
              }`}
            >
              <AnimatePresence initial={false}>
                {active && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0, y: -6 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="inline-flex"
                  >
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                  </motion.span>
                )}
              </AnimatePresence>
              {option}
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {services.length === 0 ? (
          <motion.p
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="italic text-xs mt-6 text-[#1C2E1E]"
          >
            Please click to select services above.
          </motion.p>
        ) : (
          <motion.div
            key="banner"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            className="overflow-hidden"
          >
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAFBF9] border border-[#F1F3F1] rounded-2xl px-5 py-4">
              <p className="text-sm text-[#1C2E1E]">
                Ready to inquire about: <span className="font-medium">{services.join(', ')}</span>
              </p>
              <button
                type="button"
                className="group flex items-center gap-2 text-[#4D6D47] uppercase text-xs tracking-wide font-medium"
              >
                Let&rsquo;s Go
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
