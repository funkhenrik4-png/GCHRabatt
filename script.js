/***********************
 * KONFIGURATION
 ***********************/
const webAppUrl = "https://script.google.com/macros/s/AKfycbybwhWvvO_Qb0UhbN_GYTQmLamEh0p6Bx_fbkDO-G3iIpKB7r6uC0inRG1sQIUFTnhceg/exec";
const adminPassword = "Matchplay";
const MAX_HOURS_PER_AK = 4;

/***********************
 * GLOBALE DATEN
 ***********************/
let playerAK = {};
let bookings = [];
let akUsage = {};

/***********************
 * SPIELER AUS SHEETS LADEN
 ***********************/
async function loadPlayers() {
  const res = await fetch(webAppUrl);
  playerAK = await res.json();
}

/***********************
 * DAUER BERECHNEN
 ***********************/
function calcDuration(start, end) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

/***********************
 * BUCHEN
 ***********************/
async function book() {
  await loadPlayers();

  const date = document.getElementById("date").value;
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  const simulator = document.getElementById("simulator").value;
  const numPlayers = parseInt(document.getElementById("numPlayers").value);
  const playerNumbers = document.getElementById("playerNumbers")
    .value.split(",")
    .map(n => n.trim());

  if (!date || !start || !end || playerNumbers.length !== numPlayers) {
    showResult("Bitte alle Felder korrekt ausfüllen", false);
    return;
  }

  const duration = calcDuration(start, end);
  if (duration <= 0) {
    showResult("Endzeit muss nach Startzeit liegen", false);
    return;
  }

  // AK ermitteln
  let akSet = new Set();
  let unknown = [];

  playerNumbers.forEach(n => {
    if (playerAK[n]) akSet.add(playerAK[n]);
    else unknown.push(n);
  });

  if (unknown.length > 0) {
    showResult("Unbekannte Spieler: " + unknown.join(", "), false);
    return;
  }

  if (akSet.size !== 1) {
    showResult("Spieler gehören zu unterschiedlichen AKs", false);
    return;
  }

  const ak = [...akSet][0];
  akUsage[ak] = akUsage[ak] || 0;

  if (akUsage[ak] + duration > MAX_HOURS_PER_AK) {
    showResult(`Kontingent für ${ak} ausgeschöpft`, false);
    return;
  }

  // Buchung speichern
  bookings.push({ date, start, end, simulator, ak, players: playerNumbers });
  akUsage[ak] += duration;

  showResult("Gebucht ✅", true);
  updateStats();
}

/***********************
 * AUSGABE
 ***********************/
function showResult(msg, success) {
  const el = document.getElementById("bookingResult");
  el.innerText = msg;
  el.style.color = success ? "lime" : "red";
}

/***********************
 * ADMIN LOGIN
 ***********************/
function unlockAdmin() {
  if (document.getElementById("adminPass").value === adminPassword) {
    document.getElementById("adminPanel").style.display = "block";
    loadAdmin();
  } else {
    alert("Falsches Passwort");
  }
}

/***********************
 * ADMIN DATEN
 ***********************/
function loadAdmin() {
  const div = document.getElementById("playerTable");
  div.innerHTML = "";

  if (bookings.length === 0) {
    div.innerHTML = "<p>Keine Buchungen</p>";
    return;
  }

  let html = `<table>
    <tr>
      <th>Datum</th><th>Start</th><th>Ende</th>
      <th>Simulator</th><th>AK</th><th>Spieler</th><th>Löschen</th>
    </tr>`;

  bookings.forEach((b, i) => {
    html += `<tr>
      <td>${b.date}</td>
      <td>${b.start}</td>
      <td>${b.end}</td>
      <td>${b.simulator}</td>
      <td>${b.ak}</td>
      <td>${b.players.join(", ")}</td>
      <td><button onclick="deleteBooking(${i})">X</button></td>
    </tr>`;
  });

  html += "</table>";
  div.innerHTML = html;
  updateStats();
}

/***********************
 * BUCHUNG LÖSCHEN
 ***********************/
function deleteBooking(i) {
  const b = bookings[i];
  const duration = calcDuration(b.start, b.end);
  akUsage[b.ak] -= duration;
  bookings.splice(i, 1);
  loadAdmin();
}

/***********************
 * STATISTIK
 ***********************/
function updateStats() {
  const div = document.getElementById("stats");
  let html = `<table>
    <tr><th>AK</th><th>Genutzt</th><th>Übrig</th></tr>`;

  for (const ak in akUsage) {
    html += `<tr>
      <td>${ak}</td>
      <td>${akUsage[ak]}</td>
      <td>${Math.max(0, MAX_HOURS_PER_AK - akUsage[ak])}</td>
    </tr>`;
  }

  html += "</table>";
  div.innerHTML = html;
}
