import './styles.css';
import { getLang, setLang, t, type Lang } from './i18n';
import { renderCalendarView } from './views/calendarView';
import { renderStatsView } from './views/statsView';
import { renderSettingsView } from './views/settingsView';
import { applyTheme, getSettings, subscribe as subscribeSettings } from './settings';

const TABS = [
  { view: 'view-calendar', label: 'tabs.calendar' },
  { view: 'view-stats', label: 'tabs.stats' },
  { view: 'view-settings', label: 'tabs.settings' },
] as const;

type ViewId = (typeof TABS)[number]['view'];

let settingsUnsub: (() => void) | null = null;

export function mountApp(): void {
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = '';
  applyTheme(getSettings().theme);

  const header = document.createElement('header');
  header.className = 'header';
  const title = document.createElement('span');
  title.className = 'app-title';
  title.textContent = 'MmmDays';
  const brand = document.createElement('div');
  brand.className = 'brand';
  const mark = document.createElement('span');
  mark.className = 'logo-mark';
  brand.append(mark, title);
  const langPill = document.createElement('div');
  langPill.className = 'lang-pill';
  for (const lang of ['ru', 'en'] as Lang[]) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lang-btn' + (getLang() === lang ? ' active' : '');
    btn.textContent = lang.toUpperCase();
    btn.addEventListener('click', () => {
      setLang(lang);
      mountApp();
    });
    langPill.appendChild(btn);
  }
  header.append(brand, langPill);

  const views = new Map<ViewId, HTMLElement>();
  for (const { view } of TABS) {
    const node = document.createElement('main');
    node.id = view;
    node.hidden = view !== 'view-calendar';
    views.set(view, node);
  }

  const tabbar = document.createElement('nav');
  tabbar.className = 'tabbar';
  for (const { view, label } of TABS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tab-btn' + (view === 'view-calendar' ? ' active' : '');
    btn.dataset.view = view;
    btn.textContent = t(label);
    btn.addEventListener('click', () => {
      for (const other of tabbar.querySelectorAll('.tab-btn')) other.classList.remove('active');
      btn.classList.add('active');
      for (const [id, node] of views) node.hidden = id !== view;
    });
    tabbar.appendChild(btn);
  }

  app.append(header, ...views.values(), tabbar);
  renderCalendarView(views.get('view-calendar')!);
  renderStatsView(views.get('view-stats')!);
  renderSettingsView(views.get('view-settings')!);

  // Settings changes (countLight) re-render the data views in place —
  // no remount, so the open tab and the carousel page survive.
  if (settingsUnsub) settingsUnsub();
  settingsUnsub = subscribeSettings(() => {
    renderCalendarView(views.get('view-calendar')!);
    renderStatsView(views.get('view-stats')!);
  });
}

if (document.getElementById('app')) {
  mountApp();
}
