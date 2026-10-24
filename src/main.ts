import './styles.css';
import { getLang, setLang, t, type Lang } from './i18n';
import { renderCalendarView } from './views/calendarView';
import { renderStatsView } from './views/statsView';

export function mountApp(): void {
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = '';

  const header = document.createElement('header');
  header.className = 'header';
  const title = document.createElement('span');
  title.className = 'app-title';
  title.textContent = 'MmmDays';
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
  header.append(title, langPill);

  const calendarView = document.createElement('main');
  calendarView.id = 'view-calendar';
  const statsView = document.createElement('main');
  statsView.id = 'view-stats';
  statsView.hidden = true;

  const tabbar = document.createElement('nav');
  tabbar.className = 'tabbar';
  for (const view of ['view-calendar', 'view-stats'] as const) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tab-btn' + (view === 'view-calendar' ? ' active' : '');
    btn.dataset.view = view;
    btn.textContent = t(view === 'view-calendar' ? 'tabs.calendar' : 'tabs.stats');
    btn.addEventListener('click', () => {
      for (const other of tabbar.querySelectorAll('.tab-btn')) other.classList.remove('active');
      btn.classList.add('active');
      calendarView.hidden = view !== 'view-calendar';
      statsView.hidden = view !== 'view-stats';
    });
    tabbar.appendChild(btn);
  }

  app.append(header, calendarView, statsView, tabbar);
  renderCalendarView(calendarView);
  renderStatsView(statsView);
}

if (document.getElementById('app')) {
  mountApp();
}
