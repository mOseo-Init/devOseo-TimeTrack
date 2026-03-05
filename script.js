// Supabase setup
// Include this in your index.html before script.js:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const { createClient } = supabase;
const supabaseUrl = "https://mzeuxrkqwpanidpijbwk.supabase.co";
const supabaseKey = "sb_publishable_x1zmt6S6U7_p_pWDjsVh3w_tfe7iWzw";
const db = createClient(supabaseUrl, supabaseKey);

let logs = []; // fetched from Supabase

// Parse time string (HH:MM) into Date object
function parseTime(timeStr) {
  let [hour, minute] = timeStr.split(":").map(Number);
  let now = new Date();
  now.setHours(hour, minute, 0, 0);
  return now;
}

// Save session to Supabase
async function saveSession() {
  let mode = document.getElementById("workMode").value;
  let timeIn = document.getElementById("timeIn").value;
  let timeOut = document.getElementById("timeOut").value;
  let lunchIn = document.getElementById("lunchIn").value;
  let lunchOut = document.getElementById("lunchOut").value;

  if (!timeIn || !timeOut) {
    alert("Please select time in and time out!");
    return;
  }

  let date = new Date().toLocaleDateString();

  let start = parseTime(timeIn);
  let end = parseTime(timeOut);
  let totalHours = (end - start) / (1000 * 60 * 60);

  if (lunchIn && lunchOut) {
    let lunchStart = parseTime(lunchIn);
    let lunchEnd = parseTime(lunchOut);
    let lunchHours = (lunchEnd - lunchStart) / (1000 * 60 * 60);
    totalHours -= lunchHours;
  }

  let log = {
    date,
    mode,
    time_in: start.toISOString(),
    time_out: end.toISOString(),
    lunch_in: lunchIn ? parseTime(lunchIn).toISOString() : null,
    lunch_out: lunchOut ? parseTime(lunchOut).toISOString() : null,
    total_hours: totalHours.toFixed(2)
  };

  // Save to Supabase
  let { error } = await db.from("logs").insert(log);
  if (error) {
    console.error(error);
    alert("Error saving session!");
  } else {
    alert("Session saved!");
    renderLogs();
  }
}

// Render logs from Supabase
async function renderLogs() {
  let tbody = document.querySelector("#logTable tbody");
  tbody.innerHTML = "";
  let totalWeek = 0, totalMonth = 0;
  let today = new Date();
  let currentMonth = today.getMonth();
  let currentWeek = getWeekNumber(today);

  let { data: logsData, error } = await db.from("logs").select("*").order("id", { ascending: true });
  if (error) {
    console.error(error);
    return;
  }
  logs = logsData;

  logs.forEach(log => {
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${log.date}</td>
      <td>${log.mode}</td>
      <td>${new Date(log.time_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
      <td>${new Date(log.time_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
      <td>${log.lunch_in && log.lunch_out ? 
            new Date(log.lunch_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + " - " +
            new Date(log.lunch_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "None"}</td>
      <td>${log.total_hours}</td>
    `;
    tbody.appendChild(tr);

    let logDate = new Date(log.time_in);
    if (logDate.getMonth() === currentMonth) {
      totalMonth += parseFloat(log.total_hours);
    }
    if (getWeekNumber(logDate) === currentWeek) {
      totalWeek += parseFloat(log.total_hours);
    }
  });

  document.getElementById("weeklyHours").innerText = "Total Hours This Week: " + totalWeek.toFixed(2);
  document.getElementById("monthlyHours").innerText = "Total Hours This Month: " + totalMonth.toFixed(2);

  // OJT Progress
  let totalOJT = logs.reduce((sum, log) => sum + parseFloat(log.total_hours), 0);
  let percent = (totalOJT / 300 * 100).toFixed(2);
  document.getElementById("ojtProgress").innerText = `OJT Progress: ${totalOJT.toFixed(2)} / 300 hrs (${percent}%)`;
}

// Helper: Get week number
function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  let dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  let yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

// Load logs on page load
renderLogs();
