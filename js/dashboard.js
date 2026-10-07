import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
    collection,
    getDocs,
    orderBy,
    query
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const nameElement = document.getElementById("profileName");
const emailElement = document.getElementById("profileEmail");
const uidElement = document.getElementById("profileUid");
const createdElement = document.getElementById("profileCreatedAt");
const welcomeElement = document.getElementById("dashboardUserName");
const totalElement = document.getElementById("totalMessages");
const messagesList = document.getElementById("messagesList");
const messagesStatus = document.getElementById("messagesStatus");
const refreshButton = document.getElementById("refreshMessages");

function formatAccountDate(user) {
    const date = user.metadata?.creationTime ? new Date(user.metadata.creationTime) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : "Not available";
}

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function renderMessages(documents) {
    messagesList.innerHTML = "";
    totalElement.textContent = documents.length;

    if (!documents.length) {
        messagesStatus.textContent = "No messages yet.";
        messagesStatus.style.display = "block";
        return;
    }

    messagesStatus.style.display = "none";
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

async function loadMessages() {
    messagesStatus.textContent = "Loading messages...";
    messagesStatus.style.display = "block";
    messagesStatus.classList.remove("error");

    try {
        const messagesQuery = query(collection(db, "messages"), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(messagesQuery);
        renderMessages(snapshot.docs);
    } catch (error) {
        console.error(error);
        totalElement.textContent = "—";
        messagesStatus.textContent = "Messages are restricted to the dashboard owner. Check your Firestore Security Rules and owner UID configuration.";
        messagesStatus.classList.add("error");
    }
}

onAuthStateChanged(auth, user => {
    if (!user) return;

    const displayName = user.displayName || user.email?.split("@")[0] || "User";
    welcomeElement.textContent = displayName;
    nameElement.textContent = user.displayName || "Not provided";
    emailElement.textContent = user.email || "Not available";
    uidElement.textContent = user.uid;
    createdElement.textContent = formatAccountDate(user);

    loadMessages();
});

if (refreshButton) {
    refreshButton.addEventListener("click", loadMessages);
}
