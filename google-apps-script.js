// =============================================
// WM 2026 TIPPSPIEL – Google Apps Script Backend
// =============================================
// ANLEITUNG:
// 1. Geh auf https://sheets.new → erstelle ein leeres Google Sheet
// 2. Klicke oben auf "Erweiterungen" → "Apps Script"
// 3. Lösche alles im Editor und füge DIESEN ganzen Code ein
// 4. Klicke auf "Speichern" (Disketten-Symbol)
// 5. Klicke auf "Deployen" → "Neue Bereitstellung"
//    - Typ: "Web-App"
//    - Ausführen als: "Ich" (dein Google-Konto)
//    - Zugriff: "Jeder"
// 6. Klicke "Bereitstellen" → Google fragt nach Berechtigung → erlauben
// 7. Kopiere die angezeigte URL (sieht aus wie: https://script.google.com/macros/s/ABC.../exec)
// 8. Trage diese URL in der Datei app.js ein (Variable SCRIPT_URL ganz oben)
// =============================================

const SHEET_NAME_TIPS = "Tipps";
const SHEET_NAME_RESULTS = "Ergebnisse";

function doGet(e) {
  const action = e.parameter.action;

  if (action === "getAllTips") {
    return jsonResponse(getAllTips());
  }
  if (action === "getResults") {
    return jsonResponse(getResults());
  }
  return jsonResponse({ error: "Unbekannte Aktion" });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    if (action === "saveTip") {
      saveTip(body.user, body.gameId, body.home, body.away);
      return jsonResponse({ ok: true });
    }
    if (action === "saveResult") {
      saveResult(body.gameId, body.home, body.away);
      return jsonResponse({ ok: true });
    }
    return jsonResponse({ error: "Unbekannte Aktion" });
  } catch (err) {
    return jsonResponse({ error: err.toString() });
  }
}

// ---- TIPPS ----
function getAllTips() {
  const sheet = getOrCreateSheet(SHEET_NAME_TIPS, ["User", "GameId", "Home", "Away"]);
  const data = sheet.getDataRange().getValues();
  const tips = {}; // { userName: { gameId: { home, away } } }

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
