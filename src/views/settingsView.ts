import { t } from '../i18n';
import { getSettings, setSettings, subscribe } from '../settings';
import { renderDataCard } from '../dataio';
import { el } from '../ui/dom';

let currentRoot: HTMLElement | null = null;
let lastToday = new Date();
let unsub: (() => void) | null = null;

export function renderSettingsView(root: HTMLElement, today: Date = new Date()): void {
  currentRoot = root;
  lastToday = today;
  if (!unsub) unsub = subscribe(draw);
  draw();
}

function draw(): void {
  const root = currentRoot;
  if (!root) return;
  const settings = getSettings();
  root.innerHTML = '';

  const title = el('div', 'section-title');
  title.textContent = t('tabs.settings');
  root.appendChild(title);

  root.appendChild(drawThemeCard(settings.theme));
  root.appendChild(drawCountLightCard(settings.countLight));

  const data = el('div');
  data.id = 'data-mount';
  renderDataCard(data, lastToday);
  root.appendChild(data);
}

function drawThemeCard(theme: 'light' | 'grey' | 'dark'): HTMLElement {
  const card = el('div', 'card settings-card');
  const label = el('div', 'card-label');
  label.textContent = t('settings.theme');
  const pill = el('div', 'theme-pill');
  const labels: Record<'light' | 'grey' | 'dark', string> = {
    light: 'settings.themeLight',
    grey: 'settings.themeRose',
    dark: 'settings.themeDark',
  };
  for (const option of ['light', 'grey', 'dark'] as const) {
    const btn = el('button', 'theme-btn' + (theme === option ? ' active' : ''));
    btn.type = 'button';
    btn.dataset.theme = option;
    btn.textContent = t(labels[option]);
    btn.addEventListener('click', () => setSettings({ theme: option }));
    pill.appendChild(btn);
  }
  card.append(label, pill);
  return card;
}

function drawCountLightCard(countLight: boolean): HTMLElement {
  const card = el('div', 'card settings-card');
  const row = el('label', 'toggle-row');

  const text = el('div', 'toggle-text');
  const name = el('div', 'toggle-name');
  name.textContent = t('settings.countLight');
  const hint = el('div', 'toggle-hint');
  hint.textContent = t('settings.countLightHint');
  text.append(name, hint);

  const toggle = el('input', 'toggle') as HTMLInputElement;
  toggle.type = 'checkbox';
  toggle.checked = countLight;
  toggle.addEventListener('change', () => setSettings({ countLight: toggle.checked }));

  row.append(text, toggle);
  card.appendChild(row);
  return card;
}
