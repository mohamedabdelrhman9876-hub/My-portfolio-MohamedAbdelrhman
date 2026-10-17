import { auth, db, isFirebaseConfigured, getOwnerUid } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    collection,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const escapeHTML = (value) => {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

document.addEventListener("DOMContentLoaded", () => {
    const dashboardPanels = Array.from(document.querySelectorAll(".dashboard-panel"));
    const sidebarLinks = Array.from(document.querySelectorAll(".sidebar-link"));
    const dashboardSidebar = document.querySelector(".dashboard-sidebar");
    const dashboardSidebarToggle = document.getElementById("dashboardSidebarToggle");
    const messagesList = document.getElementById("messagesList");
    const messagesStatus = document.getElementById("messagesStatus");
    const totalMessagesEl = document.getElementById("totalMessages");
    const refreshBtn = document.getElementById("refreshMessages");
    const dashboardBlogGrid = document.getElementById("dashboardBlogGrid");
    const postsList = document.getElementById("postsList");
    const postForm = document.getElementById("postForm");
    const postIdInput = document.getElementById("postId");
    const postTitleInput = document.getElementById("postTitle");
    const postExcerptInput = document.getElementById("postExcerpt");
    const postContentInput = document.getElementById("postContent");
    const cancelEditPostBtn = document.getElementById("cancelEditPost");
    const postFormError = document.getElementById("postFormError");
    const subscribeForm = document.getElementById("subscribeForm");
    const subscribeEmailInput = document.getElementById("subscribeEmail");
    const subscribeError = document.getElementById("subscribeEmailError");

    let currentPosts = [];

    const setPostError = (message = "") => {
        if (postFormError) postFormError.textContent = message;
    };

    const setSubscribeError = (message = "") => {
        if (subscribeError) subscribeError.textContent = message;
    };

    const clearPostForm = () => {
        if (postForm) postForm.reset();
        if (postIdInput) postIdInput.value = "";
        if (cancelEditPostBtn) cancelEditPostBtn.style.display = "none";
        setPostError("");
    };

    const showPanel = (panelId) => {
        const targetId = panelId || "blog";

        dashboardPanels.forEach((panel) => {
            panel.classList.toggle("visible", panel.id === targetId);
        });

        sidebarLinks.forEach((link) => {
            const href = link.getAttribute("href") || "";
            const matches = href === `#${targetId}`;
            link.classList.toggle("active", matches);
        });

        if (dashboardSidebar && window.innerWidth <= 1000) {
            dashboardSidebar.classList.remove("sidebar-open");
            if (dashboardSidebarToggle) {
                dashboardSidebarToggle.setAttribute("aria-expanded", "false");
            }
        }
    };

    if (dashboardSidebarToggle && dashboardSidebar) {
        dashboardSidebarToggle.addEventListener("click", () => {
            const isOpen = dashboardSidebar.classList.toggle("sidebar-open");
            dashboardSidebarToggle.setAttribute("aria-expanded", String(isOpen));
        });
    }

    sidebarLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            const href = link.getAttribute("href");
            if (!href || !href.startsWith("#")) return;

            event.preventDefault();
            const panelId = href.slice(1);
            showPanel(panelId);
            window.history.replaceState(null, "", href);
        });
    });

    const initialPanelId = window.location.hash ? window.location.hash.slice(1) : "blog";
    showPanel(document.getElementById(initialPanelId) ? initialPanelId : "blog");

    const showStatus = (message) => {
        if (messagesStatus) {
            messagesStatus.textContent = message;
        }
    };

    const showToastNotification = (text, isError = false) => {
        let toast = document.getElementById("toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "toast";
            document.body.appendChild(toast);
        }

        toast.textContent = text;
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
    };

    const canManageBlog = (user) => {
        const ownerUid = getOwnerUid();
        return !ownerUid || ownerUid === "YOUR_OWNER_UID" || ownerUid === "DEMO_OWNER_UID" || user.uid === ownerUid;
    };

    const renderPostCards = () => {
        if (dashboardBlogGrid && dashboardBlogGrid.dataset.staticBlog === "true") {
            return;
        }

        if (dashboardBlogGrid) {
            if (!currentPosts.length) {
                dashboardBlogGrid.innerHTML = '<article class="blog-card"><div><h3>No posts published yet.</h3><p>Check back soon for new articles.</p></div></article>';
                return;
            }

            dashboardBlogGrid.innerHTML = currentPosts.map((post) => `
                <article class="blog-card">
                    <img src="${escapeHTML(post.imageUrl || "assets/js.jpg")}" alt="${escapeHTML(post.title || "Blog article")}">
                    <div>
                        <h3>${escapeHTML(post.title || "Untitled article")}</h3>
                        <p>${escapeHTML((post.excerpt || post.content || "").slice(0, 120))}${(post.excerpt || post.content || "").length > 120 ? "..." : ""}</p>
                        <div class="card-actions">
                            <button class="mini-btn edit-post-btn" data-id="${post.id}" type="button">Edit</button>
                            <button class="mini-btn dark delete-post-btn" data-id="${post.id}" type="button">Delete</button>
                        </div>
                    </div>
                </article>
            `).join("");
        }

        if (postsList) {
            if (!currentPosts.length) {
                postsList.innerHTML = '<div class="post-row"><strong>No additional posts.</strong><span>Publish a new article to begin.</span></div>';
                return;
            }

            postsList.innerHTML = currentPosts.map((post) => `
                <div class="post-row">
                    <strong>${escapeHTML(post.title || "Untitled article")}</strong>
                    <p>${escapeHTML((post.excerpt || post.content || "").slice(0, 180))}${(post.excerpt || post.content || "").length > 180 ? "..." : ""}</p>
                    <div class="card-actions" style="margin-top: 10px;">
                        <button class="mini-btn edit-post-btn" data-id="${post.id}" type="button">Edit</button>
                        <button class="mini-btn dark delete-post-btn" data-id="${post.id}" type="button">Delete</button>
                    </div>
                </div>
            `).join("");
        }

        document.querySelectorAll(".edit-post-btn").forEach((button) => {
            button.addEventListener("click", () => {
                const postId = button.getAttribute("data-id");
                const target = currentPosts.find((item) => item.id === postId);
                if (!target) return;

                if (postIdInput) postIdInput.value = target.id;
                if (postTitleInput) postTitleInput.value = target.title || "";
                if (postExcerptInput) postExcerptInput.value = target.excerpt || "";
                if (postContentInput) postContentInput.value = target.content || "";
                if (cancelEditPostBtn) cancelEditPostBtn.style.display = "inline-flex";
                setPostError("");
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
        });

        document.querySelectorAll(".delete-post-btn").forEach((button) => {
            button.addEventListener("click", async () => {
                const postId = button.getAttribute("data-id");
                const target = currentPosts.find((item) => item.id === postId);
                if (!target) return;

                try {
                    await deleteDoc(doc(db, "posts", postId));
                    showToastNotification("Post deleted successfully.");
                } catch (error) {
                    console.error("Delete post failed:", error);
                    showToastNotification("Unable to delete this post.", true);
                }
            });
        });
    };

    const loadPosts = () => {
        if (dashboardBlogGrid && dashboardBlogGrid.dataset.staticBlog === "true") {
            return;
        }

        if (!db || !collection) return;

        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        onSnapshot(q, (snapshot) => {
            currentPosts = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
            renderPostCards();
        }, (error) => {
            console.error("Error fetching posts:", error);
            if (dashboardBlogGrid) dashboardBlogGrid.innerHTML = '<article class="blog-card"><div><h3>Unable to load posts.</h3><p>Please refresh and try again.</p></div></article>';
        });
    };

    if (subscribeForm) {
        subscribeForm.addEventListener("submit", (event) => {
            event.preventDefault();
            setSubscribeError("");

            const email = subscribeEmailInput?.value.trim();
            if (!email) {
                setSubscribeError("Please enter your email address.");
                return;
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                setSubscribeError("Please enter a valid email address.");
                return;
            }

            showToastNotification("Thanks! You are subscribed successfully.");
            subscribeForm.reset();
        });
    }

    if (postForm) {
        postForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const title = postTitleInput?.value.trim();
            const excerpt = postExcerptInput?.value.trim();
            const content = postContentInput?.value.trim();
            setPostError("");

            if (!title) {
                setPostError("Please add a blog title.");
                return;
            }

            if (!excerpt) {
                setPostError("Please add a short excerpt.");
                return;
            }

            if (!content) {
                setPostError("Please add article content.");
                return;
            }

            const payload = {
                title,
                imageUrl: "",
                excerpt,
                content,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                ownerUid: auth.currentUser?.uid || getOwnerUid()
            };

            try {
                if (postIdInput && postIdInput.value) {
                    await updateDoc(doc(db, "posts", postIdInput.value), {
                        title,
                        imageUrl: "",
                        excerpt,
                        content,
                        updatedAt: serverTimestamp()
                    });
                    showToastNotification("Post updated successfully.");
                } else {
                    await addDoc(collection(db, "posts"), payload);
                    showToastNotification("Post published successfully.");
                }

                clearPostForm();
            } catch (error) {
                console.error("Post save failed:", error);
                setPostError(error.message || "Unable to save this post. Please try again.");
            }
        });
    }

    if (cancelEditPostBtn) {
        cancelEditPostBtn.addEventListener("click", clearPostForm);
    }

    onAuthStateChanged(auth, (user) => {
        const dashboardUserName = document.getElementById("dashboardUserName");
        const profileName = document.getElementById("profileName");
        const profileEmail = document.getElementById("profileEmail");
        const profileUid = document.getElementById("profileUid");
        const profileCreatedAt = document.getElementById("profileCreatedAt");
        const ownerUid = getOwnerUid();

        if (!user) {
            if (dashboardUserName) dashboardUserName.textContent = "Guest";
            if (profileName) profileName.textContent = "N/A";
            if (profileEmail) profileEmail.textContent = "N/A";
            if (profileUid) profileUid.textContent = "N/A";
            if (profileCreatedAt) profileCreatedAt.textContent = "N/A";
            showStatus("Please log in to access the dashboard.");
            if (messagesList) messagesList.innerHTML = '<div style="padding: 20px; border: 1px dashed #ddd; border-radius: 8px; color: #666;">Please log in to load messages.</div>';
            if (totalMessagesEl) totalMessagesEl.textContent = "0";
            return;
        }

        if (dashboardUserName) dashboardUserName.textContent = user.displayName || user.email?.split("@")[0] || "User";
        if (profileName) profileName.textContent = user.displayName || "N/A";
        if (profileEmail) profileEmail.textContent = user.email || "N/A";
        if (profileUid) profileUid.textContent = user.uid || "N/A";
        if (profileCreatedAt) profileCreatedAt.textContent = user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "N/A";

        if (!isFirebaseConfigured()) {
            showStatus("Firebase setup is incomplete. Update js/firebase.js before opening the dashboard.");
            return;
        }

        if (window.location.protocol === "file:") {
            showStatus("Open the site through a local web server to use Firebase properly.");
            return;
        }

        const canAccessMessages = !ownerUid || ownerUid === "YOUR_OWNER_UID" || ownerUid === "DEMO_OWNER_UID" || user.uid === ownerUid;

        if (!canAccessMessages) {
            showStatus("Access restricted: only the authorized portfolio owner can read messages.");
            if (messagesList) messagesList.innerHTML = '<div style="padding: 20px; border: 1px dashed #ddd; border-radius: 8px; color: #666;">Access restricted to the owner account.</div>';
            if (totalMessagesEl) totalMessagesEl.textContent = "0";
            return;
        }

        if (canManageBlog(user)) {
            loadPosts();
        } else {
            if (dashboardBlogGrid) dashboardBlogGrid.innerHTML = '<article class="blog-card"><div><h3>Posts locked.</h3><p>Only the authorized portfolio owner can edit blog posts.</p></div></article>';
            if (postsList) postsList.innerHTML = '<div class="post-row"><strong>Access restricted.</strong><span>Only the owner account can manage posts.</span></div>';
        }

        loadMessages();
    });

    function loadMessages() {
        if (!messagesList || !db) {
            showStatus("Message storage is not available yet.");
            return;
        }

        showStatus("Loading messages...");

        const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));

        onSnapshot(q, (snapshot) => {
            if (!messagesList) return;

            messagesList.innerHTML = "";
            let total = 0;
            let unreadCount = 0;

            if (snapshot.empty) {
                showStatus("No messages found.");
                if (totalMessagesEl) totalMessagesEl.textContent = "0";
                return;
            }

            showStatus("");

            snapshot.forEach((docSnap) => {
                total++;
                const data = docSnap.data();
                const msgId = docSnap.id;
                const isRead = data.read === true;
                if (!isRead) unreadCount++;

                const dateStr = data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : "Just now";

                const card = document.createElement("div");
                card.className = `message-card ${isRead ? "read" : "unread"}`;
                card.style.cssText = "background: #fff; border: 1px solid #ddd; padding: 16px; margin-bottom: 12px; border-radius: 8px; position: relative;";

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong>${escapeHTML(data.name || "Unknown")} (${escapeHTML(data.email || "N/A")})</strong>
                        <span style="font-size: 12px; color: #666;">${dateStr}</span>
                    </div>
                    <p style="margin: 4px 0; font-weight: 600;">Subject: ${escapeHTML(data.subject || "No subject")}</p>
                    <p style="margin: 8px 0; color: #333; white-space: pre-wrap;">${escapeHTML(data.message || "")}</p>
                    <div style="display: flex; gap: 10px; margin-top: 12px; align-items: center;">
                        <button class="mini-btn toggle-read-btn" data-id="${msgId}" data-read="${String(isRead)}">
                            ${isRead ? "Mark as Unread" : "Mark as Read"}
                        </button>
                        <button class="mini-btn delete-msg-btn" data-id="${msgId}" style="background: #dc3545; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                        <span style="font-size: 12px; margin-left: auto; font-weight: bold; color: ${isRead ? "green" : "orange"};">
                            ${isRead ? "Read" : "Unread"}
                        </span>
                    </div>
                `;

                messagesList.appendChild(card);
            });

            if (totalMessagesEl) totalMessagesEl.textContent = `${total} (${unreadCount} unread)`;
            attachMessageEvents();
        }, (error) => {
            console.error("Error fetching messages: ", error);
            showStatus("Error loading messages. Check Firestore Rules.");
        });
    }

    function attachMessageEvents() {
        document.querySelectorAll(".toggle-read-btn").forEach((btn) => {
            btn.addEventListener("click", async (event) => {
                const msgId = event.currentTarget.getAttribute("data-id");
                const currentRead = event.currentTarget.getAttribute("data-read") === "true";
                try {
                    await updateDoc(doc(db, "messages", msgId), {
                        read: !currentRead
                    });
                } catch (err) {
                    console.error("Error updating message status:", err);
                    alert("Failed to update message status.");
                }
            });
        });

        document.querySelectorAll(".delete-msg-btn").forEach((btn) => {
            btn.addEventListener("click", (event) => {
                const msgId = event.currentTarget.getAttribute("data-id");
                showDeleteConfirmModal(msgId);
            });
        });
    }

    function showDeleteConfirmModal(msgId) {
        const modalOverlay = document.createElement("div");
        modalOverlay.style.cssText = "position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000;";

        modalOverlay.innerHTML = `
            <div style="background: #fff; padding: 24px; border-radius: 8px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
                <p style="font-size: 16px; font-weight: 600; margin-bottom: 20px; color: #333;">Are you sure you want to delete this message?</p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button id="cancelDeleteBtn" style="padding: 8px 16px; border: 1px solid #ccc; background: #f8f9fa; border-radius: 4px; cursor: pointer;">Cancel</button>
                    <button id="confirmDeleteBtn" style="padding: 8px 16px; background: #dc3545; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Confirm Delete</button>
                </div>
            </div>
        `;

        document.body.appendChild(modalOverlay);

        const cancelButton = document.getElementById("cancelDeleteBtn");
        const confirmButton = document.getElementById("confirmDeleteBtn");

        if (cancelButton) {
            cancelButton.onclick = () => modalOverlay.remove();
        }

        if (confirmButton) {
            confirmButton.onclick = async () => {
                modalOverlay.remove();
                try {
                    await deleteDoc(doc(db, "messages", msgId));
                    showToastNotification("Message deleted successfully.");
                } catch (err) {
                    console.error("Error deleting message:", err);
                    alert("Unable to delete this message.");
                }
            };
        }
    }

    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => loadMessages());
    }
});
