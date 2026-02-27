// =========================
// Komplettes Script.js für Buchungssystem
// =========================

const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxBWNB1N7woI9fsei70oobUMSPgTuBnjuCONKvXBjN9ibnnOuoLsDZh7-NCB34xZW23/exec";

// --- DOM Elemente ---
const datumInput = document.getElementById("datum");
const startInput = document.getElementById("start");
const endInput = document.getElementById("end");
const spielerInput = document.getElementById("spieler");
const baysCheckboxes = document.querySelectorAll(".bay-checkbox");
const submitBtn = document.getElementById("submit");
const messageBox = document.getElementById("message");
const adminTable = document.getElementById("adminTable");

// --- Spieler laden (für Debug/optional Dropdown) ---
async function loadPlayers() {
  try {
    const res = await fetch(WEBAPP_URL + "?type=players");
    const data = await res.json();
    console.log("Spieler geladen:", data);
  } catch(e) {
    console.error("Fehler beim Laden der Spieler:", e);
  }
}

// --- Buchungen laden (Adminbereich) ---
async function loadBookings() {
  try {
    const res = await fetch(WEBAPP_URL + "?type=bookings");
    const data = await res.json();
    adminTable.innerHTML = "";
    data.forEach(b => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${b.datum}</td>
        <td>${b.spieler}</td>
        <td>${b.ak}</td>
        <td>${b.start} - ${b.end}</td>
        <td>${b.bays}</td>
        <td>${b.endpreis.toFixed(2)}€</td>
        <td><button class="delete-btn" data-ts="${b.timestamp}">Löschen</button></td>
      `;
      adminTable.appendChild(row);
    });
    document.querySelectorAll(".delete-btn").forEach(btn=>{
      btn.addEventListener("click", deleteBooking);
    });
  } catch(e) {
    console.error("Fehler beim Laden der Buchungen:", e);
  }
}

// --- Löschen einer Buchung ---
async function deleteBooking(e) {
  const ts = e.target.dataset.ts;
  if(!confirm("Wirklich löschen?")) return;
  try {
    await fetch(WEBAPP_URL, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({deleteTimestamp: ts})
    });
    loadBookings();
  } catch(e) { console.error(e); }
}

// --- Buchung absenden ---
submitBtn.addEventListener("click", async ()=>{
  const datum = datumInput.value;
  const start = startInput.value;
  const end = endInput.value;
  const spieler = spielerInput.value.trim();
  const bays = Array.from(baysCheckboxes).filter(cb=>cb.checked).length;
  if(!datum || !start || !end || !spieler || bays==0) {
    showMessage("Bitte alle Felder ausfüllen!",false);
    return;
  }
  const bayNamen = Array.from(baysCheckboxes).filter(cb=>cb.checked).map(cb=>cb.value).join(", ");

  try {
    const res = await fetch(WEBAPP_URL,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({datum,start,end,spieler,bays,bayNamen})
    });
    const data = await res.json();
    showMessage(data.msg,data.success);
    if(data.success){
      setTimeout(resetForm,7000);
      loadBookings();
    }
  } catch(e){
    showMessage("Fehler beim Buchen!",false);
    console.error(e);
  }
});

// --- Nachricht anzeigen ---
function showMessage(msg,success){
  messageBox.textContent = msg;
  messageBox.style.color = success ? "green" : "red";
}

// --- Form zurücksetzen ---
function resetForm(){
  datumInput.value = "";
  startInput.value = "";
  endInput.value = "";
  spielerInput.value="";
  baysCheckboxes.forEach(cb=>cb.checked=false);
  messageBox.textContent="";
}

// --- Initialisierung ---
loadPlayers();
loadBookings();
