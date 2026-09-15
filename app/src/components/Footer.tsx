import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-[#F1F3F1] bg-white">
      <div className="max-w-7xl mx-auto px-6 py-14 flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-[21px] tracking-tight text-black font-medium">Mainframe&reg;</span>
            <span className="text-[25px] text-black tracking-[-0.02em] font-medium leading-none mb-1">
              &#10033;
            </span>
          </div>
          <p className="text-sm text-[#738273] mt-3 max-w-xs leading-relaxed">
            Студия бренда и цифровых продуктов. Работаем с командами по всему миру.
          </p>
        </div>

        <nav className="flex flex-col gap-2 text-sm">
          <Link to="/" className="text-[#1C2E1E] hover:opacity-60 transition-opacity py-1">
            Главная
          </Link>
          <Link to="/work" className="text-[#1C2E1E] hover:opacity-60 transition-opacity py-1">
            Работы
          </Link>
          <a
            href="mailto:hello@mainframe.studio"
            className="text-[#1C2E1E] underline underline-offset-2 hover:opacity-60 transition-opacity py-1"
          >
            hello@mainframe.studio
          </a>
        </nav>

        <p className="text-xs text-[#738273] tabular-nums">&copy; 2026 Mainframe&reg;</p>
      </div>
    </footer>
  )
}
