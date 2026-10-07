const toast = document.getElementById("toast");
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
const navLinks = document.querySelectorAll(".nav-link");

export function showToast(message) {
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
