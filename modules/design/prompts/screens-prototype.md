# Генерация экранов — кликабельный прототип (mobile + desktop, handlers, mock-state)

Запускай, когда поэкранный контракт готов и нужно собрать экраны.

Нужно на входе: `docs/spec.md` (индекс экранов, данные, стек); `docs/screens/<url>.md` с логикой и разделом `## Визуал` (если нет — `design/prompts/screen-visual-spec.md`); UI-кит в `src/shared/ui/`; FSD-структура и `src/app/(app)/layout.tsx` с обвязкой (`design/prompts/fsd-architecture.md`).

Результат: каждый экран — рабочая страница из компонентов UI-кита, mobile и desktop в одном компоненте, у каждого интерактивного элемента есть обработчик с видимой реакцией, фильтры/сортировка/поиск работают на mock-state.

Пути `src/…` — от корня приложения, `docs/…` — от корня проекта. Стек — из `docs/spec.md`; shadcn/Tailwind/Radix ниже — вариант по умолчанию. Режимы дизайна: **A1** — Figma с библиотекой компонентов и Code Connect; **A2** — Figma только с макетами; **Б/В** — без Figma.

## Проверка спеки перед стартом

Для каждого экрана: раздел «Действия» не пуст; у каждого действия конкретный результат («клик “Сохранить” → переход на /dashboard»); нет «TBD», «уточнить позже», «?». Пробел → не генерируй, предложи логику или задай точный вопрос и дождись ответа.

## Главные правила

1. **Логика** — из `docs/screens/<url>.md` (состояния, действия, связи, валидация), общие данные/доступы — из `spec.md`. Чего нет — уточни, не придумывай.
2. **Визуал** — только компоненты `shared/ui/` + раздел `## Визуал` того же файла.
3. **Mobile и desktop за один проход, в одном компоненте.** Базовые классы — mobile-first, desktop через `md:`/`lg:`. Не делать `MobileHero` + `DesktopHero`; исключение — реально разная структура в макете (два компонента в `widgets/` с `hidden md:block` / `md:hidden`). Нет мобильного макета → грид → стек, меню → бургер, hover → tap, tap-таргеты ≥ 44×44.
4. **У каждого интерактивного элемента — обработчик с видимой реакцией.** Ни одного `onClick={() => {}}`, ни одного `<Input>` без `onChange`. Нет реальной логики → `router.push`, `setState` или `toast.info('В разработке')`.
5. **Интерактивность данных — mock-state.** Фильтры, сортировка, поиск, выбор, табы — `useState`; производные списки — `useMemo` над моками. Выбор фильтра должен видимо менять список.
6. **Данные — моки** из `entities/<entity>/api/mock-*.ts` через хуки-обёртки (`useUser`, `useOrders`), чтобы потом заменить на API без переписывания страниц.
7. **По одному экрану.** Между группами экранов чисти контекст (`/clear`).
8. **Курсоры:** кастомный кликабельный элемент → `cursor-pointer`, disabled → `cursor-not-allowed` (компоненты UI-кита это уже содержат).
9. **Обвязка — в layout, не в странице.** Header/Sidebar/Footer живут в `src/app/(app)/layout.tsx`; страница рендерит только свой контент. Внутренние переходы — `<Link>`, из обработчиков — `router.push()`, `<a href>` — только внешние ссылки.

## DESIGN.md → UI-кит → экран

- Нужен новый токен → сначала в `docs/DESIGN.md`.
- Нужен новый вариант компонента → сначала `variant` в `shared/ui/<component>`.
- Нужного элемента нет в UI-ките → новый компонент в `shared/ui/`, потом импорт.
- Хардкод классов-значений, хексов, пикселей на странице или в виджете запрещён, даже временно.

## Режим A (Figma)

Для каждого экрана:
1. `get_design_context` по node-id экрана.
   - **A1:** должен вернуться JSX с твоими `<Button>`, `<Card>` и точными props. Вернулся голый Tailwind → Code Connect не работает: **стоп**, проверь `design/prompts/figma-code-connect.md` (publish прошёл, экран в том же файле, `get_code_connect_map` отдаёт маппинг).
   - **A2:** Tailwind-каркас — это штатно. Используй его только как подсказку по layout, элементы ставь компонентами `shared/ui/`, точные значения — из `## Визуал` и `get_screenshot`.
2. Собери экран: layout, отступы, gap, max-width — точно как в Figma, без «адаптаций».
3. До сборки скачай все ассеты экрана (картинки, иллюстрации, иконки не из lucide, градиенты) в `public/assets/<screen>/`, в коде — пути `/assets/<screen>/<file>`.
4. Реализуй состояния (default / loading / empty / error / success) и подключи моки.
5. Визуальная сверка (без неё экран не готов): Figma desktop/mobile frame → `docs/figma-snapshots/<screen>-desktop.png` / `-mobile.png`; локально Playwright на 1440×900 и 375×800 → `docs/local-snapshots/`. Сравни пары: layout, пропорции, отступы, padding, цвета, типографика, иконки/картинки, состояния, mobile (бургер, стек, tap-таргеты), интерактивность. Расхождение → **стоп**, спроси: «Figma [X], в коде [Y] — чиним токены / variant / layout / handler или оставляем с обоснованием?»

## Режим Б/В (без Figma)

Для каждого экрана:
1. Layout из `## Визуал`; не задан → спроси или дефолт по типу (форма → max-width 480px, дашборд → контейнер 1280px, лендинг → full-bleed с container padding).
2. Референсы из `docs/screens-references/`; ассеты пользователя → сразу в `public/assets/<screen>/`, до сборки.
3. Компоненты UI-кита + Tailwind только для layout (grid/flex/max-width/padding).
4. Состояния + моки.
5. Playwright на 320×800, 768×1024, 1440×900 (`browser_resize` → `browser_take_screenshot`). Чек-лист на каждой ширине: текст не вылезает (`overflow-wrap: break-word`); нет подозрительно узких блоков на широком экране и горизонтального скролла на узком; грид/флекс перестраиваются; кнопки не растянуты где не нужно; картинки пропорциональны; tap-таргеты ≥ 44px; sticky/fixed не перекрывает контент.
6. Extreme content (на 1440): короткое и очень длинное имя; список из 1 и из 100 элементов; пустой список → читаемый empty state; длинный email в поле формы.
7. Любой провал → **стоп**, чини до следующего экрана.

Без Playwright MCP: тот же Playwright скриптом (открыть страницу → viewport → скриншот в `docs/local-snapshots/`) через `npx playwright`, затем прочитать скриншоты.

## Эталоны

Страница (обвязки нет — она в layout):

```tsx
// src/pages/profile/ui/ProfilePage.tsx
'use client'
import Link from 'next/link'
import { useUser } from '@/entities/user'
import { useOrders, OrderCard } from '@/entities/order'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'
import { EmptyState } from '@/shared/ui/empty-state'
import { ErrorState } from '@/shared/ui/error-state'

export function ProfilePage() {
  const user = useUser()
  const { data: orders, isLoading, error, refetch } = useOrders()
  if (isLoading) return <Skeleton />
  if (error) return <ErrorState onRetry={() => refetch()} />
  return (
    <div className="container mx-auto py-8">
      <Card variant="elevated">
        <h1 className="text-2xl font-semibold">{user.name}</h1>
        <p className="text-muted-foreground">{user.email}</p>
      </Card>
      <section className="mt-6">
        {orders.length === 0 ? (
          <EmptyState
            title="У вас пока нет заказов"
            action={<Button asChild variant="primary"><Link href="/shop">Сделать заказ</Link></Button>}
          />
        ) : (
          <div className="mt-4 grid gap-4">{orders.map(o => <OrderCard key={o.id} {...o} />)}</div>
        )}
      </section>
    </div>
  )
}
```

Mock-state:

```tsx
const [from, setFrom] = useState('')
const [date, setDate] = useState<Date>()
const filtered = useMemo(
  () => mockFlights.filter(f => (!date || isSameDay(f.date, date)) && (!from || f.from.includes(from))),
  [date, from]
)
```

Мок + запрос + хук:

```ts
// src/entities/user/api/mock-user.ts
export const mockUser: User = { id: 'u-001', email: 'user@example.com', name: 'Иван Иванов', role: 'user', createdAt: '2025-01-15T00:00:00Z' }

// src/entities/user/api/getUser.ts — при подключении БД заменится на fetch('/api/user')
export async function getUser(): Promise<User> {
  await new Promise(r => setTimeout(r, 300))
  return mockUser
}

// src/entities/user/model/useUser.ts
export function useUser() {
  const { data } = useQuery({ queryKey: ['user'], queryFn: getUser }) // или useState/useEffect
  return data
}
```

Роутинг — тонкий адаптер: `src/app/(app)/profile/page.tsx` → `export { ProfilePage as default } from '@/pages/profile'`.

**Главная `/`:** при сборке экрана главной перезапиши `src/app/page.tsx` целиком адаптером на настоящую главную (или `redirect('/login')`, если так по спеке). Dev-редирект на `/style-guide` исчезает, витрина остаётся по своему адресу.

## Проверки после каждого экрана

```bash
S=src/pages/<screen>/
grep -rE '#[0-9a-fA-F]{3,8}|\[[0-9]+px\]' $S                                    # хардкод
grep -rE '<(button|input|select|textarea)[ >]' $S                                 # raw HTML вместо UI-кита
grep -rE 'onClick=\{\(\) => \{\}\}|onClick=\{undefined\}' $S                      # пустые обработчики
grep -rE '<(button|Button)\b' $S | grep -vE 'onClick|href|type="submit"|asChild'  # кнопки без действия
grep -rE '<Input\b' $S | grep -vE 'onChange|readOnly|disabled'                    # поля без onChange
```

Нашлось → чини до следующего экрана. Затем в браузере: нажми каждую кнопку, поменяй каждый фильтр — UI должен видимо реагировать; проверь loading (задержка в моке), empty (пустой массив), error (ошибка из мока).

## Порядок

1. Публичные экраны: главная, login, signup.
2. Основной флоу залогиненного пользователя.
3. Редкие: настройки, восстановление пароля, ошибки.

## После всех экранов

Покажи пользователю: список страниц, скриншоты ключевых экранов в разных состояниях, открытые вопросы по спеке.
