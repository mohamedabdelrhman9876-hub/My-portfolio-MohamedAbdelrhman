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
