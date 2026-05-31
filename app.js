// =============================================
// WM 2026 TIPPSPIEL – Hauptlogik
// =============================================

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwhZCHUYcrTuRA_xtPUX_nrEtaTD8uyo8Kfdl-iz21BzvSU31uIihAPcMt7Ryvsd1nc/exec";

// ---- STATE ----
let currentUser = null;
let isAdmin = false;
let allTips = {};
let results = {};
let koGameData = {}; // gespeicherte KO-Spieldaten (Mannschaften, Venue, Zeit)
let savingQueue = {};

// ---- NAMEN NORMALISIEREN ----
function normalizeName(name) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
    .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ---- API ----
async function apiCall(params) {
  const url = SCRIPT_URL + "?" + new URLSearchParams(params).toString();
  const res = await fetch(url);
  return res.json();
}

async function loadAllData() {
  showLoading(true);
  try {
    const [tips, res, koData] = await Promise.all([
      apiCall({ action: "getAllTips" }),
      apiCall({ action: "getResults" }),
      apiCall({ action: "getKoGames" })
    ]);
    allTips = tips || {};
    results = res || {};
    koGameData = koData || {};
    applyKoGameData();
  } catch (e) {
    showToast("⚠️ Verbindungsfehler – prüfe die Script-URL");
    console.error(e);
  }
  showLoading(false);
}

function applyKoGameData() {
  // KO-Spieldaten (Mannschaften, Venue) aus dem Sheet in KO_ROUNDS einpflegen
  KO_ROUNDS.forEach(round => {
    round.games.forEach(game => {
      if (koGameData[game.id]) {
        const d = koGameData[game.id];
        if (d.home) game.home = d.home;
        if (d.away) game.away = d.away;
        if (d.venue) game.venue = d.venue;
        if (d.time) game.time = d.time;
        if (d.date) game.date = d.date;
        game.unlocked = d.unlocked === "1" || d.unlocked === true;
      }
    });
  });
}

function showLoading(show) {
  document.getElementById('loadingOverlay').classList.toggle('hidden', !show);
}

// ---- NUTZER-VERWALTUNG (lokal) ----
function getKnownUsers() {
  try { return JSON.parse(localStorage.getItem('wm2026_users') || '[]'); } catch { return []; }
}
function addKnownUser(name) {
  const users = getKnownUsers();
  const norm = normalizeName(name);
  // Entferne alte Varianten desselben Namens, füge normalisierten hinzu
  const filtered = users.filter(u => normalizeName(u) !== norm);
  filtered.unshift(norm); // neueste zuerst
  localStorage.setItem('wm2026_users', JSON.stringify(filtered.slice(0, 10)));
}
function getLastUser() {
  const users = getKnownUsers();
  return users.length ? users[0] : null;
}

// ---- ROUTING ----
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => { p.classList.add('hidden'); p.classList.remove('active'); });
  const page = document.getElementById('page-' + pageId);
  if (page) { page.classList.remove('hidden'); page.classList.add('active'); }
  document.querySelectorAll('.nav-link').forEach(a => a.classList.toggle('active', a.dataset.page === pageId));
  if (pageId === 'home') renderHome();
  if (pageId === 'overview') renderOverview();
  if (pageId === 'ranking') renderRanking();
  if (pageId === 'admin') renderAdmin();
}

// ---- LOGIN ----
function renderLoginPage() {
  const lastUser = getLastUser();
  const knownUsers = getKnownUsers();

  const returningEl = document.getElementById('returningUser');
  const newLoginEl = document.getElementById('newLogin');

  if (lastUser) {
    returningEl.classList.remove('hidden');
    document.getElementById('returningName').textContent = lastUser;
    newLoginEl.classList.add('hidden');
    document.getElementById('switchToNewLogin').classList.remove('hidden');
  } else {
    returningEl.classList.add('hidden');
    newLoginEl.classList.remove('hidden');
    document.getElementById('switchToNewLogin').classList.add('hidden');
  }

  // Andere bekannte User anzeigen (nicht der letzte)
  const othersEl = document.getElementById('otherUsers');
  const others = knownUsers.slice(1, 6);
  if (others.length) {
    othersEl.innerHTML = '<p class="existing-label">Andere:</p>' +
      others.map(u => `<button class="name-chip" onclick="quickLogin('${escapeHtml(u)}')">${escapeHtml(u)}</button>`).join('');
  } else {
    othersEl.innerHTML = '';
  }

  // Alle bekannten Teilnehmer auf Startseite (aus allTips)
  renderParticipants();
}

function renderParticipants() {
  const el = document.getElementById('participantsList');
  if (!el) return;
  const names = Object.keys(allTips).filter(n => n !== '_admin_');
  if (!names.length) { el.innerHTML = ''; return; }
  el.innerHTML = '<p class="existing-label">Bereits dabei:</p><div class="participants-chips">' +
    names.map(n => `<span class="participant-chip">${escapeHtml(n)}</span>`).join('') + '</div>';
}

async function quickLogin(name) {
  const norm = normalizeName(name);
  currentUser = norm;
  addKnownUser(norm);
  document.getElementById('page-login').classList.add('hidden');
  document.getElementById('currentUserName').textContent = norm;
  await loadAllData();
  showPage('home');
}

// Wiederkehrender Nutzer
document.getElementById('continueBtn').addEventListener('click', () => {
  const lastUser = getLastUser();
  if (lastUser) quickLogin(lastUser);
});

// Neuer Name
document.getElementById('loginBtn').addEventListener('click', () => {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) { showToast('Bitte gib deinen Namen ein!'); return; }
  quickLogin(name);
});
document.getElementById('nameInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('loginBtn').click();
});

// Umschalten zu neuem Login
document.getElementById('switchToNewLogin').addEventListener('click', () => {
  document.getElementById('returningUser').classList.add('hidden');
  document.getElementById('newLogin').classList.remove('hidden');
  document.getElementById('nameInput').focus();
});

// ---- NAV ----
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', async e => {
    e.preventDefault();
    if (!currentUser) return;
    await loadAllData();
    showPage(link.dataset.page);
  });
});

// ---- ADMIN ----
document.getElementById('adminToggleBtn').addEventListener('click', () => {
  if (isAdmin) { loadAllData().then(() => showPage('admin')); return; }
  document.getElementById('adminModal').classList.remove('hidden');
  document.getElementById('adminPwInput').value = '';
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

// ---- HOME – Gruppenphase + freigeschaltete KO-Spiele ----
function renderHome() {
  if (!currentUser) return;
  const myTips = allTips[currentUser] || {};
  const container = document.getElementById('groupsContainer');
  container.innerHTML = '';

  // Gruppenspiele
  WM_GROUPS.forEach(group => {
    const section = createGameSection(group.name,
      `<span class="group-teams">${group.teams.join(' · ')}</span>`,
      group.games, myTips);
    container.appendChild(section);
  });

  // KO-Runden – nur freigeschaltete Spiele anzeigen
  KO_ROUNDS.forEach(round => {
    const unlockedGames = round.games.filter(g => g.unlocked && g.home !== 'TBD' && g.away !== 'TBD');
    if (!unlockedGames.length) return;
    const section = createGameSection(round.name, '', unlockedGames, myTips);
    container.appendChild(section);
  });

  container.querySelectorAll('.score-input').forEach(input => {
    input.addEventListener('input', () => handleTipInput(input));
  });
  updateProgress();
}

// Gibt true zurück wenn Anpfiff bereits vorbei ist
function isGameLocked(game) {
  try {
    const [h, m] = game.time.split(':').map(Number);
    const kickoff = new Date(game.date + 'T00:00:00');
    kickoff.setHours(h, m, 0, 0);
    return Date.now() >= kickoff.getTime();
  } catch { return false; }
}

function createGameSection(title, subtitle, games, myTips) {
  const section = document.createElement('div');
  section.className = 'group-section';
  section.innerHTML = `<h3 class="group-title">${title} ${subtitle}</h3>`;
  const gamesEl = document.createElement('div');
  gamesEl.className = 'games-list';

  games.forEach(game => {
    const tip = myTips[game.id] || { home: '', away: '' };
    const isSaved = tip.home !== '' && tip.away !== '';
    const locked = isGameLocked(game);
    const result = results[game.id];
    let pointsBadge = '';
    if (result && isSaved) {
      const pts = calcPoints(tip, result);
      pointsBadge = `<span class="pts-badge ${pts===3?'exact':pts===1?'tendency':'none'}">${pts===3?'+3':pts===1?'+1':'+0'}</span>`;
    }
    const gameEl = document.createElement('div');
    gameEl.className = 'game-row' + (isSaved ? ' saved' : '') + (locked ? ' locked' : '');
    gameEl.dataset.id = game.id;
    gameEl.innerHTML = `
      <div class="game-meta">${formatDate(game.date, game.time)} · ${game.venue}${locked ? ' <span class="locked-badge">🔒 Gesperrt</span>' : ''}</div>
      <div class="game-inner">
        <span class="team home-team">${game.home}</span>
        <div class="score-inputs">
          <input type="number" min="0" max="99" class="score-input" data-id="${game.id}" data-side="home" value="${tip.home}" placeholder="–" ${locked ? 'disabled' : ''}>
          <span class="score-colon">:</span>
          <input type="number" min="0" max="99" class="score-input" data-id="${game.id}" data-side="away" value="${tip.away}" placeholder="–" ${locked ? 'disabled' : ''}>
        </div>
        <span class="team away-team">${game.away}</span>
        <span class="saved-mark" id="mark-${game.id}">${locked ? '🔒' : isSaved ? '✓' : ''}</span>
        ${pointsBadge}
      </div>
      ${result ? `<div class="actual-result">Ergebnis: <strong>${result.home}:${result.away}</strong></div>` : ''}
    `;
    gamesEl.appendChild(gameEl);
  });

  section.appendChild(gamesEl);
  return section;
}

function handleTipInput(input) {
  const id = input.dataset.id;
  const allGames = [...ALL_GROUP_GAMES, ...ALL_KO_GAMES];
  const game = allGames.find(g => g.id === id);
  if (game && isGameLocked(game)) return; // Sicherheitsnetz serverseitig
  const row = document.querySelector(`.game-row[data-id="${id}"]`);
  const homeVal = row.querySelector('[data-side="home"]').value;
  const awayVal = row.querySelector('[data-side="away"]').value;
  if (!allTips[currentUser]) allTips[currentUser] = {};
  allTips[currentUser][id] = { home: homeVal, away: awayVal };
  const mark = document.getElementById('mark-' + id);

  if (homeVal !== '' && awayVal !== '') {
    row.classList.add('saved');
    if (mark) mark.textContent = '⏳';
    clearTimeout(savingQueue[id]);
    savingQueue[id] = setTimeout(async () => {
      try {
        await apiCall({ action: "saveTip", user: currentUser, gameId: id, home: homeVal, away: awayVal });
        if (mark) mark.textContent = '✓';
      } catch(e) {
        if (mark) mark.textContent = '❌';
      }
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
  // Zähle nur tippbare Spiele (Gruppenspiele + freigeschaltete KO-Spiele)
  const tippableGames = [
    ...ALL_GROUP_GAMES,
    ...ALL_KO_GAMES.filter(g => g.unlocked && g.home !== 'TBD')
  ];
  const done = Object.entries(myTips).filter(([id, t]) => t.home !== '' && t.away !== '').length;
  const total = tippableGames.length;
  document.getElementById('progressBar').style.width = Math.round(done/total*100) + '%';
  document.getElementById('progressText').textContent = `${done} von ${total} Spielen getippt`;
}

// ---- OVERVIEW ----
function renderOverview() {
  const gameSelect = document.getElementById('gameSelect');
  const tippableGames = [
    ...ALL_GROUP_GAMES,
    ...ALL_KO_GAMES.filter(g => g.unlocked && g.home !== 'TBD')
  ];
  gameSelect.innerHTML = tippableGames.map(g =>
    `<option value="${g.id}">${g.round || g.group}: ${g.home} vs ${g.away} (${formatDateShort(g.date)})</option>`
  ).join('');
  gameSelect.onchange = renderOverviewTable;
  renderOverviewTable();
}

function renderOverviewTable() {
  const gameId = document.getElementById('gameSelect').value;
  const allGames = [...ALL_GROUP_GAMES, ...ALL_KO_GAMES];
  const game = allGames.find(g => g.id === gameId);
  const result = results[gameId];
  const container = document.getElementById('overviewContainer');

  const rows = Object.entries(allTips)
    .filter(([name]) => name !== '_admin_')
    .map(([name, tips]) => {
      const tip = (tips && tips[gameId] && tips[gameId].home !== '') ? tips[gameId] : null;
      const pts = (tip && result) ? calcPoints(tip, result) : null;
      return { name, tip, pts };
    });

  if (!rows.length) { container.innerHTML = '<p class="empty">Noch niemand hat getippt.</p>'; return; }

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
          <tr${r.name===currentUser?' class="current-user"':''}>
            <td>${escapeHtml(r.name)}${r.name===currentUser?' <span class="you-badge">Du</span>':''}</td>
            <td>${r.tip?`<strong>${r.tip.home} : ${r.tip.away}</strong>`:'<span class="no-tip">–</span>'}</td>
            <td>${r.pts!==null?`<span class="pts-badge ${r.pts===3?'exact':r.pts===1?'tendency':'none'}">${r.pts}</span>`:'–'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

// ---- RANKING ----
function renderRanking() {
  const container = document.getElementById('rankingContainer');
  const ranked = Object.entries(allTips)
    .filter(([name]) => name !== '_admin_')
    .map(([name, tips]) => {
      let exact=0, tendency=0, total=0, tipped=0;
      ALL_GAMES.forEach(game => {
        const result = results[game.id];
        const tip = tips[game.id];
        if (tip && tip.home !== '') tipped++;
        if (result && tip && tip.home !== '') {
          const pts = calcPoints(tip, result);
          total += pts;
          if (pts===3) exact++;
          if (pts===1) tendency++;
        }
      });
      return { name, total, exact, tendency, tipped };
    })
    .sort((a,b) => b.total-a.total || b.exact-a.exact);

  if (!ranked.length) { container.innerHTML = '<p class="empty">Noch keine Teilnehmer.</p>'; return; }

  container.innerHTML = `
    <table class="ranking-table">
      <thead><tr><th>#</th><th>Name</th><th>Punkte</th><th>Exakt</th><th>Tendenz</th><th>Getippt</th></tr></thead>
      <tbody>
        ${ranked.map((r,i) => `
          <tr class="${['rank-1','rank-2','rank-3'][i]||''}${r.name===currentUser?' current-user':''}">
            <td class="rank-pos">${['🥇','🥈','🥉'][i]||i+1}</td>
            <td>${escapeHtml(r.name)}${r.name===currentUser?' <span class="you-badge">Du</span>':''}</td>
            <td class="pts-col"><strong>${r.total}</strong></td>
            <td>${r.exact}</td><td>${r.tendency}</td><td>${r.tipped}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

// ---- ADMIN ----
function renderAdmin() {
  const container = document.getElementById('adminContainer');
  container.innerHTML = '';

  // Tab-Navigation
  const tabs = document.createElement('div');
  tabs.className = 'admin-tabs';
  tabs.innerHTML = `
    <button class="admin-tab active" data-tab="results">Ergebnisse eintragen</button>
    <button class="admin-tab" data-tab="ko">KO-Runden verwalten</button>
  `;
  container.appendChild(tabs);

  const resultsPanel = document.createElement('div');
  resultsPanel.id = 'adminResultsPanel';
  renderAdminResults(resultsPanel);
  container.appendChild(resultsPanel);

  const koPanel = document.createElement('div');
  koPanel.id = 'adminKoPanel';
  koPanel.classList.add('hidden');
  renderAdminKo(koPanel);
  container.appendChild(koPanel);

  tabs.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      resultsPanel.classList.toggle('hidden', tab.dataset.tab !== 'results');
      koPanel.classList.toggle('hidden', tab.dataset.tab !== 'ko');
    });
  });
}

function renderAdminResults(container) {
  // Gruppenspiele
  WM_GROUPS.forEach(group => {
    container.appendChild(createAdminResultSection(group.name, group.games));
  });

  // KO-Runden Ergebnisse (nur freigeschaltete)
  KO_ROUNDS.forEach(round => {
    const unlockedGames = round.games.filter(g => g.unlocked && g.home !== 'TBD');
    if (!unlockedGames.length) return;
    container.appendChild(createAdminResultSection(round.name, unlockedGames));
  });
}

function createAdminResultSection(title, games) {
  const section = document.createElement('div');
  section.className = 'group-section';
  section.innerHTML = `<h3 class="group-title">${title}</h3>`;
  const gamesEl = document.createElement('div');
  gamesEl.className = 'games-list';

  games.forEach(game => {
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
      </div>`;
    gamesEl.appendChild(gameEl);
  });

  section.appendChild(gamesEl);
  section.querySelectorAll('.admin-input').forEach(input => {
    input.addEventListener('input', () => handleAdminInput(input));
  });
  return section;
}

function renderAdminKo(container) {
  container.innerHTML = '<p class="page-sub">Trage hier die Mannschaften für die KO-Spiele ein und schalte sie zum Tippen frei.</p>';

  KO_ROUNDS.forEach(round => {
    const section = document.createElement('div');
    section.className = 'group-section';
    section.innerHTML = `<h3 class="group-title">${round.name}</h3>`;
    const gamesEl = document.createElement('div');
    gamesEl.className = 'games-list';

    round.games.forEach(game => {
      const saved = koGameData[game.id] || {};
      const isUnlocked = game.unlocked;
      const homeVal = saved.home || '';
      const awayVal = saved.away || '';
      const venueVal = saved.venue || game.venue;
      const timeVal = saved.time || game.time;

      const gameEl = document.createElement('div');
      gameEl.className = 'game-row admin-row ko-edit-row' + (isUnlocked ? ' saved' : '');
      gameEl.innerHTML = `
        <div class="game-meta">${game.label} · ${formatDate(game.date, game.time)}</div>
        <div class="ko-edit-inner">
          <input type="text" class="ko-team-input" data-id="${game.id}" data-field="home" value="${escapeHtml(homeVal)}" placeholder="Heim-Team">
          <span class="score-colon">vs</span>
          <input type="text" class="ko-team-input" data-id="${game.id}" data-field="away" value="${escapeHtml(awayVal)}" placeholder: "Auswärts-Team">
          <input type="text" class="ko-venue-input" data-id="${game.id}" data-field="venue" value="${escapeHtml(venueVal)}" placeholder="Stadion">
          <input type="text" class="ko-time-input" data-id="${game.id}" data-field="time" value="${escapeHtml(timeVal)}" placeholder="HH:MM">
        </div>
        <div class="ko-actions">
          <button class="btn-ko-save" data-id="${game.id}">💾 Speichern</button>
          <label class="ko-unlock-label">
            <input type="checkbox" class="ko-unlock-check" data-id="${game.id}" ${isUnlocked ? 'checked' : ''}>
            Zum Tippen freischalten
          </label>
          <span class="saved-mark" id="ko-mark-${game.id}">${isUnlocked ? '✓ Freigeschaltet' : ''}</span>
        </div>`;
      gamesEl.appendChild(gameEl);
    });

    section.appendChild(gamesEl);
    container.appendChild(section);
  });

  // Event-Listener für KO-Speichern
  container.querySelectorAll('.btn-ko-save').forEach(btn => {
    btn.addEventListener('click', () => saveKoGame(btn.dataset.id, container));
  });
  container.querySelectorAll('.ko-unlock-check').forEach(cb => {
    cb.addEventListener('change', () => saveKoGame(cb.dataset.id, container));
  });
}

async function saveKoGame(gameId, container) {
  const row = container.querySelector(`.ko-edit-row [data-id="${gameId}"][data-field="home"]`)?.closest('.game-row') ||
              container.querySelector(`[data-id="${gameId}"].btn-ko-save`)?.closest('.game-row');

  const homeInput = container.querySelector(`[data-id="${gameId}"][data-field="home"]`);
  const awayInput = container.querySelector(`[data-id="${gameId}"][data-field="away"]`);
  const venueInput = container.querySelector(`[data-id="${gameId}"][data-field="venue"]`);
  const timeInput = container.querySelector(`[data-id="${gameId}"][data-field="time"]`);
  const unlockCheck = container.querySelector(`.ko-unlock-check[data-id="${gameId}"]`);
  const mark = document.getElementById('ko-mark-' + gameId);

  const home = homeInput?.value.trim() || '';
  const away = awayInput?.value.trim() || '';
  const venue = venueInput?.value.trim() || '';
  const time = timeInput?.value.trim() || '';
  const unlocked = unlockCheck?.checked ? "1" : "0";

  if (mark) mark.textContent = '⏳';

  try {
    await apiCall({ action: "saveKoGame", gameId, home, away, venue, time, unlocked });
    koGameData[gameId] = { home, away, venue, time, unlocked };
    applyKoGameData();
    if (mark) mark.textContent = unlocked === "1" ? '✓ Freigeschaltet' : '✓ Gespeichert';
    showToast(`${gameId} gespeichert ✓`);
  } catch(e) {
    if (mark) mark.textContent = '❌';
    showToast('Fehler beim Speichern!');
  }
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
    clearTimeout(savingQueue['admin_'+id]);
    savingQueue['admin_'+id] = setTimeout(async () => {
      try {
        await apiCall({ action: "saveResult", gameId: id, home: homeVal, away: awayVal });
        if (mark) mark.textContent = '✓';
        showToast('Ergebnis gespeichert ✓');
      } catch(e) {
        if (mark) mark.textContent = '❌';
      }
    }, 800);
  } else {
    row.classList.remove('saved');
    if (mark) mark.textContent = '';
  }
}

// ---- PUNKTE ----
function calcPoints(tip, result) {
  const th=parseInt(tip.home), ta=parseInt(tip.away), rh=parseInt(result.home), ra=parseInt(result.away);
  if (isNaN(th)||isNaN(ta)||isNaN(rh)||isNaN(ra)) return 0;
  if (th===rh && ta===ra) return 3;
  if (Math.sign(th-ta)===Math.sign(rh-ra)) return 1;
  return 0;
}

// ---- HELPERS ----
function formatDate(dateStr, time) {
  const d = new Date(dateStr+'T12:00:00');
  return d.toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit'})+' · '+time+' Uhr';
}
function formatDateShort(dateStr) {
  return new Date(dateStr+'T12:00:00').toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'});
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
renderLoginPage();
