const webAppUrl = "DEINE_GOOGLE_SCRIPT_URL"; // hier deine Google Apps Script URL einfügen
const adminPassword = "geheimespasswort"; // Passwort für Adminbereich

// Buchungsfunktion
function book() {
  const date = document.getElementById("date").value;
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  const simulator = document.getElementById("simulator").value;
  const numPlayers = parseInt(document.getElementById("numPlayers").value);
  const playerNumbers = document.getElementById("playerNumbers").value.split(",");

  fetch(webAppUrl, {
    method: "POST",
    body: JSON.stringify({
      date, start, end, simulator, numPlayers, playerNumbers
    })
  }).then(res => res.json())
    .then(data => {
      const result = document.getElementById("bookingResult");
      if(data.status === "gebucht") {
        result.style.color = "green";
        result.innerText = "Gebucht ✅";
      } else {
        result.style.color = "red";
        result.innerText = "Unzulässig ❌: " + data.reason;
      }
    });
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

// Admindaten laden
function loadAdminData() {
  fetch(webAppUrl)
    .then(res => res.json())
    .then(data => {
      // Spieler anzeigen
      const playerDiv = document.getElementById("playerTable");
      let html = "<table><tr><th>DGV</th><th>AK</th></tr>";
      data.players.forEach(p => {
        html += `<tr><td>${p.DGV}</td><td>${p.AK}</td></tr>`;
      });
      html += "</table>";
      playerDiv.innerHTML = html;

      // Buchungen anzeigen
      const statsDiv = document.getElementById("stats");
      let html2 = "<table><tr><th>Datum</th><th>Start</th><th>Ende</th><th>AK</th><th>Simulator</th><th>Dauer</th></tr>";
      data.bookings.forEach(b => {
        html2 += `<tr><td>${b.Datum}</td><td>${b.Start}</td><td>${b.Ende}</td><td>${b.AK}</td><td>${b.Simulator}</td><td>${b.Dauer}</td></tr>`;
      });
      html2 += "</table>";
      statsDiv.innerHTML = html2;
    });
}
