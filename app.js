// =============================================
// WM 2026 TIPPSPIEL – Hauptlogik
// =============================================

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwhZCHUYcrTuRA_xtPUX_nrEtaTD8uyo8Kfdl-iz21BzvSU31uIihAPcMt7Ryvsd1nc/exec";

// ---- STATE ----
let currentUser = null;
let isAdmin = false;
let allTips = {};
let results = {};
let koGameData = {};
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

// ---- NUTZER-VERWALTUNG ----
function getKnownUsers() {
  try { return JSON.parse(localStorage.getItem('wm2026_users') || '[]'); } catch { return []; }
}
function addKnownUser(name) {
  const users = getKnownUsers();
  const norm = normalizeName(name);
  const filtered = users.filter(u => normalizeName(u) !== norm);
  filtered.unshift(norm);
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
  document.querySelectorAll('.nav-link, .bottom-nav-item').forEach(a => a.classList.toggle('active', a.dataset.page === pageId));
  if (pageId === 'home') renderHome();
  if (pageId === 'today') renderToday();
  if (pageId === 'overview') renderOverview();
  if (pageId === 'ranking') renderRanking();
  if (pageId === 'verlauf') renderVerlauf();
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

  const othersEl = document.getElementById('otherUsers');
  const others = knownUsers.slice(1, 6);
  if (others.length) {
    othersEl.innerHTML = '<p class="existing-label">Andere:</p>' +
      others.map(u => `<button class="name-chip" onclick="quickLogin('${escapeHtml(u)}')">${escapeHtml(u)}</button>`).join('');
  } else {
    othersEl.innerHTML = '';
  }
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

document.getElementById('continueBtn').addEventListener('click', () => {
  const lastUser = getLastUser();
  if (lastUser) quickLogin(lastUser);
});
document.getElementById('loginBtn').addEventListener('click', () => {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) { showToast('Bitte gib deinen Namen ein!'); return; }
  quickLogin(name);
});
document.getElementById('nameInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('loginBtn').click();
});
document.getElementById('switchToNewLogin').addEventListener('click', () => {
  document.getElementById('returningUser').classList.add('hidden');
  document.getElementById('newLogin').classList.remove('hidden');
  document.getElementById('nameInput').focus();
});

// ---- NAV ----
document.querySelectorAll('.nav-link, .bottom-nav-item').forEach(link => {
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

// ---- HOME ----
function getCollapsedSections() {
  try { return JSON.parse(localStorage.getItem('wm2026_collapsed') || '{}'); } catch { return {}; }
}
function setCollapsedSection(key, collapsed) {
  const state = getCollapsedSections();
  state[key] = collapsed;
  localStorage.setItem('wm2026_collapsed', JSON.stringify(state));
}

function renderHome() {
  if (!currentUser) return;
  const myTips = allTips[currentUser] || {};
  const container = document.getElementById('groupsContainer');
  container.innerHTML = '';
  const collapsed = getCollapsedSections();

  // KO-Runden zuerst (oben), nur freigeschaltete
  KO_ROUNDS.forEach(round => {
    const unlockedGames = round.games.filter(g => g.unlocked && g.home !== 'TBD' && g.away !== 'TBD');
    if (!unlockedGames.length) return;
    const key = 'ko_' + round.id;
    const section = createGameSection(round.name, '', unlockedGames, myTips, key, collapsed[key]);
    container.appendChild(section);
  });

  // Alle Gruppenspiele in EINER Sektion
  const allGroupGames = WM_GROUPS.flatMap(g => g.games);
  const groupSection = createGameSection('Gruppenspiele', '', allGroupGames, myTips, 'gruppenspiele', collapsed['gruppenspiele']);
  container.appendChild(groupSection);

  container.querySelectorAll('.score-input').forEach(input => {
    input.addEventListener('input', () => handleTipInput(input));
  });
  updateProgress();
}

// ---- HEUTE TAB ----
function renderToday() {
  if (!currentUser) return;
  const container = document.getElementById('todayContainer');
  container.innerHTML = '';

  const now = new Date();
  const todayStr = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0');
  const allGames = [...ALL_GROUP_GAMES, ...getLiveKoGames()];
  const todayGames = allGames
    .filter(g => g.date === todayStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  if (!todayGames.length) {
    container.innerHTML = `
      <div class="today-empty">
        <div class="today-empty-icon">😴</div>
        <p>Heute sind keine Spiele!</p>
        <p class="today-empty-sub">Genieß den freien Tag ⚽</p>
      </div>`;
    return;
  }

  // Datum-Header
  const dateHeader = document.createElement('div');
  dateHeader.className = 'today-date-header';
  dateHeader.textContent = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' });
  container.appendChild(dateHeader);

  // Eigener Tipp + Alle anderen Tipps pro Spiel
  todayGames.forEach(game => {
    const myTips = allTips[currentUser] || {};
    const myTip = myTips[game.id] || null;
    const result = results[game.id];
    const locked = isGameLocked(game);

    // Alle Tipps für dieses Spiel sammeln
    const allGameTips = Object.entries(allTips)
      .filter(([name]) => name !== '_admin_')
      .map(([name, tips]) => ({
        name,
        tip: (tips[game.id] && tips[game.id].home !== '') ? tips[game.id] : null
      }));

    const card = document.createElement('div');
    card.className = 'today-card';

    let resultBadge = '';
    if (result) {
      resultBadge = `<div class="today-result">Ergebnis: <strong>${result.home} : ${result.away}</strong></div>`;
    }

    let myTipSection = '';
    if (myTip) {
      const pts = result ? calcPoints(myTip, result) : null;
      const ptsHtml = pts !== null
        ? `<span class="pts-badge ${pts===3?'exact':pts===1?'tendency':'none'}">${pts===3?'+3':pts===1?'+1':'+0'}</span>`
        : '';
      myTipSection = `
        <div class="today-mytip">
          <span class="today-mytip-label">Dein Tipp:</span>
          <strong>${myTip.home} : ${myTip.away}</strong>
          ${ptsHtml}
        </div>`;
    } else if (!locked) {
      myTipSection = `<div class="today-mytip no-tip">⚠️ Noch kein Tipp abgegeben!</div>`;
    } else {
      myTipSection = `<div class="today-mytip no-tip">🔒 Kein Tipp – Spiel bereits gesperrt</div>`;
    }

    // Alle anderen Tipps
    const othersHtml = allGameTips.map(({ name, tip }) => {
      const isMe = name === currentUser;
      if (isMe) return '';
      const pts = (tip && result) ? calcPoints(tip, result) : null;
      const ptsHtml = pts !== null
        ? `<span class="pts-badge ${pts===3?'exact':pts===1?'tendency':'none'}">${pts===3?'+3':pts===1?'+1':'+0'}</span>`
        : '';
      return `
        <div class="today-other-tip">
          <span class="today-other-name">${escapeHtml(name)}</span>
          <span class="today-other-score">${tip ? `${tip.home} : ${tip.away}` : '<em>–</em>'}</span>
          ${ptsHtml}
        </div>`;
    }).join('');

    card.innerHTML = `
      <div class="today-card-header">
        <div class="today-teams">
          <span class="today-team">${game.home}</span>
          <span class="today-vs">vs</span>
          <span class="today-team">${game.away}</span>
        </div>
        <div class="today-meta">${game.time} Uhr · ${game.venue}${locked ? ' 🔒' : ''}</div>
      </div>
      ${resultBadge}
      ${myTipSection}
      ${othersHtml ? `<div class="today-others-label">Alle Tipps:</div><div class="today-others">${othersHtml}</div>` : ''}
    `;
    container.appendChild(card);
  });
}

// ---- PUNKTE-VERLAUF ----
function renderVerlauf() {
  const container = document.getElementById('verlaufContainer');
  container.innerHTML = '';

  // Alle Spieltage (Daten mit Ergebnissen) ermitteln
  const allGames = [...ALL_GROUP_GAMES, ...ALL_KO_GAMES];
  const gamesWithResults = allGames.filter(g => results[g.id]);

  if (!gamesWithResults.length) {
    container.innerHTML = '<p class="empty">Noch keine Ergebnisse eingetragen.</p>';
    return;
  }

  // Spieler (ohne admin)
  const players = Object.keys(allTips).filter(n => n !== '_admin_');
  if (!players.length) { container.innerHTML = '<p class="empty">Noch keine Teilnehmer.</p>'; return; }

  // Einzigartige Daten sortiert
  const dates = [...new Set(gamesWithResults.map(g => g.date))].sort();

  // Kumulative Punkte pro Spieler pro Tag berechnen
  const playerPoints = {};
  players.forEach(p => { playerPoints[p] = {}; });

  dates.forEach(date => {
    players.forEach(player => {
      const tips = allTips[player] || {};
      const prevDate = dates[dates.indexOf(date) - 1];
      const prevTotal = prevDate ? (playerPoints[player][prevDate] || 0) : 0;

      const dayGames = gamesWithResults.filter(g => g.date === date);
      const dayPts = dayGames.reduce((sum, game) => {
        const tip = tips[game.id];
        const result = results[game.id];
        if (!tip || tip.home === '') return sum;
        return sum + calcPoints(tip, result);
      }, 0);

      playerPoints[player][date] = prevTotal + dayPts;
    });
  });

  // Top 5 Spieler nach aktuellem Gesamtpunktestand
  const lastDate = dates[dates.length - 1];
  const ranked = players
    .map(p => ({ name: p, total: playerPoints[p][lastDate] || 0 }))
    .sort((a, b) => b.total - a.total);
  const top5 = new Set(ranked.slice(0, 5).map(r => r.name));

  // Farben für Top 5
  const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];
  const colorMap = {};
  let colorIdx = 0;
  ranked.forEach(r => {
    if (top5.has(r.name)) {
      colorMap[r.name] = colors[colorIdx++];
    } else {
      colorMap[r.name] = '#94a3b8';
    }
  });

  // SVG-Diagramm zeichnen
  const W = 700, H = 380;
  const padL = 45, padR = 120, padT = 20, padB = 50;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const allValues = players.flatMap(p => dates.map(d => playerPoints[p][d] || 0));
  const maxVal = Math.max(...allValues, 1);

  const xStep = chartW / Math.max(dates.length - 1, 1);

  function xPos(i) { return padL + i * xStep; }
  function yPos(v) { return padT + chartH - (v / maxVal) * chartH; }

  // Datum-Labels kürzen
  function shortDate(d) {
    const parts = d.split('-');
    return parts[2] + '.' + parts[1] + '.';
  }

  // Gitternetz-Linien
  const gridLines = [];
  const gridCount = 5;
  for (let i = 0; i <= gridCount; i++) {
    const v = Math.round((maxVal / gridCount) * i);
    const y = yPos(v);
    gridLines.push(`
      <line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>
      <text x="${padL - 6}" y="${y + 4}" text-anchor="end" font-size="11" fill="#94a3b8">${v}</text>
    `);
  }

  // Linien + Punkte pro Spieler
  const lines = players.map(player => {
    const color = colorMap[player];
    const isTop = top5.has(player);
    const strokeW = isTop ? 2.5 : 1.2;
    const opacity = isTop ? 1 : 0.35;

    const points = dates.map((d, i) => {
      const v = playerPoints[player][d] || 0;
      return `${xPos(i)},${yPos(v)}`;
    }).join(' ');

    const dots = dates.map((d, i) => {
      const v = playerPoints[player][d] || 0;
      return isTop
        ? `<circle cx="${xPos(i)}" cy="${yPos(v)}" r="4" fill="${color}" stroke="white" stroke-width="1.5"/>`
        : '';
    }).join('');

    return `
      <polyline points="${points}" fill="none" stroke="${color}" stroke-width="${strokeW}" opacity="${opacity}" stroke-linejoin="round" stroke-linecap="round"/>
      ${dots}
    `;
  });

  // Legende rechts (nur Top 5 + Rest zusammen)
  const legendItems = ranked.map((r, i) => {
    const color = colorMap[r.name];
    const isTop = top5.has(r.name);
    const y = padT + i * 22;
    if (y > H - padB - 10) return '';
    return `
      <rect x="${W - padR + 10}" y="${y}" width="12" height="12" rx="3" fill="${color}" opacity="${isTop ? 1 : 0.4}"/>
      <text x="${W - padR + 28}" y="${y + 10}" font-size="11" fill="${isTop ? '#1e293b' : '#94a3b8'}" font-weight="${isTop ? '600' : '400'}">
        ${escapeHtml(r.name.length > 10 ? r.name.slice(0, 9) + '…' : r.name)} (${r.total})
      </text>
    `;
  }).join('');

  // X-Achse Labels (max 8 anzeigen um Überlappung zu vermeiden)
  const step = Math.ceil(dates.length / 8);
  const xLabels = dates.map((d, i) => {
    if (i % step !== 0 && i !== dates.length - 1) return '';
    return `<text x="${xPos(i)}" y="${H - padB + 18}" text-anchor="middle" font-size="10" fill="#94a3b8">${shortDate(d)}</text>`;
  }).join('');

  const svg = `
    <div class="verlauf-wrap">
      <h3 class="verlauf-title">📈 Punkte-Verlauf</h3>
      <p class="verlauf-sub">Top 5 farbig hervorgehoben · aktualisiert sich automatisch</p>
      <div class="verlauf-svg-wrap">
        <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:${W}px">
          ${gridLines.join('')}
          <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + chartH}" stroke="#cbd5e1" stroke-width="1"/>
          <line x1="${padL}" y1="${padT + chartH}" x2="${W - padR}" y2="${padT + chartH}" stroke="#cbd5e1" stroke-width="1"/>
          ${lines.join('')}
          ${xLabels}
          <g>${legendItems}</g>
        </svg>
      </div>
    </div>
  `;
  container.innerHTML = svg;
}

// ---- GAME HELPERS ----
function isGameLocked(game) {
  try {
    const [h, m] = game.time.split(':').map(Number);
    const kickoff = new Date(game.date + 'T00:00:00');
    kickoff.setHours(h, m, 0, 0);
    return Date.now() >= kickoff.getTime();
  } catch { return false; }
}

function createGameSection(title, subtitle, games, myTips, collapseKey, isCollapsed) {
  const section = document.createElement('div');
  section.className = 'group-section';

  const header = document.createElement('h3');
  header.className = 'group-title collapsible-title';

  // Zähle getippte / gesamt für diese Sektion
  const tipped = games.filter(g => myTips[g.id] && myTips[g.id].home !== '' && myTips[g.id].away !== '').length;
  const total = games.length;
  const allDone = tipped === total;
  const hasResult = games.every(g => results[g.id]);

  const arrow = isCollapsed ? '▶' : '▼';
  const doneTag = allDone
    ? `<span class="section-done-badge">✓ alle ${total}</span>`
    : `<span class="section-progress-badge">${tipped}/${total}</span>`;

  header.innerHTML = `<span class="collapse-arrow">${arrow}</span> ${title} ${subtitle} ${doneTag}`;

  if (collapseKey) {
    header.style.cursor = 'pointer';
    header.addEventListener('click', () => {
      const newCollapsed = !gamesEl.classList.contains('section-hidden');
      gamesEl.classList.toggle('section-hidden', newCollapsed);
      header.querySelector('.collapse-arrow').textContent = newCollapsed ? '▶' : '▼';
      setCollapsedSection(collapseKey, newCollapsed);
    });
  }

  section.appendChild(header);
  const gamesEl = document.createElement('div');
  gamesEl.className = 'games-list';
  if (isCollapsed) gamesEl.classList.add('section-hidden');

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
  if (game && isGameLocked(game)) return;
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

function getLiveKoGames() {
  return KO_ROUNDS.flatMap(r => r.games).filter(g => g.unlocked && g.home !== 'TBD');
}

function updateProgress() {
  const myTips = allTips[currentUser] || {};
  const tippableGames = [...ALL_GROUP_GAMES, ...getLiveKoGames()];
  const tippableIds = new Set(tippableGames.map(g => g.id));
  const done = Object.entries(myTips).filter(([id, t]) => tippableIds.has(id) && t.home !== '' && t.away !== '').length;
  const total = tippableGames.length;
  document.getElementById('progressBar').style.width = total > 0 ? Math.round(done/total*100) + '%' : '0%';
  document.getElementById('progressText').textContent = `${done} von ${total} Spielen getippt`;
}

// ---- OVERVIEW – nach Datum sortiert ----
function renderOverview() {
  const gameSelect = document.getElementById('gameSelect');
  const tippableGames = [
    ...ALL_GROUP_GAMES,
    ...getLiveKoGames()
  ].sort((a, b) => {
    const dateA = new Date(a.date + 'T' + (a.time || '00:00') + ':00');
    const dateB = new Date(b.date + 'T' + (b.time || '00:00') + ':00');
    return dateA - dateB;
  });

  gameSelect.innerHTML = tippableGames.map(g =>
    `<option value="${g.id}">${formatDateShort(g.date)} · ${g.home} vs ${g.away}</option>`
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

// ---- RANKING – gleicher Platz bei Gleichstand ----
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

  let currentRank = 1;
  ranked.forEach((r, i) => {
    if (i === 0) {
      r.rank = 1;
    } else {
      const prev = ranked[i - 1];
      if (r.total === prev.total && r.exact === prev.exact) {
        r.rank = prev.rank;
      } else {
        r.rank = i + 1;
      }
    }
  });

  const medals = ['🥇','🥈','🥉'];

  container.innerHTML = `
    <table class="ranking-table">
      <thead><tr><th>#</th><th>Name</th><th>Punkte</th><th>Exakt</th><th>Tendenz</th><th>Getippt</th></tr></thead>
      <tbody>
        ${ranked.map(r => `
          <tr class="${r.rank<=3?'rank-'+r.rank:''}${r.name===currentUser?' current-user':''}">
            <td class="rank-pos">${medals[r.rank-1] || r.rank}</td>
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
  WM_GROUPS.forEach(group => {
    container.appendChild(createAdminResultSection(group.name, group.games));
  });
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
          <input type="text" class="ko-team-input" data-id="${game.id}" data-field="away" value="${escapeHtml(awayVal)}" placeholder="Auswärts-Team">
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

  container.querySelectorAll('.btn-ko-save').forEach(btn => {
    btn.addEventListener('click', () => saveKoGame(btn.dataset.id, container));
  });
  container.querySelectorAll('.ko-unlock-check').forEach(cb => {
    cb.addEventListener('change', () => saveKoGame(cb.dataset.id, container));
  });
}

async function saveKoGame(gameId, container) {
  const homeInput  = container.querySelector(`[data-id="${gameId}"][data-field="home"]`);
  const awayInput  = container.querySelector(`[data-id="${gameId}"][data-field="away"]`);
  const venueInput = container.querySelector(`[data-id="${gameId}"][data-field="venue"]`);
  const timeInput  = container.querySelector(`[data-id="${gameId}"][data-field="time"]`);
  const unlockCheck = container.querySelector(`.ko-unlock-check[data-id="${gameId}"]`);
  const mark = document.getElementById('ko-mark-' + gameId);

  const home     = homeInput?.value.trim() || '';
  const away     = awayInput?.value.trim() || '';
  const venue    = venueInput?.value.trim() || '';
  const time     = timeInput?.value.trim() || '';
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
