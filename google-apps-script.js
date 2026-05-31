// =============================================
// WM 2026 TIPPSPIEL – Google Apps Script Backend
// =============================================
// Deployment: Web-App, Ausführen als "Ich", Zugriff "Jeder"
// =============================================

const SHEET_NAME_TIPS = "Tipps";
const SHEET_NAME_RESULTS = "Ergebnisse";
const SHEET_NAME_KO = "KO-Spiele";

function doGet(e) {
  const action = e.parameter.action;

  if (action === "getAllTips")   return jsonResponse(getAllTips());
  if (action === "getResults")   return jsonResponse(getResults());
  if (action === "getKoGames")   return jsonResponse(getKoGames());

  if (action === "saveTip") {
    saveTip(e.parameter.user, e.parameter.gameId, e.parameter.home, e.parameter.away);
    return jsonResponse({ ok: true });
  }
  if (action === "saveResult") {
    saveResult(e.parameter.gameId, e.parameter.home, e.parameter.away);
    return jsonResponse({ ok: true });
  }
  if (action === "saveKoGame") {
    saveKoGame(e.parameter.gameId, e.parameter.home, e.parameter.away,
               e.parameter.venue, e.parameter.time, e.parameter.unlocked);
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: "Unbekannte Aktion" });
}

// ---- TIPPS ----
function getAllTips() {
  const sheet = getOrCreateSheet(SHEET_NAME_TIPS, ["User", "GameId", "Home", "Away"]);
  const data = sheet.getDataRange().getValues();
  const tips = {};
  for (let i = 1; i < data.length; i++) {
    const [user, gameId, home, away] = data[i];
    if (!user || !gameId) continue;
    if (!tips[user]) tips[user] = {};
    tips[user][gameId] = { home: String(home), away: String(away) };
  }
  return tips;
}

function saveTip(user, gameId, home, away) {
  const sheet = getOrCreateSheet(SHEET_NAME_TIPS, ["User", "GameId", "Home", "Away"]);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === user && data[i][1] === gameId) {
      sheet.getRange(i + 1, 3, 1, 2).setValues([[home, away]]);
      return;
    }
  }
  sheet.appendRow([user, gameId, home, away]);
}

// ---- ERGEBNISSE ----
function getResults() {
  const sheet = getOrCreateSheet(SHEET_NAME_RESULTS, ["GameId", "Home", "Away"]);
  const data = sheet.getDataRange().getValues();
  const results = {};
  for (let i = 1; i < data.length; i++) {
    const [gameId, home, away] = data[i];
    if (!gameId) continue;
    results[gameId] = { home: String(home), away: String(away) };
  }
  return results;
}

function saveResult(gameId, home, away) {
  const sheet = getOrCreateSheet(SHEET_NAME_RESULTS, ["GameId", "Home", "Away"]);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === gameId) {
      sheet.getRange(i + 1, 2, 1, 2).setValues([[home, away]]);
      return;
    }
  }
  sheet.appendRow([gameId, home, away]);
}

// ---- KO-SPIELE ----
function getKoGames() {
  const sheet = getOrCreateSheet(SHEET_NAME_KO, ["GameId", "Home", "Away", "Venue", "Time", "Unlocked"]);
  const data = sheet.getDataRange().getValues();
  const koGames = {};
  for (let i = 1; i < data.length; i++) {
    const [gameId, home, away, venue, time, unlocked] = data[i];
    if (!gameId) continue;
    koGames[gameId] = { home: String(home), away: String(away), venue: String(venue), time: String(time), unlocked: String(unlocked) };
  }
  return koGames;
}

function saveKoGame(gameId, home, away, venue, time, unlocked) {
  const sheet = getOrCreateSheet(SHEET_NAME_KO, ["GameId", "Home", "Away", "Venue", "Time", "Unlocked"]);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === gameId) {
      sheet.getRange(i + 1, 2, 1, 5).setValues([[home, away, venue, time, unlocked]]);
      return;
    }
  }
  sheet.appendRow([gameId, home, away, venue, time, unlocked]);
}

// ---- HILFSFUNKTIONEN ----
function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  }
  return sheet;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
