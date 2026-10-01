const toast = document.getElementById("toast");
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
const navLinks = document.querySelectorAll(".nav-link");

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

menuToggle.addEventListener("click", () => {
    const opened = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", opened);
    document.body.classList.toggle("menu-open", opened);
});

navLinks.forEach(link => {
    link.addEventListener("click", () => {
        mainNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("menu-open");
    });
});

const sections = document.querySelectorAll("main section[id]");

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            navLinks.forEach(link => {
                link.classList.toggle(
                    "active",
                    link.getAttribute("href") === `#${entry.target.id}`
                );
            });
        }
    });
}, {
    rootMargin: "-30% 0px -60% 0px"
});

sections.forEach(section => observer.observe(section));

document.getElementById("year").textContent = new Date().getFullYear();

function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setError(id, message) {
    document.getElementById(id).textContent = message;
}

const contactForm = document.getElementById("contactForm");

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

    messages.push({
        name,
        email,
        message,
        date: new Date().toISOString()
    });

    localStorage.setItem("portfolioMessages", JSON.stringify(messages));

    contactForm.reset();
    showToast("Message saved successfully!");
});

const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim().toLowerCase();
    const password = document.getElementById("signupPassword").value;
    const confirm = document.getElementById("signupConfirm").value;

    if (name.length < 2) {
        showToast("Please enter your full name.");
        return;
    }

    if (!validEmail(email)) {
        showToast("Please enter a valid email.");
        return;
    }

    if (password.length < 6) {
        showToast("Password must be at least 6 characters.");
        return;
    }

    if (password !== confirm) {
        showToast("Passwords do not match.");
        return;
    }

    const user = {
        name,
        email,
        password,
        createdAt: new Date().toISOString()
    };

    localStorage.setItem("portfolioUser", JSON.stringify(user));

    signupForm.reset();
    showToast("Account created! You can now log in.");
    setTimeout(() => {
        location.hash = "login";
    }, 600);
});

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", event => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    const savedUser = JSON.parse(localStorage.getItem("portfolioUser"));

    if (!savedUser) {
        showToast("No account found. Please sign up first.");
        return;
    }

    if (email !== savedUser.email || password !== savedUser.password) {
        showToast("Email or password is incorrect.");
        return;
    }

    localStorage.setItem("portfolioLoggedIn", "true");
    loginForm.reset();
    showToast(`Welcome back, ${savedUser.name}!`);
});

document.getElementById("forgotPassword").addEventListener("click", event => {
    event.preventDefault();

    const savedUser = JSON.parse(localStorage.getItem("portfolioUser"));

    if (!savedUser) {
        showToast("Create an account first.");
        return;
    }

    showToast(`Password reset would be sent to ${savedUser.email}.`);
});

document.getElementById("subscribeForm").addEventListener("submit", event => {
    event.preventDefault();

    const emailInput = document.getElementById("subscribeEmail");
    const email = emailInput.value.trim().toLowerCase();

    if (!validEmail(email)) {
        showToast("Please enter a valid email.");
        return;
    }

    const subscribers = JSON.parse(localStorage.getItem("portfolioSubscribers") || "[]");

    if (!subscribers.includes(email)) {
        subscribers.push(email);
        localStorage.setItem("portfolioSubscribers", JSON.stringify(subscribers));
    }

    emailInput.value = "";
    showToast("You are subscribed!");
});

document.querySelectorAll('a[href="#"]').forEach(link => {
    link.addEventListener("click", event => event.preventDefault());
});
