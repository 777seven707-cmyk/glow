const ITEMS = [
  'Brand systems',
  'Digital products',
  'Campaigns',
  'Motion',
  'WebGL',
  'Art direction',
  'Type design',
]

/**
 * Бегущая строка: лента продублирована, вторая копия начинает ровно там, где
 * кончается первая, поэтому сдвиг на -50% замыкается без стыка.
 * Анимация объявлена на контейнере — один композитный слой вместо копий.
 */
export default function Marquee() {
  const row = [...ITEMS, ...ITEMS]

  return (
    <div className="relative overflow-hidden rounded-full border border-[#F1F3F1] bg-white/70 backdrop-blur-sm py-4 select-none">
      <div className="flex w-max gap-10 animate-[marquee_38s_linear_infinite] motion-reduce:animate-none">
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-10 text-sm uppercase tracking-[0.2em] text-[#738273]">
            {item}
            <span className="text-[#C7CDC1]">&#10033;</span>
          </span>
        ))}
      </div>
      {/* Края растворяются, чтобы лента не обрывалась на границе экрана. */}
      {/* Края растворяются в подложку самой ленты, а не в белый фон страницы:
          на главной под лентой идёт цветной фон. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white/95 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white/95 to-transparent" />
    </div>
  )
}
