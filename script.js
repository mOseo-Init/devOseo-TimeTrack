// Supabase setup
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>


const { createClient } = supabase;
const supabaseUrl = "https://mzeuxrkqwpanidpijbwk.supabase.co";
const supabaseKey = "sb_publishable_x1zmt6S6U7_p_pWDjsVh3w_tfe7iWzw";
const db = createClient(supabaseUrl, supabaseKey);

let currentSession = null;

async function timeIn() {
  if (currentSession) {
    alert("Already timed in!");
    return;
  }
  currentSession = {
    date: new Date().toLocaleDateString(),
    mode: document.getElementById("workMode").value,
    timeIn: new Date(),
    timeOut: null,
    totalHours: 0
  };
  alert("Time In recorded!");
}

async function timeOut() {
  if (!currentSession) {
    alert("You need to time in first!");
    return;
  }
  currentSession.timeOut = new Date();
  let diff = (currentSession.timeOut - currentSession.timeIn) / (1000 * 60 * 60);
  currentSession.totalHours = diff.toFixed(2);

  // Save to Supabase
  await db.from("logs").insert({
    date: currentSession.date,
    mode: currentSession.mode,
    time_in: currentSession.timeIn.toISOString(),
    time_out: currentSession.timeOut.toISOString(),
    total_hours: currentSession.totalHours
  });

  currentSession = null;
  renderLogs();
}

async function renderLogs() {
  let tbody = document.querySelector("#logTable tbody");
  tbody.innerHTML = "";
  let totalMonth = 0;
  let currentMonth = new Date().getMonth();

  let { data: logs } = await db.from("logs").select("*");

  logs.forEach(log => {
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${log.date}</td>
      <td>${log.mode}</td>
      <td>${new Date(log.time_in).toLocaleTimeString()}</td>
      <td>${new Date(log.time_out).toLocaleTimeString()}</td>
      <td>${log.total_hours}</td>
    `;
    tbody.appendChild(tr);

    if (new Date(log.time_in).getMonth() === currentMonth) {
      totalMonth += parseFloat(log.total_hours);
    }
  });

  document.getElementById("monthlyHours").innerText =
    "Total Hours This Month: " + totalMonth.toFixed(2);
}
