import { auth, isFirebaseConfigured, getOwnerUid } from "./firebase.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup
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

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const setFieldError = (fieldId, message = "") => {
    const field = document.getElementById(fieldId);
    if (field) field.textContent = message;
};

const clearFormErrors = (fieldIds) => {
    fieldIds.forEach((fieldId) => setFieldError(fieldId, ""));
};

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const forgotPasswordLink = document.getElementById("forgotPassword");
    const googleLoginButton = document.getElementById("googleLoginBtn");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

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

    const signInWithGoogle = async () => {
        if (!ensureFirebaseReady()) return;

        try {
            const result = await signInWithPopup(auth, provider);
            const ownerUid = getOwnerUid();
            if (!ownerUid || ownerUid === "YOUR_OWNER_UID" || ownerUid === "DEMO_OWNER_UID") {
                localStorage.setItem("portfolioOwnerUid", result.user.uid);
            }
            showToast("Google sign in successful.");
            window.location.href = "dashboard.html";
        } catch (error) {
            if (error?.code === "auth/popup-closed-by-user") {
                showToast("Google sign in was cancelled.", true);
                return;
            }

            console.error("Google login failed:", error);
            showToast(error.message || "Unable to sign in with Google right now.", true);
        }
    };

    if (googleLoginButton) {
        googleLoginButton.addEventListener("click", signInWithGoogle);
    }

    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            if (!ensureFirebaseReady()) return;

            const emailInput = document.getElementById("loginEmail");
            const passwordInput = document.getElementById("loginPassword");
            clearFormErrors(["loginEmailError", "loginPasswordError"]);

            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (!email) {
                setFieldError("loginEmailError", "Please enter your email address.");
                return;
            }

            if (!validateEmail(email)) {
                setFieldError("loginEmailError", "Please enter a valid email address.");
                return;
            }

            if (!password) {
                setFieldError("loginPasswordError", "Please enter your password.");
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
            clearFormErrors(["signupNameError", "signupEmailError", "signupPasswordError", "signupConfirmError"]);

            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            const confirmPassword = confirmInput.value.trim();

            if (!name) {
                setFieldError("signupNameError", "Please enter your full name.");
                return;
            }

            if (!email) {
                setFieldError("signupEmailError", "Please enter your email address.");
                return;
            }

            if (!validateEmail(email)) {
                setFieldError("signupEmailError", "Please enter a valid email address.");
                return;
            }

            if (!password) {
                setFieldError("signupPasswordError", "Please enter a password.");
                return;
            }

            if (password.length < 6) {
                setFieldError("signupPasswordError", "Password must be at least 6 characters long.");
                return;
            }

            if (!confirmPassword) {
                setFieldError("signupConfirmError", "Please confirm your password.");
                return;
            }

            if (password !== confirmPassword) {
                setFieldError("signupConfirmError", "Passwords do not match.");
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

