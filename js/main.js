const toast = document.getElementById("toast");
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
const navLinks = document.querySelectorAll(".nav-link");

function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 3000);
}

if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
        const opened = mainNav.classList.toggle("open");
        menuToggle.setAttribute("aria-expanded", opened);
        document.body.classList.toggle("menu-open", opened);
    });
}

navLinks.forEach(link => {
    link.addEventListener("click", () => {
        if (mainNav) mainNav.classList.remove("open");
        if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("menu-open");
    });
});

const currentPage = window.location.pathname.split("/").pop() || "index.html";
navLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (href && !href.startsWith("http") && href !== "#") {
        link.classList.toggle("active", href === currentPage);
    }
});

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setError(id, message) {
    const element = document.getElementById(id);
    if (element) element.textContent = message;
}

const contactForm = document.getElementById("contactForm");
if (contactForm) {
    contactForm.addEventListener("submit", event => {
        event.preventDefault();
        const name = document.getElementById("contactName").value.trim();
        const email = document.getElementById("contactEmail").value.trim();
        const message = document.getElementById("contactMessage").value.trim();

        setError("contactNameError", "");
        setError("contactEmailError", "");
        setError("contactMessageError", "");
        let valid = true;

        if (name.length < 2) {
            setError("contactNameError", "Please enter your name.");
            valid = false;
        }
        if (!validEmail(email)) {
            setError("contactEmailError", "Please enter a valid email.");
            valid = false;
        }
        if (message.length < 10) {
            setError("contactMessageError", "Message must be at least 10 characters.");
            valid = false;
        }
        if (!valid) {
            showToast("Please fix the form errors.");
            return;
        }

        const messages = JSON.parse(localStorage.getItem("portfolioMessages") || "[]");
        messages.push({ name, email, message, date: new Date().toISOString() });
        localStorage.setItem("portfolioMessages", JSON.stringify(messages));
        contactForm.reset();
        showToast("Message saved successfully!");
    });
}

const signupForm = document.getElementById("signupForm");
if (signupForm) {
    signupForm.addEventListener("submit", event => {
        event.preventDefault();
        const name = document.getElementById("signupName").value.trim();
        const email = document.getElementById("signupEmail").value.trim().toLowerCase();
        const password = document.getElementById("signupPassword").value;
        const confirm = document.getElementById("signupConfirm").value;

        if (name.length < 2) return showToast("Please enter your full name.");
        if (!validEmail(email)) return showToast("Please enter a valid email.");
        if (password.length < 6) return showToast("Password must be at least 6 characters.");
        if (password !== confirm) return showToast("Passwords do not match.");

        localStorage.setItem("portfolioUser", JSON.stringify({
            name, email, password, createdAt: new Date().toISOString()
        }));
        signupForm.reset();
        showToast("Account created! You can now log in.");
        setTimeout(() => window.location.href = "login.html", 700);
    });
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", event => {
        event.preventDefault();
        const email = document.getElementById("loginEmail").value.trim().toLowerCase();
        const password = document.getElementById("loginPassword").value;
        const savedUser = JSON.parse(localStorage.getItem("portfolioUser"));

        if (!savedUser) return showToast("No account found. Please sign up first.");
        if (email !== savedUser.email || password !== savedUser.password) {
            return showToast("Email or password is incorrect.");
        }

        localStorage.setItem("portfolioLoggedIn", "true");
        loginForm.reset();
        showToast(`Welcome back, ${savedUser.name}!`);
        setTimeout(() => window.location.href = "dashboard.html", 700);
    });
}

const forgotPassword = document.getElementById("forgotPassword");
if (forgotPassword) {
    forgotPassword.addEventListener("click", event => {
        event.preventDefault();
        const savedUser = JSON.parse(localStorage.getItem("portfolioUser"));
        showToast(savedUser ? `Password reset would be sent to ${savedUser.email}.` : "Create an account first.");
    });
}

const subscribeForm = document.getElementById("subscribeForm");
if (subscribeForm) {
    subscribeForm.addEventListener("submit", event => {
        event.preventDefault();
        const emailInput = document.getElementById("subscribeEmail");
        const email = emailInput.value.trim().toLowerCase();
        if (!validEmail(email)) return showToast("Please enter a valid email.");
        const subscribers = JSON.parse(localStorage.getItem("portfolioSubscribers") || "[]");
        if (!subscribers.includes(email)) subscribers.push(email);
        localStorage.setItem("portfolioSubscribers", JSON.stringify(subscribers));
        emailInput.value = "";
        showToast("You are subscribed!");
    });
}
