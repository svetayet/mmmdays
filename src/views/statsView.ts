import { getLang, t } from '../i18n';
import { computeCycleStats } from '../logic/cycles';
import { fromKey } from '../logic/dates';
import { parsePeriods } from '../logic/periods';
import { getDays, subscribe } from '../store';
import { el } from '../ui/dom';
import { renderChart } from '../ui/chart';
import { renderMiniCal } from '../ui/miniCal';
import { renderDataCard } from '../dataio';

let currentRoot: HTMLElement | null = null;
let lastToday = new Date();
let unsub: (() => void) | null = null;

export function renderStatsView(root: HTMLElement, today: Date = new Date()): void {
  currentRoot = root;
  lastToday = today;
  if (!unsub) unsub = subscribe(draw);
  draw();
}

function draw(): void {
  const root = currentRoot;
  if (!root) return;
  const today = lastToday;
  const stats = computeCycleStats(parsePeriods(getDays()));
  const lang = getLang();
  root.innerHTML = '';

  const title = el('div', 'section-title');
  title.textContent = t('tabs.stats');
  root.appendChild(title);

  const cards = el('div', 'stats-cards');
  cards.appendChild(drawCard('card-last', t('stats.last'), formatDate(stats.starts.at(-1) ?? null, lang)));
  cards.appendChild(drawCard('card-forecast', t('stats.forecast'), formatForecast(stats.forecast, lang), true));
  root.appendChild(cards);

  const tiles = el('div', 'tiles');
  tiles.appendChild(drawTile(stats.avgCycle, t('stats.avgCycleLabel')));
  tiles.appendChild(drawTile(stats.avgDuration, t('stats.avgDurationLabel')));
  tiles.appendChild(
    stats.regularity === null
      ? drawTile(null, t('stats.malo'))
      : drawTile(t(`stats.rhythm.${stats.regularity}`), t('stats.rhythmLabel')),
  );
  root.appendChild(tiles);

  const chartMount = el('div', 'card chart-card');
  renderChart(chartMount, today);
  root.appendChild(chartMount);

  const miniCal = el('div');
  miniCal.id = 'mini-cal-mount';
  renderMiniCal(miniCal, today);
  root.appendChild(miniCal);
  const data = el('div');
  data.id = 'data-mount';
  renderDataCard(data, today);
  root.appendChild(data);
}

function drawCard(className: string, label: string, value: string, accent = false): HTMLElement {
  const card = el('div', `card ${className}`);
  const labelEl = el('div', 'card-label');
  labelEl.textContent = label;
  const valueEl = el('div', 'card-value');
  if (accent) valueEl.classList.add('accent');
  valueEl.textContent = value;
  card.append(labelEl, valueEl);
  return card;
}

function drawTile(value: string | number | null, label: string): HTMLElement {
  const tile = el('div', 'card tile');
  const valueEl = el('div', 'tile-value');
  valueEl.textContent = value === null ? '—' : String(value);
  const labelEl = el('div', 'tile-label');
  labelEl.textContent = label;
  tile.append(valueEl, labelEl);
  return tile;
}

/** «21 октября» / 'October 21' via Intl long month. */
function formatDate(key: string | null, lang: 'ru' | 'en'): string {
  if (key === null) return '—';
  return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long' }).format(fromKey(key));
}

function formatForecast(key: string | null, lang: 'ru' | 'en'): string {
  if (key === null) return '—';
  return `≈ ${formatDate(key, lang)}`;
}
