const webAppUrl = "https://script.google.com/macros/s/AKfycbybwhWvvO_Qb0UhbN_GYTQmLamEh0p6Bx_fbkDO-G3iIpKB7r6uC0inRG1sQIUFTnhceg/exec";
const adminPassword = "Matchplay";
const MAX_HOURS_PER_AK = 4;

let playerAK = {};
let bookings = [];
let akUsage = {};

/* =========================
   SPIELER LADEN (BLOCKIEREND)
   ========================= */
window.onload = async () => {
  const res = await fetch(webAppUrl);
  const data = await res.json();

  // 🔒 ABSICHERUNG: ALLE KEYS ALS STRING
  playerAK = {};
  Object.keys(data).forEach(k => {
    playerAK[String(k).trim()] = String(data[k]).trim();
  });

  console.log("✅ Spieler geladen:", playerAK);
};

/* ========================= */
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

/* =========================
   BUCHEN
   ========================= */
function book() {
  const date = document.getElementById("date").value;
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  const numPlayers = parseInt(document.getElementById("numPlayers").value);

  // 🔒 HIER IST DER FIX
  const players = document
    .getElementById("playerNumbers")
    .value
    .split(",")
    .map(p => String(p).trim());

  if (!date || !start || !end || players.length !== numPlayers) {
    showResult("Bitte alle Felder korrekt ausfüllen", false);
    return;
  }

  let akSet = new Set();
  let unknown = [];

  players.forEach(p => {
    if (playerAK.hasOwnProperty(p)) {
      akSet.add(playerAK[p]);
    } else {
      unknown.push(p);
    }
  });

  if (unknown.length > 0) {
    showResult("Unbekannte Spieler: " + unknown.join(", "), false);
    console.error("❌ Unbekannt:", unknown, " | Verfügbar:", Object.keys(playerAK));
    return;
  }

  if (akSet.size !== 1) {
    showResult("Spieler gehören zu unterschiedlichen AKs", false);
    return;
  }

  const ak = [...akSet][0];
  const duration = calcDuration(start, end);
  akUsage[ak] = akUsage[ak] || 0;

  if (akUsage[ak] + duration > MAX_HOURS_PER_AK) {
    showResult(`Kontingent für ${ak} ausgeschöpft`, false);
    return;
  }

  bookings.push({ date, start, end, ak, players });
  akUsage[ak] += duration;

  showResult("Gebucht ✅", true);
}

/* =========================
   ADMIN
   ========================= */
function unlockAdmin() {
  if (document.getElementById("adminPass").value === adminPassword) {
    document.getElementById("adminPanel").style.display = "block";
  } else {
    alert("Falsches Passwort");
  }
}
