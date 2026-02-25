const adminPassword = "geheimespasswort"; // ändere das Passwort auf ein sicheres

function unlockAdmin(){
  let input = document.getElementById("adminPass").value;
  if(input === adminPassword){
    document.getElementById("adminPanel").style.display = "block";
    alert("Adminbereich freigeschaltet");
    loadAdminData();
  } else {
    alert("Zugriff verweigert");
  }
}

function book(){
  const date = document.getElementById("date").value;
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  const numPlayers = parseInt(document.getElementById("numPlayers").value);
  const simulator = document.getElementById("simulator").value;
  const playerNumbers = document.getElementById("playerNumbers").value.split(",").map(x=>x.trim());

  if(numPlayers < 3){
    document.getElementById("bookingResult").innerHTML = "<span class='red'>Unzulässig – mindestens 3 Spieler</span>";
    return;
  }

  // Hier Web-App URL einfügen
  const webAppUrl = "https://script.google.com/macros/s/AKfycbxEugQCAXnmaft1NA561rVC9poxptzABXtTUU3dNf6K3zmyz7tctCWwUv73SgwbZrpN/exec";

  fetch(webAppUrl, {
    method: "POST",
    body: JSON.stringify({
      date,
      start,
      end,
      simulator,
      playerNumbers
    })
  })
  .then(res => res.json())
  .then(data => {
    if(data.status === "gebucht"){
      document.getElementById("bookingResult").innerHTML = "<span class='green'>Gebucht ✅</span>";
    } else {
      document.getElementById("bookingResult").innerHTML = "<span class='red'>Unzulässig ❌: " + data.reason + "</span>";
    }
  });
}

function loadAdminData(){
  const webAppUrl = "DEINE_GOOGLE_SCRIPT_URL";
  fetch(webAppUrl)
  .then(res => res.json())
  .then(data => {
    let html = "<table><tr><th>DGV</th><th>AK</th></tr>";
    data.players.forEach(p => {
      html += `<tr><td>${p.DGV}</td><td>${p.AK}</td></tr>`;
    });
    html += "</table>";
    document.getElementById("playerTable").innerHTML = html;

    // Optional: Buchungen / Statistiken
  });
}
