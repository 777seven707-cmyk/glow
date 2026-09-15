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
splite.tsx                      SplineScene — ленивая загрузка 3D-сцены
spotlight.tsx                   Spotlight — пятно света за курсором
card.tsx                        Card из shadcn/ui
spline-scene-basic.tsx          демо: Card + Spotlight + SplineScene
```

Все файлы проверены `tsc --strict` — ошибок нет.

## black-hole

Компонент пришёл без модуля `black-hole-utils/renderer`, на который ссылается,
поэтому рендерер написан заново — на основе того же шейдера, что работает
на живом сайте (`assets/js/blackhole.js`).

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
