// Admin-Passwort
const adminPassword = "Matchplay";

// Google Sheets Web App URL
const webAppUrl = "DEINE_GOOGLE_SCRIPT_URL_HIER"; // <--- hier deine Web App URL einfügen

// Bisherige Nutzung pro AK (Stunden)
let akUsage = {};

// Alle Buchungen speichern
let bookings = [];

// Spieler-Daten aus Sheets
let playerAK = {};

// Dauer in Stunden berechnen
function calculateDuration(start, end) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh + em/60) - (sh + sm/60);
}

// Spieler-Daten aus Google Sheet laden
function loadPlayerData(callback) {
  fetch(webAppUrl)
    .then(res => res.json())
    .then(data => {
      playerAK = data; // z.B. { "123": "AK30", "124": "AK30" }
      // AK-Usage initialisieren
      akUsage = {};
      Object.values(playerAK).forEach(ak => {
        if (!akUsage[ak]) akUsage[ak] = 0;
      });
      if(callback) callback();
    })
    .catch(err => console.error("Fehler beim Laden der Spieler-Daten:", err));
}

// Buchung prüfen und speichern
function book() {
  const date = document.getElementById("date").value;
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  const simulator = document.getElementById("simulator").value;
  const numPlayers = parseInt(document.getElementById("numPlayers").value);
  const playerNumbers = document.getElementById("playerNumbers").value.split(",").map(s => s.trim());

  // Grundprüfungen
  if(!date || !start || !end || !numPlayers || !playerNumbers.length) {
    showResult("Bitte alle Felder ausfüllen!", false);
    return;
  }

  if(playerNumbers.length != numPlayers) {
    showResult("Anzahl Spieler stimmt nicht mit DGV-Nummern überein!", false);
    return;
  }

  if(calculateDuration(start, end) <= 0) {
    showResult("Endzeit muss nach Startzeit liegen!", false);
    return;
  }

  // Prüfen, ob Spieler existieren und in derselben AK
  const akSet = new Set();
  let unknownPlayers = [];
  playerNumbers.forEach(num => {
    if(playerAK[num]) {
      akSet.add(playerAK[num]);
    } else {
      unknownPlayers.push(num);
    }
  });

  if(unknownPlayers.length > 0) {
    showResult("Unbekannte Spieler: " + unknownPlayers.join(", "), false);
    return;
  }

  if(akSet.size > 1) {
    showResult("Spieler gehören zu unterschiedlichen AKs!", false);
    return;
  }

  const ak = [...akSet][0];

  // Kontingent prüfen
  const duration = calculateDuration(start, end);
  if((akUsage[ak] || 0) + duration > 4) {
    showResult(`Kontingent für ${ak} ausgeschöpft!`, false);
    return;
  }

  // Alles ok, Buchung speichern
  bookings.push({
    date, start, end, simulator, numPlayers, playerNumbers, ak
  });

  akUsage[ak] = (akUsage[ak] || 0) + duration;

  showResult("Gebucht!", true);
  updateStats();
}

// Ergebnis anzeigen
function showResult(msg, success) {
  const el = document.getElementById("bookingResult");
  el.innerText = msg;
  el.style.color = success ? "lime" : "red";
}

// Adminbereich freischalten
function unlockAdmin() {
  const pass = document.getElementById("adminPass").value;
  if(pass === adminPassword) {
    document.getElementById("adminPanel").style.display = "block";
    loadAdminData();
  } else {
    alert("Falsches Passwort!");
  }
}

// Adminbereich laden
function loadAdminData() {
  const playerDiv = document.getElementById("playerTable");
  playerDiv.innerHTML = "<h4>Alle Buchungen</h4>";
  if(bookings.length === 0){
    playerDiv.innerHTML += "<p>Keine Buchungen vorhanden</p>";
  } else {
    const table = document.createElement("table");
    table.innerHTML = "<tr><th>Datum</th><th>Start</th><th>Ende</th><th>Sim</th><th>AK</th><th>Spieler</th><th>Löschen</th></tr>";
    bookings.forEach((b, i) => {
      const row = table.insertRow();
      row.insertCell().innerText = b.date;
      row.insertCell().innerText = b.start;
      row.insertCell().innerText = b.end;
      row.insertCell().innerText = b.simulator;
      row.insertCell().innerText = b.ak;
      row.insertCell().innerText = b.playerNumbers.join(", ");
      const btn = document.createElement("button");
      btn.innerText = "Löschen";
      btn.onclick = () => deleteBooking(i);
      row.insertCell().appendChild(btn);
    });
    playerDiv.appendChild(table);
  }

  updateStats();
}

// Buchung löschen
function deleteBooking(index) {
  const b = bookings[index];
  const duration = calculateDuration(b.start, b.end);
  akUsage[b.ak] -= duration;
  bookings.splice(index, 1);
  loadAdminData();
}

// Statistik aktualisieren
function updateStats() {
  const statsDiv = document.getElementById("stats");
  statsDiv.innerHTML = "<h4>AK Statistik</h4>";
  let html = "<table><tr><th>AK</th><th>genutzt</th><th>übrig</th></tr>";
  for(const ak in akUsage) {
    const used = akUsage[ak];
    const remaining = Math.max(4 - used, 0);
    html += `<tr><td>${ak}</td><td>${used}</td><td>${remaining}</td></tr>`;
  }
  html += "</table>";
  statsDiv.innerHTML = html;
}

// Beim Laden der Seite Spieler-Daten laden
window.onload = () => loadPlayerData();
