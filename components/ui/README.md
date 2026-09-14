# components/ui

Папка для React-компонентов в формате shadcn/ui.

**Статический сайт из корня репозитория её не использует.** Эффект liquid glass
на живом сайте реализован на ванильном CSS: класс `.btn--glass` и SVG-фильтр
`#container-glass` в `index.html`.

Файл `liquid-glass-button.tsx` лежит здесь на случай переезда на React/Next.js.
Чтобы он заработал, нужны Tailwind, TypeScript и утилита `cn` — см. раздел
«Переезд на React + shadcn/ui» в корневом `README.md`.
