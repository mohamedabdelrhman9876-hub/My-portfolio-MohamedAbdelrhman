import { auth, isFirebaseConfigured, getOwnerUid } from "./firebase.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

function showToast(message, isError = false) {
    let toast = document.getElementById("toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        toast.className = "toast";
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.background = isError ? "#dc3545" : "#28a745";
    toast.style.color = "#fff";
    toast.style.padding = "12px 20px";
    toast.style.borderRadius = "6px";
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.zIndex = "1000";
    toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 4000);
}

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const forgotPasswordLink = document.getElementById("forgotPassword");

    const ensureFirebaseReady = () => {
        if (window.location.protocol === "file:") {
            showToast("Please open the site using a local web server (for example: Live Server or python -m http.server).", true);
            return false;
        }

        if (!isFirebaseConfigured()) {
            showToast("Firebase is not configured yet. Update js/firebase.js with your project settings.", true);
            return false;
        }

        return true;
    };

    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            if (!ensureFirebaseReady()) return;

            const emailInput = document.getElementById("loginEmail");
            const passwordInput = document.getElementById("loginPassword");

            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (!email || !password) {
                showToast("Please enter both email and password.", true);
                return;
            }

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const ownerUid = getOwnerUid();
                if (ownerUid === "YOUR_OWNER_UID" || ownerUid === "DEMO_OWNER_UID") {
                    localStorage.setItem("portfolioOwnerUid", userCredential.user.uid);
                }
                window.location.href = "dashboard.html";
            } catch (error) {
                console.error("Firebase login failed:", error);
                showToast(error.message || "Login failed. Please check your email and password.", true);
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            if (!ensureFirebaseReady()) return;

            const nameInput = document.getElementById("signupName");
            const emailInput = document.getElementById("signupEmail");
            const passwordInput = document.getElementById("signupPassword");
            const confirmInput = document.getElementById("signupConfirm");

            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            const confirmPassword = confirmInput.value.trim();

            if (!name || !email || !password || !confirmPassword) {
                showToast("Please complete all fields.", true);
                return;
            }

            if (password.length < 6) {
                showToast("Password must be at least 6 characters long.", true);
                return;
            }

            if (password !== confirmPassword) {
                showToast("Passwords do not match.", true);
                return;
            }

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, { displayName: name });
                localStorage.setItem("portfolioOwnerUid", userCredential.user.uid);
                window.location.href = "dashboard.html";
            } catch (error) {
                console.error("Firebase signup failed:", error);
                showToast(error.message || "Signup failed. Please try again.", true);
            }
        });
    }

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener("click", async (event) => {
            event.preventDefault();

            if (!ensureFirebaseReady()) return;

            const email = document.getElementById("loginEmail")?.value.trim();
            if (!email) {
                showToast("Enter your email first to reset the password.", true);
                return;
            }

            try {
                await sendPasswordResetEmail(auth, email);
                showToast("Password reset email sent successfully.");
            } catch (error) {
                console.error("Password reset error:", error);
                showToast(error.message || "Failed to send reset email.", true);
            }
        });
    }
});
