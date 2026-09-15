import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import Scene3D from '../components/Scene3D'

const PROJECTS = [
  { id: '01', title: 'Halo Commerce', tag: 'Brand · Digital', year: '2026',
    text: 'Визуальная система и витрина для марки премиальной оптики: 3D-конфигуратор оправ и сквозная типографика.' },
  { id: '02', title: 'Northwind Labs', tag: 'Digital', year: '2025',
    text: 'Сайт исследовательской лаборатории с интерактивной картой экспериментов и живой лентой публикаций.' },
  { id: '03', title: 'Solstice Festival', tag: 'Campaign', year: '2025',
    text: 'Кампания фестиваля: генеративные афиши, билетный флоу и анимированный лендинг с расписанием.' },
  { id: '04', title: 'Foundry Type', tag: 'Brand', year: '2024',
    text: 'Айдентика и спецификация шрифтовой студии — от логотипа до полного набора токенов дизайн-системы.' },
]

const STATS = [
  { value: '48', label: 'проектов выпущено' },
  { value: '12', label: 'стран у клиентов' },
  { value: '6', label: 'лет практики' },
  { value: '100', label: 'баллов Lighthouse' },
]

export default function Work() {
  return (
    <div className="relative z-10 w-full bg-white">
      <section className="relative w-full h-[80vh] min-h-[520px] overflow-hidden bg-[#FAFBF9]">
        <Scene3D />
        {/* Шторка слева, чтобы заголовок читался поверх 3D-сцены. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-r from-[#FAFBF9] via-[#FAFBF9]/85 to-transparent lg:to-40%"
        />
        <div className="relative z-[2] h-full max-w-7xl mx-auto px-6 flex flex-col justify-end pb-16 pointer-events-none">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-5xl md:text-6xl lg:text-[76px] font-normal tracking-tight text-black leading-[1.08] max-w-3xl"
          >
            Работы, которые
            <br /> держат форму.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-lg md:text-xl text-[#5A635A] leading-relaxed mt-6 max-w-xl"
          >
            Бренд, цифровые продукты и кампании. Ниже — избранное за последние два года.
          </motion.p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-y border-[#F1F3F1] py-10 mb-20">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
            >
              <div className="text-4xl md:text-5xl tracking-tight tabular-nums text-[#1C2E1E]">
                {stat.value}
              </div>
              <div className="text-sm text-[#738273] mt-2">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <ul className="flex flex-col">
          {PROJECTS.map((project, i) => (
            <motion.li
              key={project.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              className="group border-t border-[#F1F3F1] last:border-b"
            >
              <a
                href="#contact"
                className="flex flex-col md:flex-row md:items-center gap-4 md:gap-10 py-10 transition-colors duration-300 hover:bg-[#FAFBF9] md:px-4 md:-mx-4 rounded-2xl"
              >
                <span className="text-xs tabular-nums text-[#738273] md:w-12">{project.id}</span>
                <span className="text-3xl md:text-4xl tracking-tight text-black md:w-80">
                  {project.title}
                </span>
                <span className="text-[#5A635A] leading-relaxed flex-1 max-w-xl">
                  {project.text}
                </span>
                <span className="flex items-center gap-4 text-sm text-[#738273]">
                  {project.tag} · {project.year}
                  <ArrowUpRight className="w-5 h-5 text-[#1C2E1E] transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </span>
              </a>
            </motion.li>
          ))}
        </ul>

        <motion.div
          id="contact"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="mt-24 bg-[#1C2E1E] text-white rounded-3xl px-8 py-16 md:px-16 md:py-24"
        >
          <h2 className="text-4xl md:text-6xl tracking-tight leading-[1.08] max-w-2xl">
            Расскажите о проекте — ответим в течение дня.
          </h2>
          <Link
            to="/"
            className="inline-flex items-center gap-2 mt-10 text-sm uppercase tracking-[0.18em] text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Вернуться к форме
          </Link>
        </motion.div>
      </section>
    </div>
  )
}
