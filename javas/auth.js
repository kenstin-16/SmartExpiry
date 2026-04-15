function signup() {
    let email = document.getElementById("newUser").value;
    let pass = document.getElementById("newPass").value;

    if (!email || !pass) return alert("Fill all fields");

    auth.createUserWithEmailAndPassword(email, pass)
    .then(() => {
        alert("Account created!");
        window.location.href = "login1.html";
    })
    .catch(err => alert(err.message));
}

function login() {
    let email = document.getElementById("loginUser").value;
    let pass = document.getElementById("loginPass").value;

    if (!email || !pass) return alert("Fill all fields");

    auth.signInWithEmailAndPassword(email, pass)
    .then(() => {
        window.location.href = "dashboard.html";
    })
    .catch(err => alert(err.message));
}