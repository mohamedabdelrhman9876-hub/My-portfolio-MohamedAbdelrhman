import { db, isFirebaseConfigured } from "./firebase.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    const contactForm = document.getElementById("contactForm");
    if (!contactForm) return;

    const nameInput = document.getElementById("contactName");
    const emailInput = document.getElementById("contactEmail");
    const subjectInput = document.getElementById("contactSubject");
    const messageInput = document.getElementById("contactMessage");

    const nameError = document.getElementById("contactNameError");
    const emailError = document.getElementById("contactEmailError");
    const subjectError = document.getElementById("contactSubjectError");
    const messageError = document.getElementById("contactMessageError");

    const submitBtn = contactForm.querySelector("button[type='submit']");

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

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    contactForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (window.location.protocol === "file:") {
            showToast("Open this site with a local web server before sending messages.", true);
            return;
        }

        if (!isFirebaseConfigured()) {
            showToast("Firebase is not configured yet. Update js/firebase.js before sending messages.", true);
            return;
        }

        if (nameError) nameError.textContent = "";
        if (emailError) emailError.textContent = "";
        if (subjectError) subjectError.textContent = "";
        if (messageError) messageError.textContent = "";

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const subject = subjectInput.value.trim();
        const message = messageInput.value.trim();

        let isValid = true;

        if (!name) {
            if (nameError) nameError.textContent = "Please enter your name.";
            isValid = false;
        }
        if (!email || !validateEmail(email)) {
            if (emailError) emailError.textContent = "Please enter a valid email address.";
            isValid = false;
        }
        if (!subject) {
            if (subjectError) subjectError.textContent = "Please enter a subject.";
            isValid = false;
        }
        if (!message) {
            if (messageError) messageError.textContent = "Please enter your message.";
            isValid = false;
        }

        if (!isValid) return;

        submitBtn.disabled = true;
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        try {
            const messageData = {
                name,
                email,
                subject,
                message,
                read: false,
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, "messages"), messageData);
            showToast("Message sent successfully!", false);
            contactForm.reset();
        } catch (error) {
            console.error("Firestore send failed:", error);
            showToast("Unable to send right now. Please try again later.", true);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
});