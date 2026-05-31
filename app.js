// =============================================
// WM 2026 TIPPSPIEL – Hauptlogik
// Backend: Google Apps Script + Google Sheets
// =============================================

// ⚠️ HIER DEINE GOOGLE APPS SCRIPT URL EINTRAGEN:
const SCRIPT_URL = "DEINE_SCRIPT_URL_HIER_EINTRAGEN";

// ---- STATE ----
let currentUser = null;
let isAdmin = false;
let allTips = {};   // { userName: { gameId: { home, away } } }
let results = {};   // { gameId: { home, away } }
let savingQueue = {}; // debounce

// ---- API ----
async function apiGet(action) {
  const res = await fetch(`${SCRIPT_URL}?action=${action}`);
  return res.json();
}
async function apiPost(body) {
  await fetch(SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

async function loadAllData() {
  showLoading(true);
  try {
    const [tips, res] = await Promise.all([
      apiGet("getAllTips"),
      apiGet("getResults")
    ]);
    allTips = tips || {};
    results = res || {};
  } catch (e) {
    showToast("Verbindungsfehler – prüfe die Script-URL");
  }
  showLoading(false);
}

function showLoading(show) {
  document.getElementById('loadingOverlay').classList.toggle('hidden', !show);
}

// ---- STORAGE (lokale Hilfsfunktion für Nutzernamen-Liste) ----
function getKnownUsers() {
  try { return JSON.parse(localStorage.getItem('wm2026_users') || '[]'); } catch { return []; }
}
function addKnownUser(name) {
  const users = getKnownUsers();
  if (!users.includes(name)) { users.push(name); localStorage.setItem('wm2026_users', JSON.stringify(users)); }
}

// ---- ROUTING ----
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => {
    p.classList.add('hidden');
    p.classList.remove('active');
  });
  const page = document.getElementById('page-' + pageId);
  if (page) { page.classList.remove('hidden'); page.classList.add('active'); }
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.page === pageId);
  });
  if (pageId === 'home') renderHome();
  if (pageId === 'overview') renderOverview();
  if (pageId === 'ranking') renderRanking();
  if (pageId === 'admin') renderAdmin();
}

// ---- LOGIN ----
function renderLoginNames() {
  const users = getKnownUsers();
  const el = document.getElementById('existingNames');
  if (users.length === 0) { el.innerHTML = ''; return; }
  el.innerHTML = '<p class="existing-label">Zuletzt dabei:</p>' +
    users.map(u => `<button class="name-chip" onclick="quickLogin('${escapeHtml(u)}')">${escapeHtml(u)}</button>`).join('');
}

async function quickLogin(name) {
  currentUser = name;
  addKnownUser(name);
  document.getElementById('page-login').classList.add('hidden');
  document.getElementById('currentUserName').textContent = name;
  await loadAllData();
  showPage('home');
}

document.getElementById('loginBtn').addEventListener('click', () => {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) { showToast('Bitte gib deinen Namen ein!'); return; }
  quickLogin(name);
});
document.getElementById('nameInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('loginBtn').click();
});

// ---- NAV ----
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', async e => {
    e.preventDefault();
    if (!currentUser) { showToast('Bitte zuerst einloggen!'); return; }
    await loadAllData();
    showPage(link.dataset.page);
  });
});

// ---- ADMIN ----
document.getElementById('adminToggleBtn').addEventListener('click', () => {
  if (isAdmin) { loadAllData().then(() => showPage('admin')); return; }
  document.getElementById('adminModal').classList.remove('hidden');
  document.getElementById('adminPwInput').focus();
});
document.getElementById('adminCancelBtn').addEventListener('click', () => {
  document.getElementById('adminModal').classList.add('hidden');
});
document.getElementById('adminLoginBtn').addEventListener('click', async () => {
  const pw = document.getElementById('adminPwInput').value;
  if (pw === ADMIN_PASSWORD) {
    isAdmin = true;
    document.getElementById('adminModal').classList.add('hidden');
    document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
    document.getElementById('adminToggleBtn').textContent = '⚙️ Admin';
    if (!currentUser) currentUser = '_admin_';
    document.getElementById('page-login').classList.add('hidden');
    await loadAllData();
    showPage('admin');
    showToast('Admin-Modus aktiviert ✓');
  } else {
    showToast('Falsches Passwort!');
  }
});
document.getElementById('adminPwInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('adminLoginBtn').click();
});

// ---- HOME: Tipps eingeben ----
function renderHome() {
  if (!currentUser) return;
  const myTips = allTips[currentUser] || {};
  const container = document.getElementById('groupsContainer');
  container.innerHTML = '';

  WM_GROUPS.forEach(group => {
    const section = document.createElement('div');
    section.className = 'group-section';
    section.innerHTML = `<h3 class="group-title">${group.name} <span class="group-teams">${group.teams.join(' · ')}</span></h3>`;

    const gamesEl = document.createElement('div');
    gamesEl.className = 'games-list';

    group.games.forEach(game => {
      const tip = myTips[game.id] || { home: '', away: '' };
      const isSaved = tip.home !== '' && tip.away !== '';
      const dateStr = formatDate(game.date, game.time);
      const result = results[game.id];
      let pointsBadge = '';
      if (result && isSaved) {
        const pts = calcPoints(tip, result);
        if (pts === 3) pointsBadge = '<span class="pts-badge exact">+3</span>';
        else if (pts === 1) pointsBadge = '<span class="pts-badge tendency">+1</span>';
        else pointsBadge = '<span class="pts-badge none">+0</span>';
      }

      const gameEl = document.createElement('div');
      gameEl.className = 'game-row' + (isSaved ? ' saved' : '');
      gameEl.dataset.id = game.id;
      gameEl.innerHTML = `
        <div class="game-meta">${dateStr} · ${game.venue}</div>
        <div class="game-inner">
          <span class="team home-team">${game.home}</span>
          <div class="score-inputs">
            <input type="number" min="0" max="99" class="score-input" data-id="${game.id}" data-side="home" value="${tip.home}" placeholder="–">
            <span class="score-colon">:</span>
            <input type="number" min="0" max="99" class="score-input" data-id="${game.id}" data-side="away" value="${tip.away}" placeholder="–">
          </div>
          <span class="team away-team">${game.away}</span>
          <span class="saved-mark" id="mark-${game.id}">${isSaved ? '✓' : ''}</span>
          ${pointsBadge}
        </div>
        ${result ? `<div class="actual-result">Ergebnis: <strong>${result.home}:${result.away}</strong></div>` : ''}
      `;
      gamesEl.appendChild(gameEl);
    });

    section.appendChild(gamesEl);
    container.appendChild(section);
  });

  container.querySelectorAll('.score-input').forEach(input => {
    input.addEventListener('input', () => handleTipInput(input));
  });

  updateProgress();
}

function handleTipInput(input) {
  const id = input.dataset.id;
  const row = document.querySelector(`.game-row[data-id="${id}"]`);
  const homeVal = row.querySelector('[data-side="home"]').value;
  const awayVal = row.querySelector('[data-side="away"]').value;

  // Update local state
  if (!allTips[currentUser]) allTips[currentUser] = {};
  allTips[currentUser][id] = { home: homeVal, away: awayVal };

  const mark = document.getElementById('mark-' + id);

  if (homeVal !== '' && awayVal !== '') {
    row.classList.add('saved');
    if (mark) mark.textContent = '⏳';

    // Debounce: save after 800ms pause
    clearTimeout(savingQueue[id]);
    savingQueue[id] = setTimeout(async () => {
      await apiPost({ action: "saveTip", user: currentUser, gameId: id, home: homeVal, away: awayVal });
      if (mark) mark.textContent = '✓';
      updateProgress();
    }, 800);
  } else {
    row.classList.remove('saved');
    if (mark) mark.textContent = '';
    updateProgress();
  }
}

function updateProgress() {
  const myTips = allTips[currentUser] || {};
  const done = Object.values(myTips).filter(t => t.home !== '' && t.away !== '').length;
  const total = ALL_GAMES.length;
  const pct = Math.round((done / total) * 100);
  document.getElementById('progressBar').style.width = pct + '%';
  document.getElementById('progressText').textContent = `${done} von ${total} Spielen getippt`;
}

// ---- OVERVIEW ----
function renderOverview() {
  const gameSelect = document.getElementById('gameSelect');
  gameSelect.innerHTML = ALL_GAMES.map(g =>
    `<option value="${g.id}">${g.group}: ${g.home} vs ${g.away} (${formatDateShort(g.date)})</option>`
  ).join('');
  gameSelect.removeEventListener('change', renderOverviewTable);
  gameSelect.addEventListener('change', renderOverviewTable);
  renderOverviewTable();
}

function renderOverviewTable() {
  const gameId = document.getElementById('gameSelect').value;
  const game = ALL_GAMES.find(g => g.id === gameId);
  const result = results[gameId];
  const container = document.getElementById('overviewContainer');

  const rows = Object.entries(allTips)
    .filter(([name]) => name !== '_admin_')
    .map(([name, tips]) => {
      const tip = (tips && tips[gameId] && tips[gameId].home !== '') ? tips[gameId] : null;
      const pts = (tip && result) ? calcPoints(tip, result) : null;
      return { name, tip, pts };
    });

  if (rows.length === 0) {
    container.innerHTML = '<p class="empty">Noch niemand hat getippt.</p>';
    return;
  }

  container.innerHTML = `
    <div class="overview-game-header">
      <span class="ov-team">${game.home}</span>
      <span class="ov-vs">vs</span>
      <span class="ov-team">${game.away}</span>
      ${result ? `<span class="ov-result">Ergebnis: <strong>${result.home}:${result.away}</strong></span>` : ''}
    </div>
    <table class="overview-table">
      <thead><tr><th>Name</th><th>Tipp</th><th>Punkte</th></tr></thead>
      <tbody>
        ${rows.map(r => `
          <tr${r.name === currentUser ? ' class="current-user"' : ''}>
            <td>${escapeHtml(r.name)}${r.name === currentUser ? ' <span class="you-badge">Du</span>' : ''}</td>
            <td>${r.tip ? `<strong>${r.tip.home} : ${r.tip.away}</strong>` : '<span class="no-tip">–</span>'}</td>
            <td>${r.pts !== null ? `<span class="pts-badge ${r.pts === 3 ? 'exact' : r.pts === 1 ? 'tendency' : 'none'}">${r.pts}</span>` : '–'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ---- RANKING ----
function renderRanking() {
  const container = document.getElementById('rankingContainer');

  const ranked = Object.entries(allTips)
    .filter(([name]) => name !== '_admin_')
    .map(([name, tips]) => {
      let exact = 0, tendency = 0, total = 0, tipped = 0;
      ALL_GAMES.forEach(game => {
        const result = results[game.id];
        const tip = tips[game.id];
        if (tip && tip.home !== '') tipped++;
        if (result && tip && tip.home !== '') {
          const pts = calcPoints(tip, result);
          total += pts;
          if (pts === 3) exact++;
          if (pts === 1) tendency++;
        }
      });
      return { name, total, exact, tendency, tipped };
    })
    .sort((a, b) => b.total - a.total || b.exact - a.exact);

  if (ranked.length === 0) {
    container.innerHTML = '<p class="empty">Noch keine Teilnehmer.</p>';
    return;
  }

  container.innerHTML = `
    <table class="ranking-table">
      <thead>
        <tr><th>#</th><th>Name</th><th>Punkte</th><th>Exakt</th><th>Tendenz</th><th>Getippt</th></tr>
      </thead>
      <tbody>
        ${ranked.map((r, i) => `
          <tr class="${['rank-1','rank-2','rank-3'][i]||''}${r.name === currentUser ? ' current-user' : ''}">
            <td class="rank-pos">${['🥇','🥈','🥉'][i] || i+1}</td>
            <td>${escapeHtml(r.name)}${r.name === currentUser ? ' <span class="you-badge">Du</span>' : ''}</td>
            <td class="pts-col"><strong>${r.total}</strong></td>
            <td>${r.exact}</td>
            <td>${r.tendency}</td>
            <td>${r.tipped}/${ALL_GAMES.length}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ---- ADMIN ----
function renderAdmin() {
  const container = document.getElementById('adminContainer');
  container.innerHTML = '';

  WM_GROUPS.forEach(group => {
    const section = document.createElement('div');
    section.className = 'group-section';
    section.innerHTML = `<h3 class="group-title">${group.name}</h3>`;
    const gamesEl = document.createElement('div');
    gamesEl.className = 'games-list';

    group.games.forEach(game => {
      const result = results[game.id] || { home: '', away: '' };
      const isSaved = result.home !== '' && result.away !== '';

      const gameEl = document.createElement('div');
      gameEl.className = 'game-row admin-row' + (isSaved ? ' saved' : '');
      gameEl.innerHTML = `
        <div class="game-meta">${formatDate(game.date, game.time)} · ${game.venue}</div>
        <div class="game-inner">
          <span class="team home-team">${game.home}</span>
          <div class="score-inputs">
            <input type="number" min="0" max="99" class="admin-input" data-id="${game.id}" data-side="home" value="${result.home}" placeholder="–">
            <span class="score-colon">:</span>
            <input type="number" min="0" max="99" class="admin-input" data-id="${game.id}" data-side="away" value="${result.away}" placeholder="–">
          </div>
          <span class="team away-team">${game.away}</span>
          <span class="saved-mark" id="admin-mark-${game.id}">${isSaved ? '✓' : ''}</span>
        </div>
      `;
      gamesEl.appendChild(gameEl);
    });

    section.appendChild(gamesEl);
    container.appendChild(section);
  });

  container.querySelectorAll('.admin-input').forEach(input => {
    input.addEventListener('input', () => handleAdminInput(input));
  });
}

function handleAdminInput(input) {
  const id = input.dataset.id;
  const row = input.closest('.game-row');
  const homeVal = row.querySelector('[data-side="home"]').value;
  const awayVal = row.querySelector('[data-side="away"]').value;
  const mark = document.getElementById('admin-mark-' + id);

  results[id] = { home: homeVal, away: awayVal };

  if (homeVal !== '' && awayVal !== '') {
    row.classList.add('saved');
    if (mark) mark.textContent = '⏳';
    clearTimeout(savingQueue['admin_' + id]);
    savingQueue['admin_' + id] = setTimeout(async () => {
      await apiPost({ action: "saveResult", gameId: id, home: homeVal, away: awayVal });
      if (mark) mark.textContent = '✓';
      showToast('Ergebnis gespeichert ✓');
    }, 800);
  } else {
    row.classList.remove('saved');
    if (mark) mark.textContent = '';
  }
}

// ---- POINTS ----
function calcPoints(tip, result) {
  const th = parseInt(tip.home), ta = parseInt(tip.away);
  const rh = parseInt(result.home), ra = parseInt(result.away);
  if (isNaN(th)||isNaN(ta)||isNaN(rh)||isNaN(ra)) return 0;
  if (th === rh && ta === ra) return 3;
  if (Math.sign(th - ta) === Math.sign(rh - ra)) return 1;
  return 0;
}

// ---- HELPERS ----
function formatDate(dateStr, time) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('de-DE', { weekday:'short', day:'2-digit', month:'2-digit' }) + ' · ' + time + ' Uhr';
}
function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit' });
}
function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  t.classList.add('show');
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.classList.add('hidden'), 300); }, 2500);
}

// ---- INIT ----
renderLoginNames();

// Überprüfe ob Script-URL gesetzt ist
if (SCRIPT_URL === "DEINE_SCRIPT_URL_HIER_EINTRAGEN") {
  setTimeout(() => {
    document.getElementById('page-login').innerHTML = `
      <div class="login-hero">
        <div class="login-card">
          <div style="font-size:48px;margin-bottom:16px">⚠️</div>
          <h1 style="font-size:24px;margin-bottom:12px">Setup erforderlich</h1>
          <p style="color:#8b949e;line-height:1.7">
            Bitte lies die <strong>Anleitung</strong> weiter unten und trage deine<br>
            Google Apps Script URL in der Datei <code>app.js</code> ein.<br><br>
            <strong>SCRIPT_URL = "DEINE_URL_HIER"</strong>
          </p>
        </div>
      </div>
    `;
  }, 100);
}
