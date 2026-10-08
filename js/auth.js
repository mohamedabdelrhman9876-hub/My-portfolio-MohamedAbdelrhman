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
    serverTimestamp,
    collection,
    getDocs,
    query,
    orderBy
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

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatDate(value) {
    if (!value) return "Not available";
    if (typeof value.toDate === "function") return value.toDate().toLocaleString();
    if (value instanceof Date) return value.toLocaleString();
    return String(value);
}

function syncDashboardPanels() {
    const panels = document.querySelectorAll(".dashboard-panel");
    const links = document.querySelectorAll(".sidebar-link");
    if (!panels.length) return;

    const hash = window.location.hash || "#dashboard-home";

    panels.forEach(panel => {
        panel.classList.toggle("visible", `#${panel.id}` === hash);
    });

    links.forEach(link => {
        const href = link.getAttribute("href") || "";
        link.classList.toggle("active", href === hash);
    });
}

function renderMessages(documents) {
    const messagesList = document.getElementById("messagesList");
    const messagesStatus = document.getElementById("messagesStatus");
    const totalElement = document.getElementById("totalMessages");

    if (!messagesList) return;

    messagesList.innerHTML = "";
    if (totalElement) totalElement.textContent = String(documents.length);

    if (!documents.length) {
        if (messagesStatus) {
            messagesStatus.textContent = "No messages yet.";
            messagesStatus.style.display = "block";
        }
        return;
    }

    if (messagesStatus) messagesStatus.style.display = "none";

    documents.forEach(item => {
        const data = item.data();
        const card = document.createElement("article");
        card.className = "message-card";
        card.innerHTML = `
            <div class="message-top">
                <div class="message-sender">
                    <h3>${escapeHtml(data.name || "Unknown sender")}</h3>
                    <a href="mailto:${escapeHtml(data.email || "")}">${escapeHtml(data.email || "No email")}</a>
                </div>
                <div class="message-meta">
                    <div>${escapeHtml(data.date || "Date unavailable")}</div>
                    <div>${escapeHtml(data.time || "Time unavailable")}</div>
                </div>
            </div>
            <div class="message-subject">${escapeHtml(data.subject || "No subject")}</div>
            <div class="message-body">${escapeHtml(data.message || "")}</div>
        `;
        messagesList.appendChild(card);
    });
}

async function loadDashboardMessages() {
    const messagesStatus = document.getElementById("messagesStatus");
    if (!messagesStatus || currentPage !== "dashboard.html") return;

    messagesStatus.textContent = "Loading messages...";
    messagesStatus.style.display = "block";
    messagesStatus.classList.remove("error");

    try {
        const messagesQuery = query(collection(db, "messages"), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(messagesQuery);
        renderMessages(snapshot.docs);
    } catch (error) {
        console.error(error);
        const totalElement = document.getElementById("totalMessages");
        if (totalElement) totalElement.textContent = "—";
        if (messagesStatus) {
            messagesStatus.textContent = "Messages are restricted to the dashboard owner. Check your Firestore Security Rules and owner UID configuration.";
            messagesStatus.classList.add("error");
        }
    }
}

function renderUsers(documents) {
    const usersList = document.getElementById("usersList");
    if (!usersList) return;

    usersList.innerHTML = "";

    if (!documents.length) {
        usersList.innerHTML = '<div class="user-row"><strong>No registered users yet.</strong><span>New users will appear here after sign up.</span></div>';
        return;
    }

    documents.forEach(item => {
        const data = item.data();
        const row = document.createElement("div");
        row.className = "user-row";
        row.innerHTML = `
            <strong>${escapeHtml(data.fullName || data.name || "Unknown User")}</strong>
            <span>${escapeHtml(data.email || "No email")}</span>
            <span>${escapeHtml(formatDate(data.createdAt))}</span>
        `;
        usersList.appendChild(row);
    });
}

async function loadDashboardUsers() {
    if (currentPage !== "dashboard.html") return;

    const usersList = document.getElementById("usersList");
    if (!usersList) return;

    usersList.textContent = "Loading users...";

    try {
        const snapshot = await getDocs(collection(db, "users"));
        const docs = [...snapshot.docs].sort((a, b) => {
            const aDate = a.data().createdAt?.toDate?.() || 0;
            const bDate = b.data().createdAt?.toDate?.() || 0;
            return bDate - aDate;
        });
        renderUsers(docs);
    } catch (error) {
        console.error(error);
        usersList.innerHTML = '<div class="user-row"><strong>Users are not available yet.</strong><span>New users will appear here after registration.</span></div>';
    }
}

function renderPosts(documents) {
    const postsList = document.getElementById("postsList");
    if (!postsList) return;

    postsList.innerHTML = "";

    if (!documents.length) {
        postsList.innerHTML = '<div class="post-row"><strong>No posts available.</strong><span>Firestore posts will appear here automatically.</span></div>';
        return;
    }

    documents.forEach(item => {
        const data = item.data();
        const row = document.createElement("div");
        row.className = "post-row";
        row.innerHTML = `
            <strong>${escapeHtml(data.title || "Untitled post")}</strong>
            <span>${escapeHtml(data.category || "General")}</span>
            <p>${escapeHtml(data.content || data.description || "No description available.")}</p>
        `;
        postsList.appendChild(row);
    });
}

async function loadDashboardPosts() {
    if (currentPage !== "dashboard.html") return;

    const postsList = document.getElementById("postsList");
    if (!postsList) return;

    postsList.textContent = "Loading posts...";

    try {
        const snapshot = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc")));
        renderPosts(snapshot.docs);
    } catch (error) {
        console.error(error);
        postsList.innerHTML = '<div class="post-row"><strong>No posts available.</strong><span>Firestore posts will appear here automatically.</span></div>';
    }
}

onAuthStateChanged(auth, user => {
    const logoutLink = document.getElementById("logoutLink");
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

        if (isDashboard) {
            const displayName = user.displayName || user.email?.split("@")[0] || "User";
            const nameElement = document.getElementById("profileName");
            const emailElement = document.getElementById("profileEmail");
            const uidElement = document.getElementById("profileUid");
            const createdElement = document.getElementById("profileCreatedAt");
            const welcomeElement = document.getElementById("dashboardUserName");

            if (welcomeElement) welcomeElement.textContent = displayName;
            if (nameElement) nameElement.textContent = user.displayName || "Not provided";
            if (emailElement) emailElement.textContent = user.email || "Not available";
            if (uidElement) uidElement.textContent = user.uid;
            if (createdElement) createdElement.textContent = user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "Not available";

            loadDashboardMessages();
            loadDashboardUsers();
            loadDashboardPosts();
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

const logoutLinks = document.querySelectorAll("#logoutLink, .logout-link");
logoutLinks.forEach(link => {
    link.addEventListener("click", async event => {
        event.preventDefault();
        try {
            await signOut(auth);
            window.location.replace("login.html");
        } catch (error) {
            showToast(getFirebaseErrorMessage(error));
        }
    });
});

if (isDashboard) {
    syncDashboardPanels();
    window.addEventListener("hashchange", syncDashboardPanels);

    const refreshButton = document.getElementById("refreshMessages");
    if (refreshButton) {
        refreshButton.addEventListener("click", loadDashboardMessages);
    }
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
