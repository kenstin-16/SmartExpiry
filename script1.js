// =============================================
//  SmartExpiry — script1.js
//  Dashboard logic: load, add, delete, display
// =============================================

let items = [];
let currentUser;
let chart;
let unsubscribe; // Firestore real-time listener

// ---- AUTH GUARD ----
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login1.html";
  } else {
    currentUser = user.uid;
    listenItems(); // real-time instead of one-time .get()
  }
});

// ---- REAL-TIME LISTENER ----
function listenItems() {
  if (unsubscribe) unsubscribe(); // clean up old listener

  unsubscribe = db.collection("items")
    .where("user", "==", currentUser)
    .orderBy("date", "asc")
    .onSnapshot(snapshot => {
      items = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });
      displayItems();
      checkExpiryAlerts();
    }, err => {
      console.error("Firestore error:", err);
      showNotification("Error loading items.", "error");
    });
}

// ---- ADD ITEM ----
function addItem() {
  const name = document.getElementById("name").value.trim();
  const date = document.getElementById("date").value;

  if (!name) return showNotification("Please enter a product name.", "error");
  if (!date) return showNotification("Please select an expiry date.", "error");

  // Prevent adding already-past dates (optional UX improvement)
  const today = new Date();
  today.setHours(0,0,0,0);

  const btn = document.querySelector(".btn-add");
  if (btn) { btn.disabled = true; btn.style.opacity = "0.6"; }

  db.collection("items").add({
    name,
    date,
    user: currentUser,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    document.getElementById("name").value = "";
    document.getElementById("date").value = "";
    showNotification(`"${name}" added successfully!`, "success");
  })
  .catch(err => {
    console.error(err);
    showNotification("Failed to add item.", "error");
  })
  .finally(() => {
    if (btn) { btn.disabled = false; btn.style.opacity = "1"; }
  });
}

// ---- DELETE ITEM ----
function deleteItem(id, name) {
  if (!confirm(`Delete "${name}"?`)) return;

  db.collection("items").doc(id).delete()
    .then(() => showNotification(`"${name}" removed.`, "success"))
    .catch(() => showNotification("Failed to delete item.", "error"));
}

// ---- DISPLAY ITEMS ----
function displayItems(filtered) {
  const list = document.getElementById("list");
  list.innerHTML = "";

  const today = new Date();
  today.setHours(0,0,0,0);

  const source = filtered !== undefined ? filtered : items;

  let total = items.length;
  let fresh = 0, warning = 0, expired = 0;

  // Always count from full items list for stats
  items.forEach(item => {
    const expiry = new Date(item.date);
    const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (diff < 0)      expired++;
    else if (diff <= 7) warning++;
    else                fresh++;
  });

  document.getElementById("total").innerText   = total;
  document.getElementById("fresh").innerText   = fresh;
  document.getElementById("warning").innerText = warning;
  document.getElementById("expired").innerText = expired;

  // Render cards
  if (source.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <p style="color:var(--text2);font-size:14px;text-align:center;padding:40px 0;grid-column:1/-1;">
        No items found. Add your first product above!
      </p>
    </div>`;
  } else {
    source.forEach(item => {
      const expiry = new Date(item.date);
      const diff   = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

      let cls, badgeClass, statusText;

      if (diff < 0) {
        cls = "expired";   badgeClass = "badge-expired"; statusText = "Expired";
      } else if (diff === 0) {
        cls = "warning";   badgeClass = "badge-warning"; statusText = "Expires today!";
      } else if (diff <= 7) {
        cls = "warning";   badgeClass = "badge-warning"; statusText = `${diff} day${diff===1?'':'s'} left`;
      } else {
        cls = "fresh";     badgeClass = "badge-fresh";   statusText = `${diff} days left`;
      }

      // Format date nicely
      const displayDate = expiry.toLocaleDateString("en-US", { year:"numeric", month:"short", day:"numeric" });

      list.innerHTML += `
      <div class="item ${cls}">
        <div>
          <p class="item-name">${escapeHtml(item.name)}</p>
          <p class="item-date">📅 ${displayDate}</p>
        </div>
        <span class="item-badge ${badgeClass}">${statusText}</span>
        <button class="item-delete" onclick="deleteItem('${item.id}', '${escapeHtml(item.name)}')">
          🗑 Remove
        </button>
      </div>`;
    });
  }

  // Update chart
  updateChart(fresh, warning, expired);
}

// ---- CHART ----
function updateChart(fresh, warning, expired) {
  const ctx = document.getElementById("myChart");
  if (!ctx) return;

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Fresh", "Expiring Soon", "Expired"],
      datasets: [{
        data: [fresh, warning, expired],
        backgroundColor: [
          "rgba(34,197,94,0.85)",
          "rgba(250,204,21,0.85)",
          "rgba(239,68,68,0.85)"
        ],
        borderColor: [
          "rgba(34,197,94,1)",
          "rgba(250,204,21,1)",
          "rgba(239,68,68,1)"
        ],
        borderWidth: 2,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      cutout: "68%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#94a3b8",
            padding: 16,
            font: { size: 13, family: "DM Sans" },
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: "#1a2438",
          titleColor: "#e2e8f0",
          bodyColor: "#94a3b8",
          borderColor: "rgba(255,255,255,0.07)",
          borderWidth: 1,
          padding: 12,
          cornerRadius: 10
        }
      }
    }
  });
}

// ---- SEARCH FILTER ----
function filterList(query) {
  const q = query.toLowerCase().trim();
  if (!q) {
    displayItems(); // show all
    return;
  }
  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(q)
  );
  displayItems(filtered);
}

// ---- TOAST NOTIFICATIONS ----
function showNotification(msg, type = "warning") {
  const box = document.getElementById("notify");
  if (!box) return;

  const div = document.createElement("div");
  div.className = `toast ${type}`;
  div.textContent = msg;

  box.appendChild(div);
  setTimeout(() => {
    div.style.opacity = "0";
    div.style.transform = "translateX(20px)";
    div.style.transition = "0.3s";
    setTimeout(() => div.remove(), 300);
  }, 3500);
}

// ---- EXPIRY ALERTS ----
function checkExpiryAlerts() {
  const today = new Date();
  today.setHours(0,0,0,0);

  items.forEach(item => {
    const expiry = new Date(item.date);
    const diff   = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (diff === 7) showNotification(`⚠️ ${item.name} expires in 7 days`, "warning");
    if (diff === 3) showNotification(`⚠️ ${item.name} expires in 3 days`, "warning");
    if (diff === 1) showNotification(`🚨 ${item.name} expires tomorrow!`, "warning");
    if (diff === 0) showNotification(`🚨 ${item.name} expires today!`, "error");
    if (diff < 0)  showNotification(`❌ ${item.name} has expired`, "error");
  });
}

// ---- HELPER: Prevent XSS ----
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ---- ENTER KEY: add item on Enter in name field ----
document.addEventListener("DOMContentLoaded", () => {
  const nameInput = document.getElementById("name");
  if (nameInput) {
    nameInput.addEventListener("keydown", e => {
      if (e.key === "Enter") addItem();
    });
  }
});