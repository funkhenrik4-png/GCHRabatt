/*************************
 * KONFIG
 *************************/
const webAppUrl = "https://script.google.com/macros/s/AKfycbybwhWvvO_Qb0UhbN_GYTQmLamEh0p6Bx_fbkDO-G3iIpKB7r6uC0inRG1sQIUFTnhceg/exec";
const adminPassword = "Matchplay";
const MAX_HOURS_PER_AK = 4;

/*************************
 * GLOBALE DATEN
 *************************/
let playerAK = {};
let bookings = [];
let akUsage = {};

/*************************
 * SPIELER BEIM SEITENSTART LADEN
 *************************/
window.onload = async function () {
  const res = await fetch(webAppUrl);
  playerAK = await res.json();
  console.log("Spieler geladen:", playerAK);
};

/*************************
 * HILFSFUNKTIONEN
 *************************/
function calcDuration(start, end) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

function showResult(msg, ok) {
  const el = document.getElementById("bookingResult");
  el.innerText = msg;
  el.style.color = ok ? "lime" : "red";
}

/*************************
 * BUCHUNG
 *************************/
function book() {
  const date = document.getElementById("date").value;
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  const simulator = document.getElementById("simulator").value;
  const numPlayers = parseInt(document.getElementById("numPlayers").value);
  const players = document
    .getElementById("playerNumbers")
    .value.split(",")
    .map(p => p.trim());

  if (!date || !start || !end || players.length !== numPlayers) {
    showResult("Bitte alle Felder korrekt ausfüllen", false);
    return;
  }

  const duration = calcDuration(start, end);
  if (duration <= 0) {
    showResult("Endzeit muss nach Startzeit liegen", false);
    return;
  }

  let akSet = new Set();
  let unknown = [];

  players.forEach(p => {
    if (playerAK[p]) akSet.add(playerAK[p]);
    else unknown.push(p);
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

  bookings.push({ date, start, end, simulator, ak, players });
  akUsage[ak] += duration;

  showResult("Gebucht ✅", true);
  updateStats();
}

/*************************
 * ADMIN
 *************************/
function unlockAdmin() {
  if (document.getElementById("adminPass").value === adminPassword) {
    document.getElementById("adminPanel").style.display = "block";
    renderAdmin();
  } else {
    alert("Falsches Passwort");
  }
}

function renderAdmin() {
  const div = document.getElementById("playerTable");
  if (bookings.length === 0) {
    div.innerHTML = "<p>Keine Buchungen</p>";
    return;
  }

  let html = `<table>
    <tr><th>Datum</th><th>Start</th><th>Ende</th><th>AK</th><th>Spieler</th><th></th></tr>`;

  bookings.forEach((b, i) => {
    html += `<tr>
      <td>${b.date}</td>
      <td>${b.start}</td>
      <td>${b.end}</td>
      <td>${b.ak}</td>
      <td>${b.players.join(", ")}</td>
      <td><button onclick="deleteBooking(${i})">X</button></td>
    </tr>`;
  });

  html += "</table>";
  div.innerHTML = html;
  updateStats();
}

function deleteBooking(i) {
  const b = bookings[i];
  akUsage[b.ak] -= calcDuration(b.start, b.end);
  bookings.splice(i, 1);
  renderAdmin();
}

/*************************
 * STATISTIK
 *************************/
function updateStats() {
  const div = document.getElementById("stats");
  let html = `<table><tr><th>AK</th><th>Genutzt</th><th>Übrig</th></tr>`;
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
