import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, orderBy, onSnapshot, limit, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAuiHmPgfj5GHE3BIWeRgbeJWdU4nidhMs",
  authDomain: "unit-of-one-social-network.firebaseapp.com",
  projectId: "unit-of-one-social-network",
  storageBucket: "unit-of-one-social-network.firebasestorage.app",
  messagingSenderId: "26265021963",
  appId: "1:26265021963:web:f1c9b9c6d5c27d4dd8210e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const profileAvatar = document.getElementById("profileAvatar");
const profileDisplayName = document.getElementById("profileDisplayName");
const profileBio = document.getElementById("profileBio");
const mediaEmbedContainer = document.getElementById("mediaEmbedContainer");
const feedContainer = document.getElementById("userSpecificFeed");
const loadMoreProfileBtn = document.getElementById("loadMoreProfileBtn");

const urlParams = new URLSearchParams(window.location.search);
const targetUserId = urlParams.get('user');
let currentUser = null;

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
    } else {
        currentUser = user; // Capture current user for the comment payload
        if (!targetUserId) {
            window.location.href = "dashboard.html";
        } else {
            loadProfileData(targetUserId);
            loadUserFeed(targetUserId);
        }
    }
});

async function loadProfileData(userId) {
    try {
        const userDocRef = doc(db, "users", userId);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
            const data = userSnap.data();
            profileDisplayName.innerText = data.displayName || "Unknown Unit";
            profileBio.innerText = data.bio || "Demanded dignity - Non Negotiable.";
            if (data.photoURL) { profileAvatar.src = data.photoURL; }
            if (data.media_url) { renderMediaEmbed(data.media_url); }
        } else {
            profileDisplayName.innerText = "Unit Not Found";
            profileBio.innerText = "This profile does not exist or has been redacted.";
        }
    } catch (error) {
        profileBio.innerText = "Signal interrupted. Could not load identity matrix.";
    }
}

let profileFeedLimit = 10;
let profileFeedUnsubscribe = null;

function loadUserFeed(userId) {
    const statusesRef = collection(db, "users", userId, "statuses");
    
    function fetchProfileFeed() {
        if (profileFeedUnsubscribe) profileFeedUnsubscribe();
        const q = query(statusesRef, orderBy("timestamp", "desc"), limit(profileFeedLimit));

        profileFeedUnsubscribe = onSnapshot(q, (snapshot) => {
            feedContainer.innerHTML = ""; 
            if (snapshot.empty) {
                feedContainer.innerHTML = `<p style="color: var(--text-muted);">No broadcasts yet. The channel is clear.</p>`;
                if (loadMoreProfileBtn) loadMoreProfileBtn.style.display = "none";
                return;
            }

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const timeString = data.timestamp ? data.timestamp.toDate().toLocaleString() : "Just now";
                const avatarSrc = profileAvatar.src; // Preserving the specific avatar override
                const feedImgUrl = data.media_url || data.gif_url;
                const mediaHTML = feedImgUrl ? `<div style="margin-top: 15px;"><img src="${feedImgUrl}" style="max-width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid var(--strike-gold); object-fit: contain;"></div>` : '';
                
                const statusHTML = `
                    <div class="status-item" style="display: flex; gap: 15px; align-items: flex-start; padding: 20px; border-bottom: 1px solid var(--bronze-shadow);">
                        <img src="${avatarSrc}" alt="${data.author}" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid var(--strike-gold); object-fit: cover; flex-shrink: 0; background-color: var(--armor-dark);">
                        <div style="flex: 1; min-width: 0;">
                            <div style="margin-bottom: 8px;">
                                <strong style="color: var(--strike-gold); font-family: var(--font-mono); text-transform: uppercase;">
                                    ${data.author}
                                </strong>
                                <span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 10px;">
                                    ${timeString}
                                </span>
                            </div>
                            <p style="color: var(--text-clarity); font-size: 1.05rem; margin: 0; line-height: 1.5; word-wrap: break-word;">${data.text}</p>
                            ${mediaHTML}
                            
                            <div class="status-actions" style="margin-top: 15px; border-top: 1px solid rgba(200, 151, 54, 0.2); padding-top: 10px;">
                                <button class="u01-btn" data-action="toggle-comments" data-author="${data.author_id}" data-status="${docSnap.id}" style="padding: 5px 12px; font-size: 0.75rem; background: transparent; border: 1px solid var(--strike-gold); color: var(--strike-gold);">
                                    View / Send Intercept
                                </button>
                            </div>
                            
                            <div class="comments-section" id="comments-${docSnap.id}" style="display: none; margin-top: 15px; background: rgba(0,0,0,0.4); padding: 15px; border-radius: 8px; border: 1px solid var(--bronze-shadow);">
                                <div id="comment-list-${docSnap.id}" style="margin-bottom: 15px; max-height: 250px; overflow-y: auto;">
                                    </div>
                                <div style="display: flex; gap: 10px;">
                                    <input type="text" id="comment-input-${docSnap.id}" class="u01-input" placeholder="Transmit reply..." style="flex: 1; padding: 8px; font-size: 0.85rem;">
                                    <button class="u01-btn solid-gold" data-action="post-comment" data-author="${data.author_id}" data-status="${docSnap.id}" style="padding: 8px 16px; font-size: 0.85rem;">Reply</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                feedContainer.innerHTML += statusHTML;
            });

            if (snapshot.docs.length === profileFeedLimit) {
                if (loadMoreProfileBtn) loadMoreProfileBtn.style.display = "block";
            } else {
                if (loadMoreProfileBtn) loadMoreProfileBtn.style.display = "none";
            }
        });
    }

    fetchProfileFeed();

    if (loadMoreProfileBtn && !loadMoreProfileBtn.dataset.listenerAttached) {
        loadMoreProfileBtn.addEventListener("click", () => {
            profileFeedLimit += 10;
            fetchProfileFeed();
        });
        loadMoreProfileBtn.dataset.listenerAttached = "true";
    }
}

// --- Comment Engine (Event Delegation) ---
window.activeCommentListeners = window.activeCommentListeners || {};

if (feedContainer && !feedContainer.dataset.commentsAttached) {
    feedContainer.addEventListener("click", async (e) => {
        const target = e.target;
        
        if (target.dataset.action === "toggle-comments") {
            const statusId = target.dataset.status;
            const authorId = target.dataset.author;
            const commentsDiv = document.getElementById(`comments-${statusId}`);
            
            if (commentsDiv.style.display === "none") {
                commentsDiv.style.display = "block";
                target.innerText = "Hide Intercepts";
                loadComments(authorId, statusId);
            } else {
                commentsDiv.style.display = "none";
                target.innerText = "View / Send Intercept";
            }
        }
        
        if (target.dataset.action === "post-comment") {
            const statusId = target.dataset.status;
            const authorId = target.dataset.author;
            const inputField = document.getElementById(`comment-input-${statusId}`);
            const text = inputField.value.trim();
            
            if (!text) return;
            target.innerText = "...";
            target.disabled = true;
            
            try {
                const commentsRef = collection(db, "users", authorId, "statuses", statusId, "comments");
                await addDoc(commentsRef, {
                    text: text,
                    timestamp: serverTimestamp(),
                    author: currentUser.displayName,
                    author_id: currentUser.uid,
                    author_avatar: currentUser.photoURL || "default-avatar.jpg"
                });
                inputField.value = "";
            } catch (error) {
                console.error("Intercept failed:", error);
                alert("Signal interrupted. Could not post intercept.");
            } finally {
                target.innerText = "Reply";
                target.disabled = false;
            }
        }
    });
    feedContainer.dataset.commentsAttached = "true";
}

function loadComments(statusAuthorId, statusId) {
    const listContainer = document.getElementById(`comment-list-${statusId}`);
    if (window.activeCommentListeners[statusId]) return; 
    
    const commentsRef = collection(db, "users", statusAuthorId, "statuses", statusId, "comments");
    const q = query(commentsRef, orderBy("timestamp", "asc"));
    
    window.activeCommentListeners[statusId] = onSnapshot(q, (snapshot) => {
        listContainer.innerHTML = "";
        if (snapshot.empty) {
            listContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.8rem; margin: 0;">No intercepts logged. Be the first to reply.</p>`;
            return;
        }
        
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const timeString = data.timestamp ? data.timestamp.toDate().toLocaleString() : "Just now";
            const avatarSrc = data.author_avatar || "default-avatar.jpg";
            const profileLink = data.author_id ? `profile.html?user=${data.author_id}` : "#";
            
            const commentHTML = `
                <div style="display: flex; gap: 10px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed rgba(200, 151, 54, 0.3);">
                    <a href="${profileLink}" style="flex-shrink: 0;">
                        <img src="${avatarSrc}" style="width: 35px; height: 35px; border-radius: 50%; border: 1px solid var(--strike-gold); object-fit: cover; background-color: var(--armor-dark);">
                    </a>
                    <div>
                        <a href="${profileLink}" style="text-decoration: none; color: var(--strike-gold); font-size: 0.85rem; font-family: var(--font-mono); text-transform: uppercase;">
                            ${data.author}
                        </a>
                        <span style="color: var(--text-muted); font-size: 0.7rem; margin-left: 8px;">${timeString}</span>
                        <p style="color: var(--text-clarity); font-size: 0.95rem; margin: 4px 0 0 0; line-height: 1.4;">${data.text}</p>
                    </div>
                </div>
            `;
            listContainer.innerHTML += commentHTML;
        });
        listContainer.scrollTop = listContainer.scrollHeight; 
    });
}
function renderMediaEmbed(url) {
    let embedUrl = "";
    let playerHeight = "450"; 
    if (url.includes("spotify.com")) {
        const urlParts = url.split("spotify.com/");
        embedUrl = `https://open.spotify.com/embed/${urlParts[1]}`;
        playerHeight = "352"; 
    } else if (url.includes("music.apple.com")) {
        embedUrl = url.replace("music.apple.com", "embed.music.apple.com");
        playerHeight = "450"; 
    } else {
        embedUrl = url;
    }
    if (embedUrl) {
        mediaEmbedContainer.innerHTML = `<iframe src="${embedUrl}" width="100%" height="${playerHeight}" frameborder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" style="border-radius: 12px; border: 1px solid var(--bronze-shadow); background: transparent; overflow: hidden;"></iframe>`;
    }
}