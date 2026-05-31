# ⚽ WM 2026 Tippspiel

Ein einfaches Familien-Tippspiel für die Fußball-WM 2026 – keine Registrierung, kein Server, läuft direkt im Browser.

## Features

- **Kein Account nötig** – einfach Namen eingeben und loslegen
- **Alle 72 Gruppenspiele** (Gruppe A bis L) vorinstalliert
- **Automatisches Speichern** nach jeder Eingabe (✓-Haken erscheint)
- **Fortschrittsanzeige** – wie viele Spiele sind schon getippt
- **Alle Tipps im Überblick** – sieh was jeder für ein Spiel getippt hat
- **Live-Rangliste** mit Punkteberechnung
- **Admin-Bereich** – trage die echten Ergebnisse ein

## Punktesystem

| Punkte | Bedingung |
|--------|-----------|
| 3 Punkte | Exaktes Ergebnis (z.B. 2:1 getippt, 2:1 gespielt) |
| 1 Punkt | Richtige Tendenz (Sieg/Unentschieden richtig) |
| 0 Punkte | Falsch getippt |

## Admin-Zugang

Standard-Passwort: **`wm2026admin`**

> Das Passwort kannst du in `data.js` am Ende der Datei ändern:
> ```js
> const ADMIN_PASSWORD = "dein-neues-passwort";
> ```

## GitHub Pages (empfohlen)

1. Repository auf GitHub erstellen
2. Dateien hochladen (`index.html`, `style.css`, `app.js`, `data.js`)
3. In den **Settings → Pages** → Source: `main` Branch, Root `/`
4. Deine URL: `https://[dein-name].github.io/[repo-name]/`

## Lokale Nutzung

Einfach `index.html` im Browser öffnen – kein Server nötig!

> **Hinweis:** Alle Daten werden lokal im Browser (`localStorage`) gespeichert. Jeder Nutzer braucht das gleiche Gerät **oder** du hostest die Seite (z.B. GitHub Pages), damit alle Tipps sichtbar sind.

## Dateien

| Datei | Beschreibung |
|-------|-------------|
| `index.html` | Haupt-HTML |
| `style.css` | Design / Styles |
| `app.js` | Logik (Login, Speichern, Rangliste) |
| `data.js` | Alle 72 Gruppenspiele + Admin-Passwort |

## Wichtiger Hinweis zur Datenspeicherung

Die Tipps werden im **localStorage des Browsers** gespeichert. Das bedeutet:
- Jeder muss die Website über die **gleiche URL** aufrufen
- Die Tipps sind dann **auf dem Server (GitHub Pages)** gespeichert, aber **lokal im Browser des Nutzers**
- Für eine echte Mehrspieler-Variante wäre ein Backend nötig – für den Familieneinsatz ist localStorage aber ausreichend, wenn alle das gleiche Gerät benutzen oder du GitHub Pages nutzt

**Beste Nutzung:** Jeder ruft die GitHub-Pages-URL auf seinem eigenen Gerät auf, gibt die Tipps ein. Der Admin trägt Ergebnisse ein. Für die Rangliste und den Vergleich schaut ihr euch auf einem gemeinsamen Gerät die Seite an.
