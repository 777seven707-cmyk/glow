import { useEffect } from 'react'
import { motion } from 'motion/react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import Scene3D from '../components/Scene3D'
import Footer from '../components/Footer'

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

const TEAM = [
  { name: 'Ирина Соколова', role: 'Креативный директор' },
  { name: 'Марк Вейл', role: 'Дизайн-лид' },
  { name: 'Анна Реут', role: 'Продуктовый дизайнер' },
  { name: 'Дмитрий Кан', role: 'Инженер интерфейсов' },
]

const OPENINGS = [
  { title: 'Motion-дизайнер', type: 'Полная занятость · Удалённо' },
  { title: 'Frontend-инженер (React, WebGL)', type: 'Полная занятость · Гибрид' },
  { title: 'Стажёр-дизайнер', type: 'Стажировка · 6 месяцев' },
]

const SHOP = [
  { title: 'Mainframe Type', price: '$90', note: 'Гротеск студии, 4 начертания' },
  { title: 'Grid Poster Set', price: '$40', note: 'Три постера, печать A2' },
  { title: 'Shader Pack', price: '$25', note: 'Двенадцать GLSL-заготовок' },
]

/** Общий заголовок секции: номер + название, как в технической документации. */
function SectionHeading({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4 mb-10">
      <span className="text-xs tabular-nums text-[#738273]">{index}</span>
      <h2 className="text-3xl md:text-4xl tracking-tight text-black">{title}</h2>
    </div>
  )
}

export default function Work() {
  const { state } = useLocation()

  // Ссылки в шапке передают секцию состоянием маршрута — прокручиваем к ней
  // после отрисовки. Плавность берётся из scroll-behavior в index.css.
  useEffect(() => {
    const section = (state as { section?: string } | null)?.section
    if (!section) return
    const target = document.getElementById(section)
    if (target) target.scrollIntoView({ block: 'start' })
  }, [state])

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

        <section id="studio" className="scroll-mt-28 pt-24">
          <SectionHeading index="01" title="Студия" />
          <p className="text-lg md:text-xl text-[#5A635A] leading-relaxed max-w-2xl mb-12">
            Небольшая команда: стратег, два дизайнера и инженер. Беремся за проект целиком —
            от позиционирования до продакшена, без передачи подрядчикам на середине пути.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
            {TEAM.map((person, i) => (
              <motion.div
                key={person.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="border-t border-[#F1F3F1] pt-5"
              >
                <div className="text-xl tracking-tight text-black">{person.name}</div>
                <div className="text-sm text-[#738273] mt-1">{person.role}</div>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="openings" className="scroll-mt-28 pt-24">
          <SectionHeading index="02" title="Вакансии" />
          <ul className="flex flex-col">
            {OPENINGS.map((opening, i) => (
              <motion.li
                key={opening.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="group border-t border-[#F1F3F1] last:border-b"
              >
                <a
                  href="mailto:hello@mainframe.studio"
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-7 md:px-4 md:-mx-4 rounded-2xl transition-colors duration-300 hover:bg-[#FAFBF9]"
                >
                  <span className="text-2xl md:text-3xl tracking-tight text-black">
                    {opening.title}
                  </span>
                  <span className="flex items-center gap-4 text-sm text-[#738273]">
                    {opening.type}
                    <ArrowUpRight className="w-5 h-5 text-[#1C2E1E] transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </span>
                </a>
              </motion.li>
            ))}
          </ul>
        </section>

        <section id="shop" className="scroll-mt-28 pt-24">
          <SectionHeading index="03" title="Магазин" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SHOP.map((item, i) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                whileHover={{ y: -4 }}
                className="flex flex-col justify-between gap-10 bg-[#FAFBF9] border border-[#F1F3F1] rounded-3xl p-8 min-h-56"
              >
                <div>
                  <h3 className="text-2xl tracking-tight text-black">{item.title}</h3>
                  <p className="text-sm text-[#738273] mt-2 leading-relaxed">{item.note}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl tabular-nums text-[#1C2E1E]">{item.price}</span>
                  <span className="text-xs uppercase tracking-[0.18em] text-[#4D6D47]">
                    Купить
                  </span>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <motion.div
          id="contact"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="scroll-mt-28 mt-24 bg-[#1C2E1E] text-white rounded-3xl px-8 py-16 md:px-16 md:py-24"
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

      <Footer />
    </div>
  )
}
