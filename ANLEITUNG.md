# ⚽ WM 2026 Tippspiel – Setup Anleitung

## Schritt 1: Google Sheet erstellen

1. Geh auf **https://sheets.new** (Google Sheet wird automatisch erstellt)
2. Das Sheet kann leer bleiben – der Code füllt es automatisch

---

## Schritt 2: Apps Script einrichten

1. Klicke im Google Sheet oben auf **„Erweiterungen"**
2. Klicke auf **„Apps Script"** – ein neues Tab öffnet sich
3. Du siehst einen leeren Editor mit `function myFunction() {}`
4. **Alles löschen** und den Inhalt der Datei `google-apps-script.js` hineinkopieren
5. Klicke auf das **Disketten-Symbol** (Speichern) oder `Strg+S`

---

## Schritt 3: Als Web-App deployen

1. Klicke oben rechts auf **„Deployen"** → **„Neue Bereitstellung"**
2. Beim Typ-Symbol (Zahnrad ⚙️) klicke drauf und wähle **„Web-App"**
3. Fülle aus:
   - **Beschreibung:** WM Tippspiel (egal)
   - **Ausführen als:** Ich (dein Google-Konto)
   - **Zugriff:** **Jeder** ← wichtig!
4. Klicke **„Bereitstellen"**
5. Google fragt nach Berechtigungen → **„Zugriff gewähren"** klicken
   - Falls Google warnt: „Erweitert" → „Zu WM Tippspiel (unsicher) gehen"
6. Du siehst jetzt eine **URL** – sieht so aus:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```
7. **Diese URL kopieren!**

---

## Schritt 4: URL in die Website eintragen

1. Öffne die Datei **`app.js`** in einem Texteditor
2. Ganz oben findest du diese Zeile:
   ```js
   const SCRIPT_URL = "DEINE_SCRIPT_URL_HIER_EINTRAGEN";
   ```
3. Ersetze `DEINE_SCRIPT_URL_HIER_EINTRAGEN` mit deiner kopierten URL:
   ```js
   const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby.../exec";
   ```
4. Speichern!

---

## Schritt 5: Auf GitHub Pages hosten

1. Geh auf **https://github.com** und logge dich ein
2. Klicke auf **„New repository"** (grüner Button)
3. Name: z.B. `wm-tippspiel`
4. **Public** auswählen
5. Klicke **„Create repository"**
6. Klicke **„uploading an existing file"**
7. Alle 5 Dateien hochladen:
   - `index.html`
   - `style.css`
   - `app.js`
   - `data.js`
   - `google-apps-script.js` (optional, nur zur Referenz)
8. Klicke **„Commit changes"**

**GitHub Pages aktivieren:**
1. Im Repository auf **„Settings"** klicken
2. Links auf **„Pages"** klicken
3. Bei „Branch": `main` auswählen, Ordner `/root`
4. **„Save"** klicken
5. Nach ca. 1-2 Minuten ist die Seite live unter:
   ```
   https://DEIN-NAME.github.io/wm-tippspiel/
   ```

---

## Admin-Passwort ändern

In der Datei `data.js` ganz unten:
```js
const ADMIN_PASSWORD = "wm2026admin";
```
Einfach durch dein Wunsch-Passwort ersetzen.

---

## Fertig! 🎉

Schick deiner Familie einfach den GitHub Pages Link.  
Jeder gibt auf seinem Gerät seinen Namen ein und kann tippen.  
Alle Tipps landen im Google Sheet und sind für alle sichtbar!
