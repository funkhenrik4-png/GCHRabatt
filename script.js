/************************************************
 * GCH RABATT – Frontend Script
 * Funktioniert direkt mit deinem Google Sheets
 ************************************************/

// 🔗 Web-App URL
const webAppUrl = "https://script.google.com/macros/s/AKfycbznW9L_T4nX1i6HLQqmN5d35SgL_Zw_tEiLFI52KLiCJF6Vv5-Z9mgwLQ8g4EphmY408Q/exec";

// 🔐 Admin Passwort
const adminPassword = "Matchplay";

// Spieler + Buchungen aus Sheets
let playerAK = {};
let bookings = [];

/* =========================
   INITIAL LADEN
   ========================= */
window.onload = async () => {
  await loadDataFromSheets();
};

/* =========================
   SPIELER & BUCHUNGEN LADEN
   ========================= */
async function loadDataFromSheets() {
  const res = await fetch(webAppUrl);
  const data = await res.json();
  playerAK = data.players || {};
  bookings = data.bookings || [];
};

/* =========================
   BUCHUNG
   ========================= */
function book() {
  const date = document.getElementById("date").value;
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  const simulator = document.getElementById("simulator").value;
  const numPlayers = parseInt(document.getElementById("numPlayers").value);
  const playerNumbers = document
    .getElementById("playerNumbers")
    .value.split(",")
    .map(p => p.trim())
    .filter(p => p !== "");

  if (!date || !start || !end || !numPlayers || playerNumbers.length === 0) {
    showResult("Bitte alle Felder ausfüllen", false);
    return;
  }

  if (playerNumbers.length !== numPlayers) {
    showResult("Anzahl Spieler passt nicht", false);
    return;
  }

  // AK prüfen
  const akSet = new Set();
  for (let p of playerNumbers) {
    if (!playerAK[p]) {
      showResult("Unbekannter Spieler: " + p, false);
      return;
    }
    akSet.add(playerAK[p]);
  }

  if (akSet.size !== 1) {
    showResult("Spieler müssen in derselben AK sein", false);
    return;
  }

  const ak = [...akSet][0];

  // POST an Google Sheets Web-App
  fetch(webAppUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date,
      start,
      end,
      simulator,
      ak,
      players: playerNumbers
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "ok") {
        showResult("Gebucht ✅ – Preis: " + data.price + " €", true);
        loadAdminData();
        // Formular nach 7 Sekunden zurücksetzen
        setTimeout(() => {
          document.getElementById("date").value = "";
          document.getElementById("start").value = "";
          document.getElementById("end").value = "";
          document.getElementById("simulator").value = "";
          document.getElementById("numPlayers").value = "";
          document.getElementById("playerNumbers").value = "";
          document.getElementById("bookingResult").innerText = "";
        }, 7000);
      } else {
        showResult("Fehler beim Speichern", false);
      }
    })
    .catch(() => {
      showResult("Verbindungsfehler", false);
    });
}

/* =========================
   MELDUNG
   ========================= */
function showResult(text, success) {
  const el = document.getElementById("bookingResult");
  el.innerText = text;
  el.style.color = success ? "lime" : "red";
}

/* =========================
   ADMIN LOGIN
   ========================= */
function unlockAdmin() {
  const pass = document.getElementById("adminPass").value;
  if (pass === adminPassword) {
    document.getElementById("adminPanel").style.display = "block";
    loadAdminData();
  } else {
    alert("Falsches Passwort");
  }
}

/* =========================
   ADMIN DATEN LADEN
   ========================= */
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
          <td>${b.price}</td>
        </tr>`;
      });

      html += "</table>";
      div.innerHTML = html;
    });
}
