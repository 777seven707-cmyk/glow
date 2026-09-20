# components/kokonutui

Исходники компонентов из открытой библиотеки [KokonutUI](https://kokonutui.com)
(репозиторий [kokonut-labs/kokonutui](https://github.com/kokonut-labs/kokonutui),
лицензия MIT) — React + Tailwind CSS + shadcn/ui + Motion.

**Статический сайт из корня репозитория её не использует.** Как и папка
`components/ui`, эти файлы лежат здесь на случай переезда на React/Next.js —
см. раздел «Переезд на React + shadcn/ui» в корневом `README.md`.

## Что внутри

46 компонентов как есть из апстрима (кнопки, текстовые эффекты, карточки,
лоадеры, фоновые эффекты и т.д.) — полный список файлов см. в директории.

## Зависимости

Компоненты рассчитаны на проект с уже настроенными:
- Tailwind CSS
- `clsx` + `tailwind-merge` (утилита `cn()` из `lib/utils`)
- `motion` (Motion for React, бывший Framer Motion)
- `lucide-react` — иконки

Без сборки (Next.js/Vite) эти файлы не выполняются — так же, как и
`components/ui`.
