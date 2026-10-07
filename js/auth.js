import { auth, db } from "./firebase.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { showToast } from "./main.js";

const publicPages = ["", "index.html", "about.html", "portfolio.html", "contact.html", "blog.html", "login.html", "register.html"];
const currentPage = window.location.pathname.split("/").pop();
const isDashboard = currentPage === "dashboard.html";

function getFirebaseErrorMessage(error) {
    const messages = {
        "auth/email-already-in-use": "This email is already registered.",
        "auth/invalid-email": "Please enter a valid email.",
        "auth/weak-password": "Password must be at least 6 characters.",
        "auth/invalid-credential": "Email or password is incorrect.",
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Email or password is incorrect.",
        "auth/too-many-requests": "Too many attempts. Please try again later."
    };
    return messages[error.code] || "Something went wrong. Please try again.";
}

onAuthStateChanged(auth, user => {
    const logoutLink = document.getElementById("logoutLink");
    const loginLink = document.querySelector('[data-auth="login"]');
    const registerLink = document.querySelector('[data-auth="register"]');
    const dashboardLink = document.querySelector('[data-auth="dashboard"]');
    const userNav = document.getElementById("userNav");

    if (user) {
        if (logoutLink) logoutLink.style.display = "inline-block";
        if (dashboardLink) dashboardLink.style.display = "inline-block";
        if (userNav) {
            userNav.textContent = user.displayName || user.email || "";
            userNav.style.display = "inline-block";
        }

        if ((currentPage === "login.html" || currentPage === "register.html") && !isDashboard) {
            window.location.replace("dashboard.html");
        }
    } else {
        if (logoutLink) logoutLink.style.display = "none";
        if (dashboardLink) dashboardLink.style.display = "none";
        if (userNav) userNav.style.display = "none";

        if (isDashboard) {
            window.location.replace("login.html");
        }
    }
});

const logoutLink = document.getElementById("logoutLink");
if (logoutLink) {
    logoutLink.addEventListener("click", async event => {
        event.preventDefault();
        try {
            await signOut(auth);
            window.location.replace("login.html");
        } catch (error) {
            showToast(getFirebaseErrorMessage(error));
        }
    });
}

const signupForm = document.getElementById("signupForm");
if (signupForm) {
    signupForm.addEventListener("submit", async event => {
        event.preventDefault();

        const name = document.getElementById("signupName").value.trim();
        const email = document.getElementById("signupEmail").value.trim().toLowerCase();
        const password = document.getElementById("signupPassword").value;
        const confirm = document.getElementById("signupConfirm").value;

        if (name.length < 2) return showToast("Please enter your full name.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showToast("Please enter a valid email.");
        if (password.length < 6) return showToast("Password must be at least 6 characters.");
        if (password !== confirm) return showToast("Passwords do not match.");

        const button = signupForm.querySelector("button[type='submit']");
        if (button) button.disabled = true;

        try {
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(credential.user, { displayName: name });

            try {
                await setDoc(doc(db, "users", credential.user.uid), {
                    uid: credential.user.uid,
                    fullName: name,
                    email,
                    createdAt: serverTimestamp()
                });
            } catch (profileError) {
                console.warn("User profile could not be saved:", profileError);
            }

            signupForm.reset();
            showToast("Account created successfully!");
            setTimeout(() => window.location.replace("dashboard.html"), 400);
        } catch (error) {
            showToast(getFirebaseErrorMessage(error));
        } finally {
            if (button) button.disabled = false;
        }
    });
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async event => {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim().toLowerCase();
        const password = document.getElementById("loginPassword").value;

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showToast("Please enter a valid email.");
        if (!password) return showToast("Please enter your password.");

        const button = loginForm.querySelector("button[type='submit']");
        if (button) button.disabled = true;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            loginForm.reset();
            showToast("Login successful!");
            setTimeout(() => window.location.replace("dashboard.html"), 300);
        } catch (error) {
            showToast(getFirebaseErrorMessage(error));
        } finally {
            if (button) button.disabled = false;
        }
    });
}

const forgotPassword = document.getElementById("forgotPassword");
if (forgotPassword) {
    forgotPassword.addEventListener("click", async event => {
        event.preventDefault();
        const emailInput = document.getElementById("loginEmail");
        const email = emailInput ? emailInput.value.trim().toLowerCase() : "";

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast("Enter your email first.");
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            showToast("Password reset email sent.");
        } catch (error) {
            showToast(getFirebaseErrorMessage(error));
        }
    });
}
