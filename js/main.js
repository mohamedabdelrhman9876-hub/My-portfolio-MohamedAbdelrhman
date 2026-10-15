import { auth, isFirebaseConfigured } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
    const yearEl = document.getElementById("year");
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    const menuToggle = document.getElementById("menuToggle");
    const mainNav = document.getElementById("mainNav");

    if (menuToggle && mainNav) {
        menuToggle.addEventListener("click", () => {
            const isOpen = mainNav.classList.toggle("nav-open");
            menuToggle.setAttribute("aria-expanded", String(isOpen));
        });
    }

    const attachLogoutHandler = (element) => {
        if (!element) return;

        element.addEventListener("click", async (event) => {
            event.preventDefault();

            try {
                await signOut(auth);
                localStorage.removeItem("portfolioOwnerUid");
                window.location.href = "login.html";
            } catch (error) {
                console.error("Logout error:", error);
                const toast = document.getElementById("toast");
                if (toast) {
                    toast.textContent = "Failed to log out. Please try again.";
                    toast.classList.add("show");
                    setTimeout(() => toast.classList.remove("show"), 3000);
                }
            }
        });
    };

    document.querySelectorAll(".logout-nav, .logout-link").forEach(attachLogoutHandler);

    onAuthStateChanged(auth, (user) => {
        const loginLink = document.querySelector('[data-auth="login"]');
        const registerLink = document.querySelector('[data-auth="register"]');
        const dashboardLink = document.querySelector('[data-auth="dashboard"]');
        const userNav = document.getElementById("userNav");

        if (!user) {
            if (loginLink) loginLink.style.display = "inline-flex";
            if (registerLink) registerLink.style.display = "inline-flex";
            if (dashboardLink) dashboardLink.style.display = "inline-flex";
            if (userNav) {
                userNav.textContent = "Guest";
                userNav.style.display = "inline-flex";
            }

            const status = document.getElementById("messagesStatus");
            if (status && !isFirebaseConfigured()) {
                status.textContent = "Firebase is not configured yet.";
            }

            return;
        }

        const userName = user.displayName || user.email?.split("@")[0] || "User";

        if (loginLink) loginLink.style.display = "none";
        if (registerLink) registerLink.style.display = "none";
        if (dashboardLink) dashboardLink.style.display = "inline-flex";
        if (userNav) {
            userNav.textContent = userName;
            userNav.style.display = "inline-flex";
        }

        document.querySelectorAll(".logout-nav, .logout-link").forEach((link) => {
            link.style.display = "inline-flex";
        });
    });
});
