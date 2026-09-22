# components/ui

Папка для React-компонентов в формате shadcn/ui.

**Статический сайт из корня репозитория её не использует.** Компоненты лежат
здесь на случай переезда на React/Next.js — как это сделать, описано
в разделе «Переезд на React + shadcn/ui» корневого `README.md`.

## Что внутри

```
black-hole.tsx                  компонент-обёртка: канвас + жизненный цикл
black-hole-utils/renderer.ts    создание контекста, цикл кадров, dispose
black-hole-utils/shader.ts      вершинный и фрагментный шейдеры
liquid-glass-button.tsx         кнопки LiquidButton и MetalButton
background-paths.tsx            летящие линии + заголовок по буквам
background-paths-demo.tsx       демо к нему
button.tsx                      Button из shadcn/ui
splite.tsx                      SplineScene — ленивая загрузка 3D-сцены
spotlight.tsx                   Spotlight — пятно света за курсором
card.tsx                        Card из shadcn/ui
spline-scene-basic.tsx          демо: Card + Spotlight + SplineScene
```

Все файлы проверены `tsc --strict` — ошибок нет.

## black-hole

Компонент пришёл без модуля `black-hole-utils/renderer`, на который ссылается,
поэтому рендерер написан заново — на основе шейдера, который раньше работал
на живом сайте. Сайт с тех пор сменил тему на светлую («HAVN»), и
`assets/js/blackhole.js` в текущей версии удалён; этот React-компонент —
единственное место в репозитории, где шейдер ещё живёт.

```tsx
import BlackHole from "@/components/ui/black-hole";

export default function Page() {
  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-black">
      <BlackHole />
    </div>
  );
}
```

`createRenderer` принимает необязательные настройки и возвращает три вещи:

| Поле | Что делает |
|------|------------|
| `ready` | промис, разрешается после первого кадра, отклоняется если WebGL недоступен |
| `setSpin(v)` | задать скорость вращения вручную |
| `dispose()` | остановить цикл, снять слушатели, освободить ресурсы WebGL |

```ts
createRenderer({
  canvas,
  scale: 0.75,        // доля разрешения, в которой считается кадр
  steps: 150,         // шагов трассировки
  spin: 1,            // скорость вращения в покое
  spinOnHover: 4.5,   // скорость при наведении, 0 отключает реакцию
});
```

Родителю канваса нужна заданная высота — компонент растягивается на `h-full`.
В демо это делает `fixed inset-0 h-screen`.

**Важно про `steps`.** Длина пути луча считается как `21.5 / steps`, чтобы
при снижении качества луч всё равно доходил до дыры. Если менять шаг
интегрирования на фиксированный, при малом числе шагов картинка разваливается
в смазанную полосу — луч просто не долетает. Это уже было поймано на проверке.

Проверено: `tsc --strict` без ошибок, кадр отрисовывается, `dispose()` чистый.


## splite / spotlight / card

```bash
npm i @splinetool/runtime @splinetool/react-spline framer-motion
```

```tsx
import { SplineSceneBasic } from "@/components/ui/spline-scene-basic";
```

### Что пришлось поправить

В присланном демо `Spotlight` получал проп `fill="white"`, которого у этого
компонента нет — он от другого «спотлайта» (Aceternity, там пятно рисуется
через SVG). Сборка падала на типах. Проп убран: цвет у ibelick-версии задаётся
классами градиента `from-zinc-50 via-zinc-100 to-zinc-200`, то есть пятно
и так практически белое.

### На что обратить внимание

**Класс `loader` в заглушке.** `splite.tsx` показывает `<span className="loader">`,
пока грузится сцена. В Tailwind такого класса нет — без своего CSS заглушка
будет пустой. Добавьте в `globals.css`:

```css
.loader {
  width: 32px;
  height: 32px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: #fff;
  border-radius: 50%;
  animation: loader-spin 0.8s linear infinite;
}
@keyframes loader-spin { to { transform: rotate(360deg); } }
```

**Card тянет переменные темы.** Классы `bg-card` и `text-card-foreground`
объявляются в `globals.css`, который создаёт `shadcn init`. Без него карточка
останется прозрачной.

**Сцена грузится с чужого сервера.** `prod.spline.design` отдаёт `.splinecode`
в рантайме, плюс сам рантайм Spline весит несколько мегабайт. Для продакшена
стоит выгрузить сцену к себе и заменить URL, иначе первый экран зависит
от доступности стороннего домена.

**Слушатели в Spotlight не снимаются.** В `useEffect` подписка идёт на
`() => setIsHovered(true)`, а в очистке `removeEventListener` получает
*новую* стрелочную функцию — то есть не снимает ничего. Практический вред
небольшой: слушатели висят на родительском элементе и умирают вместе с ним.
Но если `Spotlight` размонтируется, а родитель остаётся, подписки переживут
компонент. Код оставлен как в оригинале, чтобы не расходиться с апстримом.
Если нужно починить — вынесите обработчики в переменные:

```tsx
const onEnter = () => setIsHovered(true);
const onLeave = () => setIsHovered(false);
parentElement.addEventListener('mouseenter', onEnter);
parentElement.addEventListener('mouseleave', onLeave);
return () => {
  parentElement.removeEventListener('mousemove', handleMouseMove);
  parentElement.removeEventListener('mouseenter', onEnter);
  parentElement.removeEventListener('mouseleave', onLeave);
};
```


## background-paths

```bash
npm i framer-motion @radix-ui/react-slot class-variance-authority
```

```tsx
import { BackgroundPaths } from "@/components/ui/background-paths";

<BackgroundPaths title="Сайты, которые приносят деньги" />
```

Геометрия проверена отрисовкой: два встречных пучка по 36 кривых, вместе
дают перекрещивающийся поток линий. Координаты путей выходят далеко за
`viewBox` (по x от −555 до 859 при ширине 696) — так и задумано, в кадр
попадает только средняя часть, за счёт этого линии «влетают» и «вылетают».

### Это не фон, а целая секция

Несмотря на название, компонент — готовый первый экран: `min-h-screen`,
свой заголовок по буквам и кнопка «Discover Excellence». Просто подложить
его под свой контент не получится.

Если нужны только линии, внутренняя функция `FloatingPaths` подойдёт,
но она не экспортируется — добавьте `export` перед `function FloatingPaths`
и используйте её отдельно.

### На что обратить внимание

**Заголовок внутри SVG читают скринридеры.** Тег `<title>Background Paths</title>`
озвучивается вслух, хотя это чисто декоративная графика. Уберите его,
а самому `<svg>` поставьте `aria-hidden="true"`.

**Движение не отключается.** 72 линии анимируются бесконечно, без оглядки
на системную настройку «уменьшить движение». Оберните в проверку:

```tsx
const reduced = useReducedMotion();   // из framer-motion
// ...
animate={reduced ? undefined : { pathLength: 1, opacity: [0.3, 0.6, 0.3], pathOffset: [0, 1, 0] }}
```

**Нагрузка.** 36 путей × 2 пучка = 72 бесконечные анимации, каждая меняет
`stroke-dasharray` и `stroke-dashoffset` — это перерисовка всего SVG каждый
кадр. На слабых машинах заметно. Если тормозит, уменьшите `length: 36`.

**Длительность пересчитывается при каждом рендере.** `duration: 20 + Math.random() * 10`
стоит прямо в теле компонента, поэтому любой повторный рендер родителя
перезапустит все 72 анимации с новыми значениями. Вынесите массив `paths`
в `useMemo(() => ..., [position])`.

**Поле `color` в массиве `paths` не используется** — цвет берётся из
`stroke="currentColor"`. Можно удалить.

**Два разных `Button` в папке.** `button.tsx` (канонический shadcn) и
`liquid-glass-button.tsx` тоже экспортируют `Button` и `buttonVariants`.
Файлы разные, конфликта нет, но если понадобится импортировать оба
в одном месте — переименовывайте при импорте:

```tsx
import { Button } from "@/components/ui/button";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
```
