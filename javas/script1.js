let items = [];
let currentUser;
let chart;

// AUTH
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "login1.html";
    } else {
        currentUser = user.uid;
        loadItems();
    }
});

// LOAD
function loadItems() {
    db.collection("items")
    .where("user", "==", currentUser)
    .get()
    .then(snapshot => {
        items = [];
        snapshot.forEach(doc => {
            items.push({ id: doc.id, ...doc.data() });
        });
        displayItems();
        checkExpiryAlerts();
    });
}

// ADD
function addItem() {
    let name = document.getElementById("name").value;
    let date = document.getElementById("date").value;

    if (!name || !date) return alert("Fill all fields");

    db.collection("items").add({
        name,
        date,
        user: currentUser
    }).then(() => loadItems());
}

// DELETE
function deleteItem(id) {
    db.collection("items").doc(id).delete()
    .then(() => loadItems());
}

// DISPLAY
function displayItems() {
    let list = document.getElementById("list");
    list.innerHTML = "";

    let today = new Date();

    let total = items.length;
    let fresh = 0, warning = 0, expired = 0;

    items.forEach(item => {
        let expiry = new Date(item.date);
        let diff = Math.ceil((expiry - today)/(1000*60*60*24));

        let cls = "";
        let text = "";

        if (diff < 0) {
            cls = "red"; expired++; text = "Expired";
        } else if (diff <= 3) {
            cls = "yellow"; warning++; text = diff + " days left";
        } else {
            cls = "green"; fresh++; text = diff + " days left";
        }

        list.innerHTML += `
        <div class="item ${cls}">
            <h3>${item.name}</h3>
            <p>${item.date}</p>
            <p>${text}</p>
            <button onclick="deleteItem('${item.id}')">Delete</button>
        </div>`;
    });

    document.getElementById("total").innerText = total;
    document.getElementById("fresh").innerText = fresh;
    document.getElementById("warning").innerText = warning;
    document.getElementById("expired").innerText = expired;

    let ctx = document.getElementById("myChart");

    if (chart) chart.destroy();

    if (ctx) {
        chart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Fresh", "Expiring", "Expired"],
                datasets: [{ data: [fresh, warning, expired] }]
            }
        });
    }
}

// NOTIFICATIONS
function showNotification(msg, type="warning") {
    let box = document.getElementById("notify");

    let div = document.createElement("div");
    div.className = "toast " + type;
    div.innerText = msg;

    box.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// EXPIRY ALERTS
function checkExpiryAlerts() {
    let today = new Date();

    items.forEach(item => {
        let expiry = new Date(item.date);
        let diff = Math.ceil((expiry - today)/(1000*60*60*24));

        if (diff === 3) showNotification(item.name + " expires in 3 days", "warning");
        if (diff <= 0) showNotification(item.name + " is expired", "error");
    });
}