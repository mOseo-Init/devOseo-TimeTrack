// Firebase setup (replace with your Firebase project config)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let currentSession = null;

function timeIn() {
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

function timeOut() {
  if (!currentSession) {
    alert("You need to time in first!");
    return;
  }
  currentSession.timeOut = new Date();
  let diff = (currentSession.timeOut - currentSession.timeIn) / (1000 * 60 * 60);
  currentSession.totalHours = diff.toFixed(2);

  // Save to Firestore
  db.collection("logs").add(currentSession).then(() => {
    alert("Session saved!");
    currentSession = null;
    renderLogs();
  });
}

function renderLogs() {
  let tbody = document.querySelector("#logTable tbody");
  tbody.innerHTML = "";
  let totalMonth = 0;
  let currentMonth = new Date().getMonth();

  db.collection("logs").get().then(snapshot => {
    snapshot.forEach(doc => {
      let log = doc.data();
      let tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${log.date}</td>
        <td>${log.mode}</td>
        <td>${new Date(log.timeIn).toLocaleTimeString()}</td>
        <td>${new Date(log.timeOut).toLocaleTimeString()}</td>
        <td>${log.totalHours}</td>
      `;
      tbody.appendChild(tr);

      if (new Date(log.timeIn).getMonth() === currentMonth) {
        totalMonth += parseFloat(log.totalHours);
      }
    });

    document.getElementById("monthlyHours").innerText =
      "Total Hours This Month: " + totalMonth.toFixed(2);
  });
}
