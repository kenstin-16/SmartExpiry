// =============================================
//  SmartExpiry — auth.js
//  Handles login & signup with Firebase Auth
// =============================================

function showAuthError(msg) {
  const el = document.getElementById("authError");
  if (el) {
    el.textContent = msg;
    el.style.display = "block";
  } else {
    alert(msg);
  }
}

function clearAuthError() {
  const el = document.getElementById("authError");
  if (el) el.textContent = "";
}

function setLoading(btnSelector, loading) {
  const btn = document.querySelector(btnSelector);
  if (!btn) return;
  if (loading) {
    btn.dataset.original = btn.querySelector("span")?.textContent || btn.textContent;
    const span = btn.querySelector("span");
    if (span) span.textContent = "Please wait...";
    btn.disabled = true;
    btn.style.opacity = "0.7";
  } else {
    const span = btn.querySelector("span");
    if (span && btn.dataset.original) span.textContent = btn.dataset.original;
    btn.disabled = false;
    btn.style.opacity = "1";
  }
}

// ---- SIGNUP ----
function signup() {
  clearAuthError();
  const email = document.getElementById("newUser").value.trim();
  const pass  = document.getElementById("newPass").value;

  if (!email || !pass) return showAuthError("Please fill in all fields.");
  if (pass.length < 6)  return showAuthError("Password must be at least 6 characters.");

  setLoading(".btn-auth", true);

  auth.createUserWithEmailAndPassword(email, pass)
    .then(() => {
      window.location.href = "login1.html";
    })
    .catch(err => {
      setLoading(".btn-auth", false);
      showAuthError(friendlyError(err.code));
    });
}

// ---- LOGIN ----
function login() {
  clearAuthError();
  const email = document.getElementById("loginUser").value.trim();
  const pass  = document.getElementById("loginPass").value;

  if (!email || !pass) return showAuthError("Please fill in all fields.");

  setLoading(".btn-auth", true);

  auth.signInWithEmailAndPassword(email, pass)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch(err => {
      setLoading(".btn-auth", false);
      showAuthError(friendlyError(err.code));
    });
}

// ---- FRIENDLY ERROR MESSAGES ----
function friendlyError(code) {
  const errors = {
    "auth/user-not-found":       "No account found with this email.",
    "auth/wrong-password":       "Incorrect password. Please try again.",
    "auth/invalid-email":        "Please enter a valid email address.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password":        "Password must be at least 6 characters.",
    "auth/too-many-requests":    "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Check your connection.",
  };
  return errors[code] || "Something went wrong. Please try again.";
}

// ---- ENTER KEY SUPPORT ----
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    if (document.getElementById("newUser"))   signup();
    if (document.getElementById("loginUser")) login();
  }
});