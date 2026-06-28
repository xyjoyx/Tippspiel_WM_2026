// =============================================
// WM 2026 – GRUPPENSPIELE (alle Zeiten in MESZ = UTC+2)
// =============================================

const WM_GROUPS = [
  {
    name: "Gruppe A",
    teams: ["Mexiko", "Südafrika", "Südkorea", "Tschechien"],
    games: [
      { id: "A1", date: "2026-06-11", time: "21:00", home: "Mexiko",     away: "Südafrika",  venue: "Mexiko City" },
      { id: "A2", date: "2026-06-12", time: "04:00", home: "Südkorea",   away: "Tschechien", venue: "Guadalajara" },
      { id: "A3", date: "2026-06-18", time: "18:00", home: "Tschechien", away: "Südafrika",  venue: "Atlanta" },
      { id: "A4", date: "2026-06-19", time: "03:00", home: "Mexiko",     away: "Südkorea",   venue: "Guadalajara" },
      { id: "A5", date: "2026-06-25", time: "03:00", home: "Tschechien", away: "Mexiko",     venue: "Mexiko City" },
      { id: "A6", date: "2026-06-25", time: "03:00", home: "Südafrika",  away: "Südkorea",   venue: "Monterrey" },
    ]
  },
  {
    name: "Gruppe B",
    teams: ["Kanada", "Bosnien-Herzegowina", "Katar", "Schweiz"],
    games: [
      { id: "B1", date: "2026-06-12", time: "21:00", home: "Kanada",              away: "Bosnien-Herzegowina", venue: "Toronto" },
      { id: "B2", date: "2026-06-13", time: "21:00", home: "Katar",               away: "Schweiz",             venue: "San Francisco" },
      { id: "B3", date: "2026-06-18", time: "21:00", home: "Schweiz",             away: "Bosnien-Herzegowina", venue: "Los Angeles" },
      { id: "B4", date: "2026-06-19", time: "00:00", home: "Kanada",              away: "Katar",               venue: "Vancouver" },
      { id: "B5", date: "2026-06-25", time: "00:00", home: "Bosnien-Herzegowina", away: "Katar",               venue: "Seattle" },
      { id: "B6", date: "2026-06-25", time: "00:00", home: "Schweiz",             away: "Kanada",              venue: "Vancouver" },
    ]
  },
  {
    name: "Gruppe C",
    teams: ["Brasilien", "Marokko", "Haiti", "Schottland"],
    games: [
      { id: "C1", date: "2026-06-14", time: "00:00", home: "Brasilien",  away: "Marokko",   venue: "New York/NJ" },
      { id: "C2", date: "2026-06-14", time: "03:00", home: "Haiti",      away: "Schottland", venue: "Boston" },
      { id: "C3", date: "2026-06-20", time: "00:00", home: "Schottland", away: "Marokko",   venue: "Boston" },
      { id: "C4", date: "2026-06-20", time: "03:00", home: "Brasilien",  away: "Haiti",     venue: "Philadelphia" },
      { id: "C5", date: "2026-06-25", time: "00:00", home: "Schottland", away: "Brasilien", venue: "Miami" },
      { id: "C6", date: "2026-06-25", time: "00:00", home: "Marokko",    away: "Haiti",     venue: "Atlanta" },
    ]
  },
  {
    name: "Gruppe D",
    teams: ["USA", "Paraguay", "Australien", "Türkei"],
    games: [
      { id: "D1", date: "2026-06-13", time: "03:00", home: "USA",        away: "Paraguay",   venue: "Los Angeles" },
      { id: "D2", date: "2026-06-14", time: "06:00", home: "Australien", away: "Türkei",     venue: "Vancouver" },
      { id: "D3", date: "2026-06-19", time: "21:00", home: "USA",        away: "Australien", venue: "Seattle" },
      { id: "D4", date: "2026-06-20", time: "06:00", home: "Türkei",     away: "Paraguay",   venue: "San Francisco" },
      { id: "D5", date: "2026-06-26", time: "04:00", home: "Türkei",     away: "USA",        venue: "Los Angeles" },
      { id: "D6", date: "2026-06-26", time: "04:00", home: "Paraguay",   away: "Australien", venue: "San Francisco" },
    ]
  },
  {
    name: "Gruppe E",
    teams: ["Deutschland", "Curaçao", "Elfenbeinküste", "Ecuador"],
    games: [
      { id: "E1", date: "2026-06-14", time: "19:00", home: "Deutschland",    away: "Curaçao",        venue: "Houston" },
      { id: "E2", date: "2026-06-15", time: "01:00", home: "Elfenbeinküste", away: "Ecuador",        venue: "Philadelphia" },
      { id: "E3", date: "2026-06-20", time: "22:00", home: "Deutschland",    away: "Elfenbeinküste", venue: "Toronto" },
      { id: "E4", date: "2026-06-21", time: "02:00", home: "Ecuador",        away: "Curaçao",        venue: "Kansas City" },
      { id: "E5", date: "2026-06-25", time: "22:00", home: "Curaçao",        away: "Elfenbeinküste", venue: "Philadelphia" },
      { id: "E6", date: "2026-06-25", time: "22:00", home: "Ecuador",        away: "Deutschland",    venue: "New York/NJ" },
    ]
  },
  {
    name: "Gruppe F",
    teams: ["Niederlande", "Japan", "Schweden", "Tunesien"],
    games: [
      { id: "F1", date: "2026-06-14", time: "22:00", home: "Niederlande", away: "Japan",       venue: "Dallas" },
      { id: "F2", date: "2026-06-15", time: "04:00", home: "Schweden",    away: "Tunesien",    venue: "Monterrey" },
      { id: "F3", date: "2026-06-20", time: "19:00", home: "Tunesien",    away: "Japan",       venue: "Dallas" },
      { id: "F4", date: "2026-06-20", time: "22:00", home: "Niederlande", away: "Schweden",    venue: "Seattle" },
      { id: "F5", date: "2026-06-26", time: "00:00", home: "Japan",       away: "Schweden",    venue: "Los Angeles" },
      { id: "F6", date: "2026-06-26", time: "00:00", home: "Tunesien",    away: "Niederlande", venue: "Kansas City" },
    ]
  },
  {
    name: "Gruppe G",
    teams: ["Belgien", "Ägypten", "IR Iran", "Neuseeland"],
    games: [
      { id: "G1", date: "2026-06-15", time: "21:00", home: "Belgien",    away: "Ägypten",    venue: "Seattle" },
      { id: "G2", date: "2026-06-16", time: "03:00", home: "IR Iran",    away: "Neuseeland", venue: "Los Angeles" },
      { id: "G3", date: "2026-06-21", time: "21:00", home: "Belgien",    away: "IR Iran",    venue: "Los Angeles" },
      { id: "G4", date: "2026-06-22", time: "03:00", home: "Neuseeland", away: "Ägypten",   venue: "Vancouver" },
      { id: "G5", date: "2026-06-27", time: "05:00", home: "Ägypten",    away: "Iran",       venue: "Seattle" },
      { id: "G6", date: "2026-06-27", time: "05:00", home: "Neuseeland", away: "Belgien",    venue: "Vancouver" },
    ]
  },
  {
    name: "Gruppe H",
    teams: ["Spanien", "Kap Verde", "Saudi-Arabien", "Uruguay"],
    games: [
      { id: "H1", date: "2026-06-15", time: "18:00", home: "Spanien",       away: "Kap Verde",     venue: "Atlanta" },
      { id: "H2", date: "2026-06-16", time: "00:00", home: "Saudi-Arabien", away: "Uruguay",        venue: "Miami" },
      { id: "H3", date: "2026-06-21", time: "18:00", home: "Spanien",       away: "Saudi-Arabien",  venue: "Dallas" },
      { id: "H4", date: "2026-06-22", time: "00:00", home: "Uruguay",       away: "Kap Verde",      venue: "Miami" },
      { id: "H5", date: "2026-06-27", time: "02:00", home: "Kap Verde",     away: "Saudi-Arabien",  venue: "Houston" },
      { id: "H6", date: "2026-06-27", time: "02:00", home: "Uruguay",       away: "Spanien",        venue: "Guadalajara" },
    ]
  },
  {
    name: "Gruppe I",
    teams: ["Frankreich", "Senegal", "Irak", "Norwegen"],
    games: [
      { id: "I1", date: "2026-06-16", time: "21:00", home: "Frankreich", away: "Senegal",    venue: "New York/NJ" },
      { id: "I2", date: "2026-06-17", time: "00:00", home: "Irak",       away: "Norwegen",   venue: "Boston" },
      { id: "I3", date: "2026-06-22", time: "00:00", home: "Frankreich", away: "Irak",       venue: "Seattle" },
      { id: "I4", date: "2026-06-22", time: "03:00", home: "Norwegen",   away: "Senegal",    venue: "Toronto" },
      { id: "I5", date: "2026-06-26", time: "22:00", home: "Norwegen",   away: "Frankreich", venue: "Kansas City" },
      { id: "I6", date: "2026-06-26", time: "22:00", home: "Senegal",    away: "Irak",       venue: "Houston" },
    ]
  },
  {
    name: "Gruppe J",
    teams: ["Argentinien", "Algerien", "Österreich", "Jordanien"],
    games: [
      { id: "J1", date: "2026-06-17", time: "03:00", home: "Argentinien", away: "Algerien",   venue: "Kansas City" },
      { id: "J2", date: "2026-06-17", time: "06:00", home: "Österreich",  away: "Jordanien",  venue: "San Francisco" },
      { id: "J3", date: "2026-06-22", time: "19:00", home: "Argentinien", away: "Österreich", venue: "Los Angeles" },
      { id: "J4", date: "2026-06-22", time: "22:00", home: "Jordanien",   away: "Algerien",   venue: "Miami" },
      { id: "J5", date: "2026-06-28", time: "04:00", home: "Jordanien", away: "Argentinien",  venue: "Seattle" },
      { id: "J6", date: "2026-06-28", time: "04:00", home: "Algerien",    away: "Österreich", venue: "Dallas" },
    ]
  },
  {
    name: "Gruppe K",
    teams: ["Portugal", "DR Kongo", "Usbekistan", "Kolumbien"],
    games: [
      { id: "K1", date: "2026-06-17", time: "19:00", home: "Portugal",   away: "DR Kongo",   venue: "Houston" },
      { id: "K2", date: "2026-06-18", time: "04:00", home: "Usbekistan", away: "Kolumbien",  venue: "Mexiko City" },
      { id: "K3", date: "2026-06-23", time: "19:00", home: "Portugal",   away: "Usbekistan", venue: "Houston" },
      { id: "K4", date: "2026-06-24", time: "00:00", home: "Kolumbien",  away: "DR Kongo",   venue: "Guadalajara" },
      { id: "K5", date: "2026-06-28", time: "01:30", home: "Kolumbien",  away: "Portugal",   venue: "Miami" },
      { id: "K6", date: "2026-06-28", time: "01:30", home: "DR Kongo",   away: "Usbekistan", venue: "Atlanta" },
    ]
  },
  {
    name: "Gruppe L",
    teams: ["England", "Kroatien", "Ghana", "Panama"],
    games: [
      { id: "L1", date: "2026-06-17", time: "22:00", home: "England",  away: "Kroatien", venue: "Dallas" },
      { id: "L2", date: "2026-06-18", time: "01:00", home: "Ghana",    away: "Panama",   venue: "Toronto" },
      { id: "L3", date: "2026-06-23", time: "22:00", home: "England",  away: "Ghana",    venue: "Boston" },
      { id: "L4", date: "2026-06-24", time: "01:00", home: "Panama",   away: "Kroatien", venue: "Toronto" },
      { id: "L5", date: "2026-06-27", time: "23:00", home: "Panama",   away: "England",  venue: "New York/NJ" },
      { id: "L6", date: "2026-06-27", time: "23:00", home: "Kroatien", away: "Ghana",    venue: "Philadelphia" },
    ]
  }
];

const ALL_GROUP_GAMES = WM_GROUPS.flatMap(g => g.games.map(game => ({ ...game, group: g.name })));

const KO_ROUNDS = [
  {
    id: "r16",
    name: "Sechzehntelfinale",
    games: [
      { id: "R16_1",  date: "2026-06-28", time: "21:00", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 1" },
      { id: "R16_2",  date: "2026-06-29", time: "19:00", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 2" },
      { id: "R16_3",  date: "2026-06-29", time: "19:00", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 3" },
      { id: "R16_4",  date: "2026-06-30", time: "22:30", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 4" },
      { id: "R16_5",  date: "2026-06-30", time: "19:00", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 5" },
      { id: "R16_6",  date: "2026-06-30", time: "23:00", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 6" },
      { id: "R16_7",  date: "2026-07-01", time: "03:00", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 7" },
      { id: "R16_8",  date: "2026-07-01", time: "18:00", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 8" },
      { id: "R16_9",  date: "2026-07-01", time: "22:00", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 9" },
      { id: "R16_10", date: "2026-07-02", time: "02:00", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 10" },
      { id: "R16_11", date: "2026-07-02", time: "21:00", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 11" },
      { id: "R16_12", date: "2026-07-03", time: "01:00", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 12" },
      { id: "R16_13", date: "2026-07-03", time: "05:00", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 13" },
      { id: "R16_14", date: "2026-07-03", time: "20:00", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 14" },
      { id: "R16_15", date: "2026-07-04", time: "00:00", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 15" },
      { id: "R16_16", date: "2026-07-04", time: "03:30", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 16" },
    ]
  },
  {
    id: "af",
    name: "Achtelfinale",
    games: [
      { id: "AF_1", date: "2026-07-04", time: "19:00", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 1" },
      { id: "AF_2", date: "2026-07-04", time: "23:00", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 2" },
      { id: "AF_3", date: "2026-07-05", time: "22:00", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 3" },
      { id: "AF_4", date: "2026-07-06", time: "02:00", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 4" },
      { id: "AF_5", date: "2026-07-06", time: "21:00", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 5" },
      { id: "AF_6", date: "2026-07-07", time: "02:00", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 6" },
      { id: "AF_7", date: "2026-07-07", time: "18:00", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 7" },
      { id: "AF_8", date: "2026-07-07", time: "22:00", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 8" },
    ]
  },
  {
    id: "vf",
    name: "Viertelfinale",
    games: [
      { id: "VF_1", date: "2026-07-09", time: "22:00", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 1" },
      { id: "VF_2", date: "2026-07-10", time: "21:00", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 2" },
      { id: "VF_3", date: "2026-07-11", time: "23:00", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 3" },
      { id: "VF_4", date: "2026-07-12", time: "03:00", home: "TBD", away: "TBD", venue: "TBD", label: "Spiel 4" },
    ]
  },
  {
    id: "hf",
    name: "Halbfinale",
    games: [
      { id: "HF_1", date: "2026-07-14", time: "21:00", home: "TBD", away: "TBD", venue: "Dallas",      label: "Halbfinale 1" },
      { id: "HF_2", date: "2026-07-15", time: "21:00", home: "TBD", away: "TBD", venue: "New York/NJ", label: "Halbfinale 2" },
    ]
  },
  {
    id: "p3",
    name: "Spiel um Platz 3",
    games: [
      { id: "P3_1", date: "2026-07-18", time: "23:00", home: "TBD", away: "TBD", venue: "Miami", label: "Spiel um Platz 3" },
    ]
  },
  {
    id: "fi",
    name: "Finale",
    games: [
      { id: "FI_1", date: "2026-07-19", time: "21:00", home: "TBD", away: "TBD", venue: "MetLife Stadium", label: "Finale" },
    ]
  }
];

const ALL_KO_GAMES = KO_ROUNDS.flatMap(r => r.games.map(g => ({ ...g, round: r.name, roundId: r.id })));
const ALL_GAMES = [...ALL_GROUP_GAMES, ...ALL_KO_GAMES];
const ADMIN_PASSWORD = "wm2026admin";
