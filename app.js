// =============================================
// WM 2026 TIPPSPIEL – Hauptlogik
// Speicherung: localStorage (kein Server nötig)
// =============================================

// ---- STATE ----
let currentUser = null;
let isAdmin = false;

// ---- STORAGE HELPERS ----
function getStorage() {
  try {
    return JSON.parse(localStorage.getItem('wm2026') || '{}');
  } catch { return {}; }
}
function saveStorage(data) {
  localStorage.setItem('wm2026', JSON.stringify(data));
}

function getAllUsers() {
  return getStorage().users || {};
}
function saveUser(name, tips) {
  const data = getStorage();
  if (!data.users) data.users = {};
  data.users[name] = { ...(data.users[name] || {}), tips: tips || {} };
  saveStorage(data);
}
function getResults() {
  return getStorage().results || {};
}
function saveResults(results) {
  const data = getStorage();
  data.results = results;
  saveStorage(data);
}
function getUserTips(name) {
  const users = getAllUsers();
  return (users[name] && users[name].tips) ? users[name].tips : {};
}

// ---- ROUTING ----
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => {
    p.classList.add('hidden');
    p.classList.remove('active');
  });
  const page = document.getElementById('page-' + pageId);
  if (page) {
    page.classList.remove('hidden');
    page.classList.add('active');
  }
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
  const users = Object.keys(getAllUsers());
  const el = document.getElementById('existingNames');
  if (users.length === 0) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = '<p class="existing-label">Bereits dabei:</p>' +
    users.map(u => `<button class="name-chip" onclick="quickLogin('${escapeHtml(u)}')">${escapeHtml(u)}</button>`).join('');
}

function quickLogin(name) {
  currentUser = name;
  // ensure user exists
  const tips = getUserTips(name);
  saveUser(name, tips);
  afterLogin();
}

function afterLogin() {
  document.getElementById('page-login').classList.add('hidden');
  document.getElementById('currentUserName').textContent = currentUser;
  document.querySelector('.main-nav').classList.remove('hidden-nav');
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
  link.addEventListener('click', e => {
    e.preventDefault();
    if (!currentUser) { showToast('Bitte zuerst einloggen!'); return; }
    showPage(link.dataset.page);
  });
});

// ---- ADMIN ----
document.getElementById('adminToggleBtn').addEventListener('click', () => {
  if (isAdmin) { showPage('admin'); return; }
  document.getElementById('adminModal').classList.remove('hidden');
  document.getElementById('adminPwInput').focus();
});
document.getElementById('adminCancelBtn').addEventListener('click', () => {
  document.getElementById('adminModal').classList.add('hidden');
});
document.getElementById('adminLoginBtn').addEventListener('click', () => {
  const pw = document.getElementById('adminPwInput').value;
  if (pw === ADMIN_PASSWORD) {
    isAdmin = true;
    document.getElementById('adminModal').classList.add('hidden');
    document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
    document.getElementById('adminToggleBtn').textContent = '⚙️ Admin';
    if (!currentUser) currentUser = '_admin_';
    document.getElementById('page-login').classList.add('hidden');
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
  const tips = getUserTips(currentUser);
  const container = document.getElementById('groupsContainer');
  container.innerHTML = '';

  WM_GROUPS.forEach(group => {
    const section = document.createElement('div');
    section.className = 'group-section';
    section.innerHTML = `<h3 class="group-title">${group.name} <span class="group-teams">${group.teams.join(' · ')}</span></h3>`;

    const gamesEl = document.createElement('div');
    gamesEl.className = 'games-list';

    group.games.forEach(game => {
      const tip = tips[game.id] || { home: '', away: '' };
      const isSaved = tip.home !== '' && tip.away !== '';
      const dateStr = formatDate(game.date, game.time);
      const results = getResults();
      const result = results[game.id];
      let pointsBadge = '';
      if (result && isSaved) {
        const pts = calcPoints(tip, result);
        if (pts === 3) pointsBadge = '<span class="pts-badge exact">+3</span>';
        else if (pts === 1) pointsBadge = '<span class="pts-badge tendency">+1</span>';
        else pointsBadge = '<span class="pts-badge none">0</span>';
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

  // Save on change
  container.querySelectorAll('.score-input').forEach(input => {
    input.addEventListener('input', () => handleTipInput(input));
  });

  updateProgress();
}

function handleTipInput(input) {
  const id = input.dataset.id;
  const side = input.dataset.side;
  const tips = getUserTips(currentUser);
  if (!tips[id]) tips[id] = { home: '', away: '' };
  tips[id][side] = input.value;

  // auto-save when both sides filled
  const row = document.querySelector(`.game-row[data-id="${id}"]`);
  const homeVal = row.querySelector('[data-side="home"]').value;
  const awayVal = row.querySelector('[data-side="away"]').value;

  if (homeVal !== '' && awayVal !== '') {
    tips[id] = { home: homeVal, away: awayVal };
    saveUser(currentUser, tips);
    row.classList.add('saved');
    const mark = document.getElementById('mark-' + id);
    if (mark) mark.textContent = '✓';
    updateProgress();
  } else {
    tips[id] = { home: homeVal, away: awayVal };
    saveUser(currentUser, tips);
    row.classList.remove('saved');
    const mark = document.getElementById('mark-' + id);
    if (mark) mark.textContent = '';
  }
}

function updateProgress() {
  const tips = getUserTips(currentUser);
  const done = Object.values(tips).filter(t => t.home !== '' && t.away !== '').length;
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

  gameSelect.addEventListener('change', renderOverviewTable);
  renderOverviewTable();
}

function renderOverviewTable() {
  const gameId = document.getElementById('gameSelect').value;
  const game = ALL_GAMES.find(g => g.id === gameId);
  const users = getAllUsers();
  const results = getResults();
  const result = results[gameId];
  const container = document.getElementById('overviewContainer');

  let rows = Object.entries(users)
    .filter(([name]) => name !== '_admin_')
    .map(([name, data]) => {
      const tip = (data.tips && data.tips[gameId]) || null;
      const pts = (tip && tip.home !== '' && tip.away !== '' && result) ? calcPoints(tip, result) : null;
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
          <tr>
            <td>${escapeHtml(r.name)}</td>
            <td>${r.tip && r.tip.home !== '' ? `<strong>${r.tip.home} : ${r.tip.away}</strong>` : '<span class="no-tip">–</span>'}</td>
            <td>${r.pts !== null ? `<span class="pts-badge ${r.pts === 3 ? 'exact' : r.pts === 1 ? 'tendency' : 'none'}">${r.pts}</span>` : '–'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ---- RANKING ----
function renderRanking() {
  const users = getAllUsers();
  const results = getResults();
  const container = document.getElementById('rankingContainer');

  const ranked = Object.entries(users)
    .filter(([name]) => name !== '_admin_')
    .map(([name, data]) => {
      const tips = data.tips || {};
      let exact = 0, tendency = 0, total = 0, tipped = 0;
      ALL_GAMES.forEach(game => {
        const result = results[game.id];
        const tip = tips[game.id];
        if (tip && tip.home !== '' && tip.away !== '') tipped++;
        if (result && tip && tip.home !== '' && tip.away !== '') {
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
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Punkte</th>
          <th>Exakt ✓✓</th>
          <th>Tendenz ✓</th>
          <th>Getippt</th>
        </tr>
      </thead>
      <tbody>
        ${ranked.map((r, i) => `
          <tr class="${i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : ''}${r.name === currentUser ? ' current-user' : ''}">
            <td class="rank-pos">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
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
  const results = getResults();
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
      const dateStr = formatDate(game.date, game.time);

      const gameEl = document.createElement('div');
      gameEl.className = 'game-row admin-row' + (isSaved ? ' saved' : '');
      gameEl.innerHTML = `
        <div class="game-meta">${dateStr} · ${game.venue}</div>
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
  const side = input.dataset.side;
  const results = getResults();
  if (!results[id]) results[id] = { home: '', away: '' };
  results[id][side] = input.value;

  const row = input.closest('.game-row');
  const homeVal = row.querySelector('[data-side="home"]').value;
  const awayVal = row.querySelector('[data-side="away"]').value;

  if (homeVal !== '' && awayVal !== '') {
    results[id] = { home: homeVal, away: awayVal };
    saveResults(results);
    row.classList.add('saved');
    const mark = document.getElementById('admin-mark-' + id);
    if (mark) mark.textContent = '✓';
    showToast('Ergebnis gespeichert ✓');
  } else {
    results[id] = { home: homeVal, away: awayVal };
    saveResults(results);
    row.classList.remove('saved');
    const mark = document.getElementById('admin-mark-' + id);
    if (mark) mark.textContent = '';
  }
}

// ---- POINTS CALC ----
function calcPoints(tip, result) {
  const th = parseInt(tip.home), ta = parseInt(tip.away);
  const rh = parseInt(result.home), ra = parseInt(result.away);
  if (isNaN(th) || isNaN(ta) || isNaN(rh) || isNaN(ra)) return 0;
  if (th === rh && ta === ra) return 3; // exaktes Ergebnis
  const tipTendency = Math.sign(th - ta);
  const resTendency = Math.sign(rh - ra);
  if (tipTendency === resTendency) return 1; // richtige Tendenz
  return 0;
}

// ---- HELPERS ----
function formatDate(dateStr, time) {
  const d = new Date(dateStr + 'T' + time + ':00');
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }) + ' · ' + time + ' Uhr';
}
function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  t.classList.add('show');
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.classList.add('hidden'), 300); }, 2000);
}

// ---- INIT ----
renderLoginNames();
