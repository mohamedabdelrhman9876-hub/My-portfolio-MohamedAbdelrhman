import { db } from "./firebase.js";
import { addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { showToast } from "./main.js";

const contactForm = document.getElementById("contactForm");
if (contactForm) {
    contactForm.addEventListener("submit", async event => {
        event.preventDefault();

        const name = document.getElementById("contactName").value.trim();
        const email = document.getElementById("contactEmail").value.trim().toLowerCase();
        const subject = document.getElementById("contactSubject").value.trim();
        const message = document.getElementById("contactMessage").value.trim();

        document.getElementById("contactNameError").textContent = "";
        document.getElementById("contactEmailError").textContent = "";
        document.getElementById("contactSubjectError").textContent = "";
        document.getElementById("contactMessageError").textContent = "";

        let valid = true;
        if (name.length < 2) {
            document.getElementById("contactNameError").textContent = "Please enter your name.";
            valid = false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            document.getElementById("contactEmailError").textContent = "Please enter a valid email.";
            valid = false;
        }
        if (subject.length < 2) {
            document.getElementById("contactSubjectError").textContent = "Please enter a subject.";
            valid = false;
        }
        if (message.length < 10) {
            document.getElementById("contactMessageError").textContent = "Message must be at least 10 characters.";
            valid = false;
        }
        if (!valid) {
            showToast("Please fix the form errors.");
            return;
        }

        const button = contactForm.querySelector("button[type='submit']");
        if (button) button.disabled = true;

        const now = new Date();
        try {
            await addDoc(collection(db, "messages"), {
                name,
                email,
                subject,
                message,
                date: now.toLocaleDateString(),
                time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                timestamp: serverTimestamp()
            });

            contactForm.reset();
            showToast("Message sent successfully!");
        } catch (error) {
            console.error(error);
            showToast("Unable to send the message. Please try again.");
        } finally {
            if (button) button.disabled = false;
        }
    });
}
