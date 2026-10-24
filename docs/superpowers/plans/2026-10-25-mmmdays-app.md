# MmmDays — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Локальный PWA-трекер менструального цикла MmmDays (календарь + статистика, данные в localStorage, офлайн, RU/EN) по утверждённому дизайн-документу.

**Architecture:** Vanilla TypeScript без UI-фреймворков. Вся расчётная логика — чистые функции (`src/logic/`), покрытые юнит-тестами; представления — тонкие DOM-модули (`src/views/`, `src/ui/`), подписанные на крошечный стор. Vite собирает статический бандл с относительными путями; vite-plugin-pwa даёт manifest и офлайн.

**Tech Stack:** Vite, TypeScript (strict), Vitest + happy-dom (dev), vite-plugin-pwa (dev). Никаких runtime-зависимостей.

**Spec:** [docs/superpowers/specs/2026-10-25-mmmdays-design.md](../specs/2026-10-25-mmmdays-design.md) — исполнитель читает спеку вместе с планом.

## Global Constraints

- TypeScript `strict`, без `any` в новом коде; без UI-фреймворков и без runtime-зависимостей.
- Vite `base: './'` (работа и в корне домена, и в подпапке).
- Палитра (точно из спеки): фон `#F5F6F7`, карточки `#FFFFFF`, скудно `#F4C6CC`, обильно/активный `#E89AA4`, текст `#2B2B2B`, вторичный `#8A8F98`, границы/пустые дни `#E4E6E9`.
- localStorage: данные — ключ `mmmdays.v1`, язык — `mmmdays.lang` (`ru`|`en`, нет ключа — `ru`).
- Состояния дня: `0` нет данных, `1` скудно, `2` обильно; даты — локальные, ключи `YYYY-MM-DD`; в `days` хранятся только ненулевые.
- Календари: неделя с понедельника; только реальные месяцы.
- Никаких «медицинских» терминов в интерфейсе; никаких сетевых запросов в рантайме.
- Команды: `npm run dev` / `npm run test` / `npm run build`. ОС — Windows (PowerShell); POSIX-команды — через Git Bash.
- Каждый коммит заканчивать пустой строкой и `Co-Authored-By: Claude Code <noreply@anthropic.com>`.
- Частые коммиты: каждый шаг «Commit» из задач — отдельный коммит.

## Review Focus

1. Границы месяцев/годов и високосные дни во всей работе с датами (28/29 февраля, декабрь→январь) — ожидаются корректные разности и сетки; тесты закреплены в Task 2.
2. Местное время/DST: ключ даты строится из локальных компонентов, полночь не смещается (`Date(2026,9,24,23,30)` → `'2026-10-24'`) — тест в Task 2.
3. Битый `localStorage` (не-JSON, неверная форма): `loadData` не бросает, отдаёт пустые данные — тест в Task 6.
4. Кривой файл импорта (нет `days`, чужой `v`, ключи не-даты, значения-строки/0/3): `validateBackup` отклоняет целиком с понятной ошибкой — тесты в Task 13.
5. Период только из скудных дней (без обильных): все метрики деградируют в `null`/«мало данных», ничего не падает — тесты в Tasks 4–5.

---

### Task 1: Каркас проекта

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.ts` (заглушка `console.log('MmmDays')`), `src/styles.css`, `src/smoke.test.ts`, `.gitignore`

**Interfaces:**
- Produces: npm-проект со скриптами `dev`/`test`/`build`; git-репозиторий (сейчас его нет); CSS-переменные палитры в `src/styles.css`: `--bg:#F5F6F7; --card:#FFFFFF; --light:#F4C6CC; --accent:#E89AA4; --text:#2B2B2B; --muted:#8A8F98; --border:#E4E6E9;`

- [ ] **Step 1: Инициализация**

Git Bash: `git init`. `package.json`: `"type":"module"`, scripts `dev/test/build` (`vite`, `vitest run`, `vite build`), devDependencies: `vite`, `typescript`, `vitest`, `happy-dom`. `npm install`. `tsconfig.json`: strict, `target: ES2022`, `module: ESNext`, `moduleResolution: bundler`, `types: ["vite/client"]`.

- [ ] **Step 2: `vite.config.ts`**

`base: './'`; тестовый блок: `test: { environment: 'happy-dom' }` (подключить `/// <reference types="vitest/config" />`).

- [ ] **Step 3: `.gitignore` + заглушки**

`.gitignore`: `node_modules/`, `dist/`, `.superpowers/`. `index.html`: `<!doctype html>` с `<html lang="ru">`, `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, `<meta name="theme-color" content="#F5F6F7">`, `<div id="app"></div>`, `<script type="module" src="/src/main.ts">`. `src/smoke.test.ts`: один тест `expect(1 + 1).toBe(2)`. В `src/styles.css` — переменные палитры из Interfaces.

- [ ] **Step 4: Проверка**

Run: `npm run test` → PASS (1 тест). `npm run build` → `dist/index.html` существует.

- [ ] **Step 5: Commit** — `chore: scaffold Vite+TS+Vitest project`

---

### Task 2: Дата-хелперы `src/logic/dates.ts`

**Files:**
- Create: `src/logic/dates.ts`, тест `src/logic/dates.test.ts`

**Interfaces:**
- Produces (используют все последующие задачи):
  - `toKey(d: Date): string` — локальная дата `YYYY-MM-DD`
  - `fromKey(key: string): Date` — локальная полночь
  - `addDays(d: Date, n: number): Date`
  - `diffDays(a: Date, b: Date): number` — `b − a` в сутках
  - `daysInMonth(year: number, month0: number): number` (`month0`: 0–11)
  - `firstWeekdayOfMonth(year: number, month0: number): number` — 0 = понедельник
  - `monthGridKeys(year: number, month0: number): (string | null)[]` — ячейки месяца: `null`-отступы, затем ключи дней

- [ ] **Step 1: Пишем падающие тесты**

Имена и проверки (все даты — конструируются локально, `new Date(y, m, d)`):
- `toKey(new Date(2026, 9, 24)) === '2026-10-24'`; `toKey(new Date(2026, 9, 24, 23, 30)) === '2026-10-24'` (вечер не сдвигает день)
- `fromKey('2026-10-24')` → `getDate()===24 && getMonth()===9`
- `diffDays(new Date(2026,9,24), new Date(2026,9,26)) === 2`; через год: `2026-12-31 → 2027-01-01 === 1`; високосный: `2028-02-28 → 2028-02-29 === 1`, `2028-02-28 → 2028-03-01 === 2`; невисокосный: `2027-02-28 → 2027-03-01 === 1`
- `addDays(new Date(2026,9,31), 1)` → 1 ноября; `addDays(d, 0)` возвращает ту же дату
- `daysInMonth(2028, 1) === 29`; `daysInMonth(2027, 1) === 28`; `daysInMonth(2026, 9) === 31`
- `firstWeekdayOfMonth(2026, 9) === 3` (октябрь 2026 начинается с четверга); `(2026, 5) === 0`; `(2026, 7) === 5`
- `monthGridKeys(2026, 9)`: длина 34, первые 3 — `null`, `[3] === '2026-10-01'`, последний `'2026-10-31'`

- [ ] **Step 2: `npm run test` → FAIL** (модуль не существует)
- [ ] **Step 3: Реализовать `dates.ts`** — только локальные геттеры (`getFullYear/getMonth/getDate`), без `toISOString` (он в UTC)
- [ ] **Step 4: `npm run test` → PASS**
- [ ] **Step 5: Commit** — `feat: local date helpers with real-calendar tests`

---

### Task 3: Типы и разбор периодов `src/types.ts`, `src/logic/periods.ts`

**Files:**
- Create: `src/types.ts`, `src/logic/periods.ts`, `src/logic/periods.test.ts`

**Interfaces:**
- Produces:
  - `src/types.ts`: `type DayState = 0 | 1 | 2;` `type DaysMap = Record<string, 1 | 2>;` `interface AppData { v: 1; days: DaysMap }`
  - `interface Period { start: string; end: string; firstHeavy: string | null; hasHeavy: boolean; lengthDays: number }` (`lengthDays` включает внутренние пропуски)
  - `parsePeriods(days: DaysMap): Period[]` — по возрастанию `start`; пропуск ровно 1 день НЕ разрывает период, ≥ 2 — разрывает

- [ ] **Step 1: Пишем падающие тесты**

Фикстура недели октября 2026: `{'2026-10-20':1,'2026-10-21':2,'2026-10-22':2,'2026-10-23':2,'2026-10-24':2}` → один период: `start '2026-10-20'`, `end '2026-10-24'`, `firstHeavy '2026-10-21'`, `hasHeavy true`, `lengthDays 5`.
Пропуск 1 день: `{'11-01':1,'11-02':2,'11-04':1}` (2026) → один период, `lengthDays 4`. Пропуск 2 дня (`...,'11-02':2,'11-05':1`) → два периода. Только скудные (`{'10-01':1,'10-02':1}`) → `firstHeavy null`, `hasHeavy false`. Один день → `lengthDays 1`. Порядок ключей в объекте перемешан — результат всё равно сортирован.

- [ ] **Step 2: `npm run test` → FAIL**
- [ ] **Step 3: Реализовать `parsePeriods`** — сортировка ключей, проход с допуском `diffDays(prev, next) <= 2` (1 пропуск)
- [ ] **Step 4: `npm run test` → PASS**
- [ ] **Step 5: Commit** — `feat: period parsing with one-day gap tolerance`

---

### Task 4: Циклы и метрики `src/logic/cycles.ts`

**Files:**
- Create: `src/logic/cycles.ts`, `src/logic/cycles.test.ts`

**Interfaces:**
- Consumes: `Period` из Task 3, `addDays/diffDays/fromKey/toKey` из Task 2
- Produces:
  - `interface CycleStats { starts: string[]; lengths: number[]; avgCycle: number | null; avgDuration: number | null; lastCycleLength: number | null; forecast: string | null; regularity: 'even' | 'uneven' | 'irregular' | null }`
  - `computeCycleStats(periods: Period[]): CycleStats` — правила из спеки: начало цикла = первый обильный день периода; периоды без обильных в циклах не участвуют, но входят в `avgDuration`; `avgCycle` — среднее длин, округлённое `Math.round`, `null` при < 2 циклах; `avgDuration` — среднее `lengthDays` всех периодов, `Math.round`, `null` без периодов; `lastCycleLength` — последняя завершённая длина (разность двух последних `starts`), `null` при < 2; `forecast` = последний `start` + `avgCycle`, `null` при < 2 циклах; `regularity`: `null` при < 2, разброс (max−min) ≤ 2 → `'even'`, 3–5 → `'uneven'`, > 5 → `'irregular'`

- [ ] **Step 1: Пишем падающие тесты**

Фикстура: 7 периодов, `firstHeavy`: 2026-05-12, 06-08, 07-05, 08-01, 08-28, 09-24, 10-21 (все `lengthDays 5`) → `lengths` = шесть раз 27; `avgCycle 27`; `lastCycleLength 27`; `forecast '2026-11-17'`; `regularity 'even'`; `avgDuration 5`.
Края: пустой массив → все `null`, `starts: []`, `lengths: []`; один период с heavy → `avgCycle null`, `forecast null`, `regularity null`, `avgDuration 5`; периоды без heavy (`firstHeavy null`) → в `starts` не попадают, но в `avgDuration` да; длины `[25, 31]` (разброс 6) → `'irregular'`, `[26, 30]` (4) → `'uneven'`; округление: `[27, 28]` → `avgCycle 28`? нет: 27.5 → `Math.round` = 28.

- [ ] **Step 2: `npm run test` → FAIL**
- [ ] **Step 3: Реализовать `computeCycleStats`**
- [ ] **Step 4: `npm run test` → PASS**
- [ ] **Step 5: Commit** — `feat: cycle metrics, forecast and regularity`

---

### Task 5: Статус `src/logic/status.ts`

**Files:**
- Create: `src/logic/status.ts`, `src/logic/status.test.ts`

**Interfaces:**
- Consumes: `parsePeriods`, `computeCycleStats`, дата-хелперы
- Produces:
  - `type Status = { mode: 'no-data' } | { mode: 'no-forecast' } | { mode: 'in-progress'; dayNumber: number } | { mode: 'until'; days: number } | { mode: 'delay'; days: number }`
  - `computeStatus(days: DaysMap, today: Date): Status` — по спеке: нет отметок → `'no-data'`; сегодня отмечен ИЛИ (сегодня не отмечен, но вчера была отметка) → `'in-progress'`, `dayNumber = diffDays(firstHeavy ?? start, today) + 1`; иначе при `forecast === null` → `'no-forecast'`; `diffDays(today, forecast) >= 0` → `'until'` с этим числом; иначе `'delay'` с числом просрочки

- [ ] **Step 1: Пишем падающие тесты**

Сегодня 2026-10-23, отмечены 20(light)…24(heavy) как в фикстуре Task 3 → `'in-progress'`, `dayNumber 3` (от 10-21). Сегодня 2026-10-25 (не отмечен, вчера отмечен) → `'in-progress'`, `dayNumber 5`. Сегодня 2026-10-26 (два дня без отметок) → `'until'`, `days 22` (прогноз 11-17). Прогноз прошёл (сдвинуть `today` на 11-20) → `'delay'`, `days 3`. Только один цикл в истории (один период) → `'no-forecast'`. `days` пуст → `'no-data'`. Только скудные, вчера отмечено → `'in-progress'` с `dayNumber` от `start`.

- [ ] **Step 2: `npm run test` → FAIL**
- [ ] **Step 3: Реализовать `computeStatus`** — «открытый период» = последний период с `end >= ключа вчера`
- [ ] **Step 4: `npm run test` → PASS**
- [ ] **Step 5: Commit** — `feat: status computation with tolerant in-progress day`

---

### Task 6: Хранилище и стор `src/storage.ts`, `src/store.ts`

**Files:**
- Create: `src/storage.ts`, `src/store.ts`, `src/storage.test.ts`, `src/store.test.ts`

**Interfaces:**
- Consumes: `AppData`, `DaysMap`, `DayState` из Task 3
- Produces:
  - `storage.ts`: `loadData(): AppData` (нет ключа или битое значение → `{ v: 1, days: {} }`, никогда не бросает, пишет `console.warn`); `saveData(data: AppData): void`; `loadLang(): 'ru' | 'en' | null`; `saveLang(lang: 'ru' | 'en'): void`
  - `store.ts`: `getDays(): DaysMap`; `getAllData(): AppData`; `setDay(key: string, state: DayState): void` (state 0 → ключ удаляется; сохраняет в localStorage); `replaceDays(days: DaysMap): void` (полная замена + сохранение); `subscribe(fn: () => void): () => void` (отписка)

- [ ] **Step 1: Пишем падающие тесты**

`loadData` без ключа → `{v:1,days:{}}`; после `saveData` → читается обратно; в `localStorage` лежит не-JSON → пустые данные без исключения. `setDay('2026-10-21', 2)` → ключ появился и сохранён; `setDay(..., 0)` → ключ удалён; `subscribe` — колбэк сработал на каждом изменении, отписка работает.

- [ ] **Step 2: `npm run test` → FAIL**
- [ ] **Step 3: Реализовать оба модуля** (happy-dom уже подключён в Task 1)
- [ ] **Step 4: `npm run test` → PASS**
- [ ] **Step 5: Commit** — `feat: localStorage persistence and reactive store`

---

### Task 7: Локализация `src/i18n/index.ts`, `src/i18n/dict.ts`

**Files:**
- Create: `src/i18n/index.ts`, `src/i18n/dict.ts`, `src/i18n/i18n.test.ts`

**Interfaces:**
- Produces:
  - `type Lang = 'ru' | 'en'`
  - `t(key: string, params?: Record<string, string | number>): string` — замена `{n}` и т.п.
  - `getLang(): Lang` / `setLang(lang: Lang): void` — читает/пишет `mmmdays.lang`, по умолчанию `'ru'`
  - `daysWord(n: number, lang: Lang): string` — русские склонения: 1/21 день, 2–4/22–24 дня, 5–20/25+ дней; en: `day`/`days`
  - `monthName(year: number, month0: number, form?: 'long' | 'short'): string` и `weekdayShort(): string[]` — через `Intl.DateTimeFormat` выбранной локали, неделя с понедельника (`пн, вт, …`)
  - Ключи словаря (русские значения — копия из спеки/макетов): `tabs.calendar 'Календарь'`, `tabs.stats 'Статистика'`, `status.inProgress 'В процессе • {n} {dw}'`, `status.until 'До начала: {n} {dw}'`, `status.delay 'Задержка: {n} {dw}'`, `status.lastCycle 'последний цикл: {n} {dw}'`, `status.noData 'Отметьте первый день'`, `status.noForecast 'Мало данных для прогноза'`, `stats.last 'Последние'`, `stats.forecast 'Прогноз'`, `stats.avgCycleLabel 'дней в цикле'`, `stats.avgDurationLabel 'дней длится'`, `stats.rhythmLabel 'ритм'`, `stats.rhythm.even 'ровно'`, `stats.rhythm.uneven 'неровно'`, `stats.rhythm.irregular 'нерегулярно'`, `stats.malo 'мало данных'`, `stats.range.3 '3 мес'`, `stats.range.6 '6 мес'`, `stats.range.9 '9 мес'`, `stats.range.12 '1 год'`, `miniCal.title 'Календарь'`, `legend.light 'скудно'`, `legend.heavy 'обиль­но'`, `legend.today 'сегодня'`, `data.title 'Данные'`, `data.export 'Экспорт JSON'`, `data.import 'Импорт JSON'`, `data.importConfirm 'Добавится {a} дней, заменится {r}. Применить?'`; английские — осмысленные аналоги (`In progress • day {n}`, `Starts in: {n} {dw}`, `Late: {n} {dw}`, …)

- [ ] **Step 1: Пишем падающие тесты**

`getLang()` без сохранённого выбора → `'ru'`; `setLang('en'); t('tabs.stats') === 'Statistics'`; `t('status.until', {n: 5, dw: daysWord(5, 'ru')}) === 'До начала: 5 дней'`; склонения: `daysWord(1,'ru')='день'`, `daysWord(2,'ru')='дня'`, `daysWord(5,'ru')='дней'`, `daysWord(21,'ru')='день'`, `daysWord(11,'ru')='дней'`; `monthName(2026, 9)` → `'октябрь'` (ru) / `'October'` (en); `weekdayShort()[0]` — `'пн'` (ru) / `'Mon'` (en).

- [ ] **Step 2: `npm run test` → FAIL**
- [ ] **Step 3: Реализовать i18n** — словари плоские `Record<Lang, Record<string,string>>`, подстановка параметров регуляркой
- [ ] **Step 4: `npm run test` → PASS**
- [ ] **Step 5: Commit** — `feat: ru/en i18n with russian plural forms`

---

### Task 8: Каркас приложения — шапка, вкладки, язык

**Files:**
- Modify: `index.html`, `src/main.ts`, `src/styles.css`

**Interfaces:**
- Consumes: `store.subscribe`, i18n из Task 7
- Produces: DOM-контракт для представлений: шапка `.header` (название «MmmDays» слева, переключатель `RU | EN` справа — пилюля из двух кнопок), `<main id="view-calendar">` и `<main id="view-stats" hidden>`, таб-бар `.tabbar` (две кнопки). `src/main.ts`: `function mountApp(): void` — ставит язык, рендерит шапку/табы, переключение вкладок показом/скрытием `<main>`, смена языка — перерендер всего. Представления из Tasks 9–11 подключатся сюда вызовами `renderCalendarView(root)` / `renderStatsView(root)`.

- [ ] **Step 1: Разметка и стили**

`index.html`: `<title>MmmDays</title>` + структура из Interfaces. `src/styles.css`: дизайн-система из спеки — фон `--bg`, карточки белые радиус 18px, тень `0 4px 14px rgba(43,43,43,.06)`, пилюли радиус 999px, таб-бар — белая пилюля с `padding-bottom: env(safe-area-inset-bottom)`, активная вкладка цветом `--accent`, шрифт `system-ui, -apple-system, sans-serif`. Максимум ширины контента 480px по центру.

- [ ] **Step 2: `src/main.ts`**

`mountApp()` + вызов на `DOMContentLoaded`. Переключение языка: `setLang(...)` и полный перерендер каркаса.

- [ ] **Step 3: Проверка**

`npm run test` → PASS (не задет). `npm run build` → без ошибок. `npm run dev` — в браузере видны шапка с RU|EN и таб-бар, вкладки переключаются, язык меняется (проверка глазами исполнителя; сюда ещё не подключены представления — пустые `<main>` это норма).

- [ ] **Step 4: Commit** — `feat: app shell with tabs and language toggle`

---

### Task 9: Экран «Календарь»

**Files:**
- Create: `src/views/calendarView.ts`, `src/views/nextState.test.ts`, тест хелпера в нём же
- Modify: `src/main.ts` (подключить `renderCalendarView`)

**Interfaces:**
- Consumes: `store` (Task 6), `computeStatus`, `computeCycleStats`, `parsePeriods`, `monthGridKeys`, `monthName`, `t`, `daysWord`, дата-хелперы
- Produces:
  - `renderCalendarView(root: HTMLElement): void` — полный рендер и перерендер по `store.subscribe`
  - чистый хелпер `nextState(s: DayState): DayState` — `0 → 1 → 2 → 0` (порядок из спеки)
  - CSS-классы ячеек: `.cell` (обычный день), `.light`, `.heavy`, `.today` (тонкая рамка box-shadow-кольцом, не перекрывает `.light/.heavy`), `.dow` (пн…вс), `.muted` (пустые ячейки-отступы)

- [ ] **Step 1: Пишем падающий тест `nextState`**

`nextState(0)===1; nextState(1)===2; nextState(2)===0` (одно состояние за тап — «пусто → скудно → обильно → пусто»).

- [ ] **Step 2: `npm run test` → FAIL → Step 3: реализовать `nextState` → PASS → Commit** — `feat: day state cycle order`

- [ ] **Step 4: Рендер экрана**

В `renderCalendarView`: 1) статус-карточка: по `computeStatus(getDays(), today)` — «В процессе • N день» / «До начала: N дней» / «Задержка: N дней» / «Мало данных…» / «Отметьте первый день», ниже строка `t('status.lastCycle', …)` с `lastCycleLength` (или пусто, если `null`); 2) заголовок «Октябрь 2026» со стрелками ‹ ›; 3) сетка из `monthGridKeys`, тап по дню → `setDay(key, nextState(cur))` (стор сам вызовет перерендер); 4) рамочка `.today` на сегодняшнем дне; 5) легенда (скудно/обиль­но/сегодня); 6) свайп: `touchstart/touchend`, |deltaX| > 40px и |deltaX| > 2|deltaY| → месяц ∓1. Состояние месяца — переменная модуля, стартует с текущего месяца.

- [ ] **Step 5: Проверка**

`npm run build` без ошибок; `npm run dev`: тап по дню меняет отметку по циклу и сохраняется после перезагрузки, стрелки и свайп листают месяцы, сегодня — в рамочке, статус-карточка согласована с отметками.

- [ ] **Step 6: Commit** — `feat: calendar view with tap-cycle and swipe`

---

### Task 10: Диаграмма `src/ui/chart.ts`

**Files:**
- Create: `src/ui/chart.ts`, `src/ui/chart.test.ts`

**Interfaces:**
- Consumes: `getDays`, `t('stats.range.N')`, дата-хелперы
- Produces:
  - `sliceDays(days: DaysMap, monthsBack: number, today: Date): { key: string; level: DayState }[]` — с первого дня месяца `monthsBack` месяцев назад по `today` включительно
  - `const CHART_RANGES = [3, 6, 9, 12] as const`
  - `renderChart(root: HTMLElement): void` — карточка: чипсы периодов (активный 6), тонкие столбики `flex:1` (один день — один столбик, высота класса `.b0/.b1/.b2`), подписи коротких месяцев снизу; клик по чипсу перерисовывает

- [ ] **Step 1: Пишем падающие тесты `sliceDays`**

`today = 2026-10-25`: `sliceDays({}, 6, today).length === 178` (1 мая … 25 октября) и `first.key === '2026-05-01'`, `last.key === '2026-10-25'`; `monthsBack 12` → начинается `2025-11-01`, длина 359; уровни: при `{'2026-10-21': 2}` соответствующий элемент `level 2`, остальные 0; граница года: `monthsBack 2` от 2027-01-10 начинается `2026-11-01`.

- [ ] **Step 2: FAIL → Step 3: реализовать `sliceDays` → PASS → Commit** — `feat: chart range slicing`

- [ ] **Step 4: `renderChart`**

Чипсы из `CHART_RANGES` (label через `t('stats.range.' + n)`, активный — класс `.active` цветом `--accent`), бары `div` в flex-контейнере `align-items:flex-end`, высоты ≈ 4/16/28px, цвета: пустой `--border`, скудно `--light`, обильно `--accent`; под диаграммой строка коротких названий месяцев (`monthName(..., 'short')`), каждая — по числу её дней в выборке (равные `flex`).

- [ ] **Step 5: Проверка**

`npm run build`; `npm run dev`: чипсы переключают 3/6/9/12, столбики тонкие, месяцы подписаны. Step 6: Commit — `feat: thin per-day bar chart with range chips`

---

### Task 11: Экран «Статистика»

**Files:**
- Create: `src/views/statsView.ts`
- Modify: `src/main.ts` (подключить `renderStatsView`)

**Interfaces:**
- Consumes: `computeCycleStats`, `parsePeriods`, `renderChart` (Task 10), `t`, `monthName`, `store.subscribe`; зарезервированные контейнеры: `<div id="mini-cal-mount">` и `<div id="data-mount">` (заполнятся в Tasks 12–13)
- Produces: `renderStatsView(root: HTMLElement): void`

- [ ] **Step 1: Рендер**

Заголовок «Статистика». Ряд карточек: «Последние» — дата последнего `start` («21 октября» = `Intl` день + `monthName` long; en: 'October 21'), «Прогноз» — `forecast` с «≈» цветом `--accent`. Ряд плиток: `avgCycle`, `avgDuration`, регулярность (`'ровно'/'неровно'/'нерегулярно'`), значения `null` → прочерк, подпись регулярности `null` → «мало данных». Ниже `renderChart`. Подписка на стор — перерендер.

- [ ] **Step 2: Проверка**

`npm run build`; `npm run dev`: с данными фикстуры (внести руками несколько отметок) карточки и плитки согласованы со спекой; пустое состояние без падений («—» и «мало данных»).

- [ ] **Step 3: Commit** — `feat: stats view cards and tiles`

---

### Task 12: Мини-календарь-карусель `src/ui/miniCal.ts`

**Files:**
- Create: `src/ui/miniCal.ts`, `src/ui/miniCal.test.ts`
- Modify: `src/views/statsView.ts` (вставить в `#mini-cal-mount`)

**Interfaces:**
- Consumes: `getDays`, `monthGridKeys`, `monthName`, `store.subscribe`
- Produces:
  - `halfYearPage(page: number, today: Date): { year: number; month0: number }[]` — `page 0` = полугодие, содержащее `today`, 6 месяцев по возрастанию; `page k` — на `6k` месяцев раньше; полугодия выровнены: май–октябрь / ноябрь–апрель
  - `pageCount(earliestKey: string | null, today: Date): number` — сколько листов от самых ранних данных до текущего полугодия; нет данных или всё в текущем → 1
  - `renderMiniCal(root: HTMLElement): void` — карточка: заголовок «Май – Октябрь 2026» (год в обоих концах, если меняется: «Ноябрь 2025 – Апрель 2026»), стрелка ‹ (назад в историю), › (вперёд; на `page 0` неактивна), сетка 2 колонки × 3 ряда месяцев с числами дней (`~17px` клетка, числа ~9–10px), отмеченные — заливка `--light`/`--accent`, сегодня (на page 0) — рамочка, точки-индикатор числа листов, свайп влево → старше, вправо → новее, границы `[0, pageCount-1]`

- [ ] **Step 1: Пишем падающие тесты**

`today = 2026-10-25`: `halfYearPage(0, today)` → `[{2026,4}…{2026,9}]`; `halfYearPage(1, today)` → `[{2025,10},{2025,11},{2026,0},{2026,1},{2026,2},{2026,3}]`; `halfYearPage(2, today)[0]` → `{2025,4}`. `pageCount(null, today) === 1`; `pageCount('2026-03-15', today) === 2`; `pageCount('2026-05-01', today) === 1`; `pageCount('2024-06-01', today) === 5`.

- [ ] **Step 2: FAIL → Step 3: реализовать хелперы → PASS → Commit** — `feat: half-year page math`

- [ ] **Step 4: Рендер**

Ячейки-числа как в макете: обычный день — серый текст на прозрачном, скудно — заливка `--light` тёмным текстом, обильно — заливка `--accent` белым текстом, сегодня — box-shadow-кольцо. Точки: `<i>` по числу `pageCount`, активная — `--accent`.

- [ ] **Step 5: Проверка**

`npm run build`; `npm run dev`: карусель листается стрелками и свайпом, дальше текущего полугодия не идёт, точки соответствуют, отметки и «сегодня» на месте.

- [ ] **Step 6: Commit** — `feat: half-year mini-calendar carousel with numbers`

---

### Task 13: Экспорт/импорт `src/dataio.ts`

**Files:**
- Create: `src/dataio.ts`, `src/dataio.test.ts`
- Modify: `src/views/statsView.ts` (карточка «Данные» в `#data-mount`)

**Interfaces:**
- Consumes: `getAllData`, `replaceDays`, `store.subscribe`, `t`
- Produces:
  - `interface Backup { v: 1; days: DaysMap; exportedAt: string }`
  - `buildBackup(data: AppData): Backup` — `exportedAt` = ISO сейчас
  - `validateBackup(text: string): { ok: true; days: DaysMap } | { ok: false; error: string }` — строго: JSON-объект, `v === 1`, `days` — объект с ключами `/^\d{4}-\d{2}-\d{2}$/` и целыми значениями 1|2; иначе отказ (лишние поля верхнего уровня игнорируются, `exportedAt` не обязателен)
  - `mergeDays(current: DaysMap, incoming: DaysMap): { merged: DaysMap; added: number; replaced: number }` — конфликт дат: побеждает incoming; `added` — новых ключей, `replaced` — заменённых с изменением значения; совпавшие значения не считаются
  - UI: две кнопки — экспорт скачивает `mmmdays-backup-YYYY-MM-DD.json` (Blob + `URL.createObjectURL`), импорт: `<input type="file" accept="application/json">` → чтение → `validateBackup` → `window.confirm(t('data.importConfirm', {a, r}))` → `replaceDays(merged)`

- [ ] **Step 1: Пишем падающие тесты**

`validateBackup`: валидный файл с `exportedAt` → ok; без `exportedAt` → ok; не-JSON → отказ; без `days` → отказ; `v: 2` → отказ; ключ `'2026-13-40'` → отказ; значение `'2'`, `0`, `3` → отказ. `mergeDays`: `{'01':1} + {'01':2,'02':1}` → `added 1, replaced 1`, `merged = {'01':2,'02':1}`; одинаковые значения → `replaced 0`. `buildBackup` добавляет `exportedAt` и не меняет `days`.

- [ ] **Step 2: FAIL → Step 3: реализовать → PASS → Commit** — `feat: backup validation and merge`

- [ ] **Step 4: Карточка «Данные» в статистике**

Экспорт/импорт как в Interfaces; после импорта — перерендер через `replaceDays`.

- [ ] **Step 5: Проверка**

`npm run build`; `npm run dev`: экспорт скачивает файл; импорт этого же файла обратно — подтверждение «заменится 0, добавится N» и данные на месте; импорт мусорного файла — ошибка без изменений данных.

- [ ] **Step 6: Commit** — `feat: JSON export/import card`

---

### Task 14: Иконки и PWA

**Files:**
- Create: `scripts/gen-icons.mjs`, `public/icons/` (результат скрипта: `icon-192.png`, `icon-512.png`, `maskable-512.png`, `apple-touch-icon.png` 180px, `favicon-32.png`)
- Modify: `vite.config.ts` (VitePWA), `index.html` (иконки, apple-мета)

**Interfaces:**
- Consumes: палитру из Global Constraints
- Produces: устанавливаемое PWA: manifest + service worker с прекешем всего ассета; `dist/sw.js`, `dist/manifest.webmanifest`, `dist/icons/*`

- [ ] **Step 1: Скрипт генерации PNG**

`scripts/gen-icons.mjs` без зависимостей: минимальный PNG-энкодер (RGBA-сканлайны + `zlib.deflateSync` + CRC32), рисует круг цвета `#E89AA4`: обычные иконки — круг на прозрачном фоне (диаметр ~84% стороны), `maskable-512` — фон `#F5F6F7` на всю площадь + круг в безопасной зоне (диаметр ≤ 80% стороны), `apple-touch-icon` — фон `#F5F6F7` + круг. Запуск `node scripts/gen-icons.mjs` пишет все файлы; в конце сам проверяет подпись `89 50 4E 47` и падает с ошибкой, если нет.

- [ ] **Step 2: Проверка иконок**

Run: `node scripts/gen-icons.mjs` → exit 0; в `public/icons/` пять PNG. Commit — `chore: generate neutral PWA icons`

- [ ] **Step 3: vite-plugin-pwa**

`npm i -D vite-plugin-pwa`; в `vite.config.ts` — `VitePWA({ registerType: 'autoUpdate', manifest: { name: 'MmmDays', short_name: 'MmmDays', start_url: './', scope: './', display: 'standalone', background_color: '#F5F6F7', theme_color: '#F5F6F7', icons: [192, 512, maskable] } })`. В `index.html`: `<link rel="icon">`, `<link rel="apple-touch-icon">`, `<meta name="apple-mobile-web-app-capable">`.

- [ ] **Step 4: Проверка сборки**

`npm run test` → PASS; `npm run build` → существуют `dist/index.html`, `dist/sw.js`, `dist/manifest.webmanifest`, `dist/icons/icon-192.png`. `npx vite preview` → корень отдаёт 200.

- [ ] **Step 5: Commit** — `feat: PWA manifest, icons and offline service worker`

---

### Task 15: README и финальная проверка

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: всё предыдущее; содержимое — из раздела «Документация» спеки

- [ ] **Step 1: Написать README на русском**

Разделы: что это и для кого (приватность — всё локально, никаких сетевых запросов); быстрый старт (`npm install`, `npm run dev`); тесты (`npm run test`); сборка (`npm run build`, что лежит в `dist`); как выложить на статический хостинг (любой, работает и в подпапке — относительные пути; GitHub Pages как пример); как проверить на телефоне до хостинга (USB + `chrome://inspect` port forwarding — установка и офлайн работают; по Wi-Fi `npm run dev -- --host` — только интерфейс, service worker требует безопасный контекст); экспорт/импорт данных (формат файла, перенос между устройствами); структура проекта (короткая таблица: `src/logic` — чистые функции + тесты, `src/views`/`src/ui` — экраны, `src/i18n` — словари, `src/storage.ts`/`src/store.ts` — данные); стек и лицензия «личное использование».

- [ ] **Step 2: Финальная проверка**

`npm run test` → все PASS; `npm run build` → без ошибок; вручную глазами в `npm run dev`: полный проход по спеке — отметка дней, статусы, свайпы, статистика, карусель, экспорт/импорт, переключение языка.

- [ ] **Step 3: Commit** — `docs: russian README with local and hosting guide`

- [ ] **Step 4: Итог**

Отчёт: список задач со статусами, что проверено, что осталось пользователю (выкладка на хостинг, проверка установки на Android по README).
