/************************************************
 * GCH RABATT – Komplette Buchungslogik
 ************************************************/

// 🔗 Web-App URL einfügen
const webAppUrl = "HIER_DEINE_WEBAPP_URL_EINFÜGEN";

// 🔐 Admin Passwort
const adminPassword = "Matchplay";

// Spieler und Buchungen
let playerAK = {};
let bookings = [];

// Preis pro Stunde (vor/nach 16 Uhr)
const priceBefore16 = 37.5;
const priceAfter16  = 45;

// =======================
// INITIAL LADEN
// =======================
window.onload = async () => {
  await loadDataFromSheets();
};

// =======================
// SPIELER & BUCHUNGEN LADEN
// =======================
async function loadDataFromSheets() {
  try {
    const res = await fetch(webAppUrl);
    const data = await res.json();
    playerAK = data.players || {};
    bookings = data.bookings || [];
  } catch (err) {
    console.error("Fehler beim Laden der Daten:", err);
  }
}

// =======================
// BUCHUNG
// =======================
function book() {
  const date = document.getElementById("date").value;
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  const simulator = document.getElementById("simulator").value;
  const numPlayers = parseInt(document.getElementById("numPlayers").value);
  const playerNumbers = document
    .getElementById("playerNumbers")
    .value
    .split(",")
    .map(p => p.trim())
    .map(p => String(p))
    .filter(p => p !== "");

  // Grundprüfungen
  if (!date || !start || !end || !numPlayers || playerNumbers.length === 0) {
    showResult("Bitte alle Felder ausfüllen", false);
    return;
  }
  if (playerNumbers.length !== numPlayers) {
    showResult("Anzahl Spieler stimmt nicht", false);
    return;
  }

  // AK prüfen
  const akSet = new Set();
  for (let p of playerNumbers) {
    const key = String(p);
    if (!playerAK.hasOwnProperty(key)) {
      showResult("Unbekannter Spieler: " + p, false);
      return;
    }
    akSet.add(playerAK[key]);
  }
  if (akSet.size > 1) {
    showResult("Spieler müssen in derselben AK sein", false);
    return;
  }
  const ak = [...akSet][0];

  // Dauer berechnen
  const duration = calculateDuration(start, end);
  if (duration <= 0) {
    showResult("Endzeit muss nach Startzeit liegen", false);
    return;
  }

  // Preis berechnen
  const price = calculatePrice(start, duration);

  // POST an Web-App
  fetch(webAppUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date,
      start,
      end,
      simulator,
      ak,
      players: playerNumbers,
      price
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "ok") {
        showResult("Gebucht ✅ – Preis: " + price.toFixed(2) + " €", true);
        loadAdminData();
        showBookingOverview(playerNumbers, ak, duration, price);
      } else {
        showResult("Fehler beim Speichern", false);
      }
    })
    .catch(() => showResult("Verbindungsfehler", false));
}

// =======================
// ZEIT & PREIS BERECHNEN
// =======================
function calculateDuration(start, end) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh + em / 60) - (sh + sm / 60);
}

function calculatePrice(start, duration) {
  const hour = parseInt(start.split(":")[0], 10);
  const rate = hour < 16 ? priceBefore16 : priceAfter16;
  return rate * duration * 0.5; // 50% Rabatt
}

// =======================
// ERGEBNIS ANZEIGEN
// =======================
function showResult(msg, success) {
  const el = document.getElementById("bookingResult");
  el.innerText = msg;
  el.style.color = success ? "lime" : "red";
}

// =======================
// BUCHUNGSÜBERSICHT 7 SEKUNDEN
// =======================
function showBookingOverview(playerNumbers, ak, duration, price) {
  const overviewDiv = document.getElementById("bookingOverview");
  let html = "<h4>Buchungsübersicht</h4>";
  html += `<p>Spieler: ${playerNumbers.join(", ")}</p>`;
  html += `<p>AK: ${ak}</p>`;
  html += `<p>Dauer: ${duration.toFixed(1)} Std</p>`;
  html += `<p>Preis: ${price.toFixed(2)} €</p>`;
  overviewDiv.innerHTML = html;
  overviewDiv.style.display = "block";

  setTimeout(() => {
    overviewDiv.innerHTML = "";
    overviewDiv.style.display = "none";
    // Formular zurücksetzen
    document.getElementById("date").value = "";
    document.getElementById("start").value = "";
    document.getElementById("end").value = "";
    document.getElementById("simulator").value = "";
    document.getElementById("numPlayers").value = "";
    document.getElementById("playerNumbers").value = "";
    document.getElementById("bookingResult").innerText = "";
  }, 7000);
}

// =======================
// ADMIN
// =======================
function unlockAdmin() {
  const pass = document.getElementById("adminPass").value;
  if (pass === adminPassword) {
    document.getElementById("adminPanel").style.display = "block";
    loadAdminData();
  } else {
    alert("Falsches Passwort!");
  }
}

function loadAdminData() {
  fetch(webAppUrl)
    .then(res => res.json())
    .then(data => {
      bookings = data.bookings || [];
      const div = document.getElementById("adminBookings");
      if (bookings.length === 0) {
        div.innerHTML = "<p>Keine Buchungen vorhanden</p>";
        return;
      }
      let html =
        "<table><tr><th>Datum</th><th>Start</th><th>Ende</th><th>Simulator</th><th>AK</th><th>Spieler</th><th>Preis</th></tr>";
      bookings.forEach(b => {
        html += `<tr>
          <td>${b.date}</td>
          <td>${b.start}</td>
          <td>${b.end}</td>
          <td>${b.simulator}</td>
          <td>${b.ak}</td>
          <td>${b.players}</td>
          <td>${b.price.toFixed(2)} €</td>
        </tr>`;
      });
      html += "</table>";
      div.innerHTML = html;
    });
}
