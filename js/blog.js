document.addEventListener("DOMContentLoaded", () => {
    const subscribeForm = document.getElementById("subscribeForm");
    if (!subscribeForm) return;

    const emailInput = document.getElementById("subscribeEmail");

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

    subscribeForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const email = emailInput?.value.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast("Please enter a valid email address.", true);
            return;
        }

        showToast("Thanks! You are subscribed successfully.", false);
        subscribeForm.reset();
    });
});
