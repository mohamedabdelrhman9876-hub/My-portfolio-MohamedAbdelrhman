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
    setDoc
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const publicPages = ["index.html", "login.html", "register.html", ""];
const currentPage = window.location.pathname.split("/").pop();

function getToast() {
    return document.getElementById("toast");
}

function showAuthToast(message) {
    const toast = getToast();
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showAuthToast.timer);
    showAuthToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function getPageName() {
    return currentPage || "index.html";
}

function isPublicPage() {
    return publicPages.includes(getPageName());
}

function redirectToLogin() {
    if (!isPublicPage()) {
        window.location.replace("login.html");
    }
}

onAuthStateChanged(auth, user => {
    const logoutLink = document.getElementById("logoutLink");
    const loginLink = document.querySelector('.nav-link[data-auth="login"]');
    const registerLink = document.querySelector('.nav-link[data-auth="register"]');
    const userNav = document.getElementById("userNav");

    if (user) {
        if (loginLink) loginLink.style.display = "none";
        if (registerLink) registerLink.style.display = "none";
        if (logoutLink) logoutLink.style.display = "inline-block";

        if (userNav) {
            userNav.textContent = user.displayName || user.email || "";
            userNav.style.display = "inline-block";
        }

        if (getPageName() === "login.html" || getPageName() === "register.html") {
            window.location.replace("dashboard.html");
        }
    } else {
        if (logoutLink) logoutLink.style.display = "none";
        if (userNav) userNav.style.display = "none";

        if (loginLink) loginLink.style.display = "inline-block";
        if (registerLink) registerLink.style.display = "inline-block";

        redirectToLogin();
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
            showAuthToast(error.message);
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

        if (name.length < 2) {
            showAuthToast("Please enter your full name.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showAuthToast("Please enter a valid email.");
            return;
        }

        if (password.length < 6) {
            showAuthToast("Password must be at least 6 characters.");
            return;
        }

        if (password !== confirm) {
            showAuthToast("Passwords do not match.");
            return;
        }

        const button = signupForm.querySelector("button[type='submit']");
        if (button) button.disabled = true;

        try {
            const credential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            await updateProfile(credential.user, {
                displayName: name
            });

            await setDoc(doc(db, "users", credential.user.uid), {
                uid: credential.user.uid,
                fullName: name,
                email,
                createdAt: new Date().toISOString()
            });

            signupForm.reset();
            showAuthToast("Account created successfully!");

            setTimeout(() => {
                window.location.replace("dashboard.html");
            }, 700);
        } catch (error) {
            showAuthToast(getFirebaseErrorMessage(error));
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

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showAuthToast("Please enter a valid email.");
            return;
        }

        if (!password) {
            showAuthToast("Please enter your password.");
            return;
        }

        const button = loginForm.querySelector("button[type='submit']");
        if (button) button.disabled = true;

        try {
            await signInWithEmailAndPassword(auth, email, password);

            loginForm.reset();
            showAuthToast("Login successful!");

            setTimeout(() => {
                window.location.replace("dashboard.html");
            }, 500);
        } catch (error) {
            showAuthToast(getFirebaseErrorMessage(error));
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
            showAuthToast("Enter your email first.");
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            showAuthToast("Password reset email sent.");
        } catch (error) {
            showAuthToast(getFirebaseErrorMessage(error));
        }
    });
}

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
