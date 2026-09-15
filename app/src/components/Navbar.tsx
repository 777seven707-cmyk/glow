import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

// Секция передаётся состоянием маршрута, а не хэшем: хэш занят роутером
// (HashRouter), и якорь вида /work#studio до страницы бы не доехал.
const LINKS: { label: string; to: string; section?: string }[] = [
  { label: 'Labs', to: '/work' },
  { label: 'Studio', to: '/work', section: 'studio' },
  { label: 'Openings', to: '/work', section: 'openings' },
  { label: 'Shop', to: '/work', section: 'shop' },
]

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  // Шапка прозрачная только на самом верху: ниже под неё заезжает контент
  // и текст накладывается на логотип и ссылки.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const goTo = (link: (typeof LINKS)[number]) => (event: React.MouseEvent) => {
    event.preventDefault()
    setIsMobileMenuOpen(false)
    navigate(link.to, { state: link.section ? { section: link.section } : undefined })
  }

  // Открытое меню перекрывает страницу целиком — прокрутку под ним глушим.
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  return (
    <>
      {/* Шапка и оверлей меню подняты над слоем контента (z-10):
          на z-[9] оверлей уходил под герой, а кнопка закрытия оставалась
          внутри контекста наложения шапки и переставала нажиматься. */}
      <header
        className={`fixed top-0 inset-x-0 z-30 px-5 sm:px-8 py-4 sm:py-5 flex flex-row justify-between items-center transition-colors duration-300 ${
          scrolled && !isMobileMenuOpen
            ? 'bg-white/85 backdrop-blur-sm'
            : 'bg-transparent'
        }`}
      >
        <Link to="/" className="flex flex-row gap-3 items-center">
          <span className="text-[21px] sm:text-[26px] tracking-tight text-black font-medium select-none">
            Mainframe&reg;
          </span>
          <span className="text-[25px] sm:text-[30px] text-black select-none tracking-[-0.02em] font-medium leading-none mb-1">
            &#10033;
          </span>
        </Link>

        <nav className="hidden md:flex flex-row text-[23px] text-black">
          {LINKS.map((link, i) => (
            <span key={link.label} className="flex flex-row">
              <Link
                to={link.to}
                onClick={goTo(link)}
                className="hover:opacity-60 transition-opacity"
              >
                {link.label}
              </Link>
              {i < LINKS.length - 1 && <span className="opacity-40">,&nbsp;</span>}
            </span>
          ))}
        </nav>

        <a
          href="#contact"
          className="hidden md:inline text-[23px] text-black underline underline-offset-2 hover:opacity-60 transition-opacity"
        >
          Get in touch
        </a>

        <button
          type="button"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          className="md:hidden relative flex flex-col justify-center gap-[5px] w-11 h-11 items-center"
        >
          <span
            className={`w-6 h-[2px] bg-black transition-all duration-300 ${
              isMobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''
            }`}
          />
          <span
            className={`w-6 h-[2px] bg-black transition-all duration-300 ${
              isMobileMenuOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`w-6 h-[2px] bg-black transition-all duration-300 ${
              isMobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''
            }`}
          />
        </button>
      </header>

      <div
        className={`md:hidden fixed inset-0 z-20 bg-white/95 backdrop-blur-sm flex flex-col justify-center gap-6 px-8 transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {LINKS.map((link) => (
          <Link
            key={link.label}
            to={link.to}
            onClick={goTo(link)}
            className="text-4xl tracking-tight text-black hover:opacity-60 transition-opacity"
          >
            {link.label}
          </Link>
        ))}
        <a
          href="#contact"
          onClick={() => setIsMobileMenuOpen(false)}
          className="text-4xl tracking-tight text-black underline underline-offset-4 hover:opacity-60 transition-opacity"
        >
          Get in touch
        </a>
      </div>
    </>
  )
}
