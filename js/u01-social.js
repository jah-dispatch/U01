import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, collection, collectionGroup, addDoc, serverTimestamp, query, orderBy, onSnapshot, limit, deleteDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

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
const storage = getStorage(app); 

// INSERT YOUR FIREBASE UID HERE FOR GOD MODE
const ADMIN_UID = "feW9u6LczHTdzkEb0LIB2Ufol2t2"; 

console.log("U01 Network: Redaction and Reaction Engines Armed.");

// --- DOM Elements ---
const userDisplayName = document.getElementById("userDisplayName");
const userAvatar = document.getElementById("userAvatar");
const userBio = document.getElementById("userBio");
const statusInput = document.getElementById("newStatusInput");
const postStatusBtn = document.getElementById("postStatusBtn");

const editIdentityBtn = document.getElementById("editIdentityBtn");
const editProfileMatrix = document.getElementById("editProfileMatrix");
const editBioInput = document.getElementById("editBioInput");
const editMediaInput = document.getElementById("editMediaInput");
const editAvatarInput = document.getElementById("editAvatarInput");
const saveIdentityBtn = document.getElementById("saveIdentityBtn");
const mediaEmbedContainer = document.getElementById("mediaEmbedContainer");

const toggleGiphyBtn = document.getElementById("toggleGiphyBtn");
const statusImageInput = document.getElementById("statusImageInput");
const giphySearchContainer = document.getElementById("giphySearchContainer");
const giphySearchInput = document.getElementById("giphySearchInput");
const searchGiphyBtn = document.getElementById("searchGiphyBtn");
const giphyResults = document.getElementById("giphyResults");
const selectedMediaPreview = document.getElementById("selectedMediaPreview");
const previewMediaImg = document.getElementById("previewMediaImg");
const removeMediaBtn = document.getElementById("removeMediaBtn");
const feedContainer = document.getElementById("globalFeed");

let currentUser = null; 
let attachedGifUrl = null; 
let attachedImageFile = null;
const GIPHY_API_KEY = "hEKr4BBqEkYxwjzspv4LwQjtEI8jPdbt";

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        userDisplayName.innerText = user.displayName || "Independent Unit";
        if (user.photoURL) { userAvatar.src = user.photoURL; }

        attachFeedListener(user.uid); 
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
            const data = userSnap.data();
            userBio.innerText = data.bio || "Demanded dignity - Non Negotiable.";
            if (data.media_url) { renderMediaEmbed(data.media_url); }
        }
    } else {
        window.location.href = "login.html"; 
    }
});

// --- Identity Editor ---
if (editIdentityBtn) {
    editIdentityBtn.addEventListener("click", () => {
        editProfileMatrix.style.display = editProfileMatrix.style.display === "none" ? "block" : "none";
        editBioInput.value = userBio.innerText; 
    });
}

if (saveIdentityBtn) {
    saveIdentityBtn.addEventListener("click", async () => {
        const newBio = editBioInput.value.trim();
        const newMedia = editMediaInput.value.trim();
        const avatarFile = editAvatarInput.files[0];
        saveIdentityBtn.innerText = "Encrypting...";
        saveIdentityBtn.disabled = true;

        try {
            let finalAvatarUrl = currentUser.photoURL;
            if (avatarFile) {
                if (avatarFile.size > 4 * 1024 * 1024) {
                    alert("Image exceeds 4MB perimeter.");
                    saveIdentityBtn.innerText = "Lock In Changes";
                    saveIdentityBtn.disabled = false;
                    return;
                }
                const avatarRef = ref(storage, `users/${currentUser.uid}/avatar`);
                await uploadBytes(avatarRef, avatarFile);
                finalAvatarUrl = await getDownloadURL(avatarRef);
                await updateProfile(currentUser, { photoURL: finalAvatarUrl });
                userAvatar.src = finalAvatarUrl;
            }

            const userDocRef = doc(db, "users", currentUser.uid);
            await updateDoc(userDocRef, {
                bio: newBio,
                media_url: newMedia,
                photoURL: finalAvatarUrl 
            });

            userBio.innerText = newBio;
            if (newMedia) { renderMediaEmbed(newMedia); } else { mediaEmbedContainer.innerHTML = ""; }
            editProfileMatrix.style.display = "none";
        } catch (error) {
            alert("Signal interrupted. Could not update identity.");
        } finally {
            saveIdentityBtn.innerText = "Lock In Changes";
            saveIdentityBtn.disabled = false;
        }
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

if (toggleGiphyBtn) {
    toggleGiphyBtn.addEventListener("click", () => {
        giphySearchContainer.style.display = giphySearchContainer.style.display === "none" ? "flex" : "none";
        giphyResults.style.display = "none"; 
    });
}

if (searchGiphyBtn) {
    searchGiphyBtn.addEventListener("click", async () => {
        const query = giphySearchInput.value.trim();
        if (!query) return;
        searchGiphyBtn.innerText = "...";
        try {
            const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=15&rating=pg-13`);
            const json = await res.json();
            giphyResults.innerHTML = ""; 
            if (json.data && json.data.length > 0) {
                json.data.forEach(gif => {
                    const img = document.createElement("img");
                    img.src = gif.images.fixed_height_small.url; 
                    img.style.height = "100px";
                    img.style.cursor = "pointer";
                    img.style.borderRadius = "6px";
                    img.style.border = "1px solid var(--bronze-shadow)";
                    img.addEventListener("click", () => {
                        attachedGifUrl = gif.images.downsized_medium.url; 
                        attachedImageFile = null; 
                        previewMediaImg.src = attachedGifUrl;
                        selectedMediaPreview.style.display = "block";
                        giphyResults.style.display = "none";
                        giphySearchContainer.style.display = "none";
                        giphySearchInput.value = "";
                    });
                    giphyResults.appendChild(img);
                });
                giphyResults.style.display = "flex";
            }
        } catch (error) { console.error(error); } 
        finally { searchGiphyBtn.innerText = "Search"; }
    });
}

if (statusImageInput) {
    statusImageInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) {
                alert("File exceeds 4MB perimeter.");
                statusImageInput.value = "";
                return;
            }
            attachedImageFile = file;
            attachedGifUrl = null; 
            previewMediaImg.src = URL.createObjectURL(file); 
            selectedMediaPreview.style.display = "block";
            giphyResults.style.display = "none";
            giphySearchContainer.style.display = "none";
        }
    });
}

if (removeMediaBtn) {
    removeMediaBtn.addEventListener("click", () => {
        attachedGifUrl = null;
        attachedImageFile = null;
        statusImageInput.value = "";
        previewMediaImg.src = "";
        selectedMediaPreview.style.display = "none";
    });
}

if (postStatusBtn) {
    postStatusBtn.addEventListener("click", async () => {
        const statusText = statusInput.value.trim();
        if (!statusText && !attachedGifUrl && !attachedImageFile) return; 

        postStatusBtn.innerText = "Transmitting...";
        postStatusBtn.disabled = true;

        try {
            let finalMediaUrl = attachedGifUrl;
            if (attachedImageFile) {
                const imageRef = ref(storage, `users/${currentUser.uid}/status_images/${Date.now()}_${attachedImageFile.name}`);
                await uploadBytes(imageRef, attachedImageFile);
                finalMediaUrl = await getDownloadURL(imageRef);
            }

            const statusRef = collection(db, "users", currentUser.uid, "statuses");
            await addDoc(statusRef, {
                text: statusText,
                timestamp: serverTimestamp(),
                author: currentUser.displayName,
                author_id: currentUser.uid,
                author_avatar: currentUser.photoURL || "default-avatar.jpg",
                media_url: finalMediaUrl,
                reactions: { star: [], alert: [], tiger: [] } // Initialize empty reactions
            });
            
            statusInput.value = ""; 
            attachedGifUrl = null;
            attachedImageFile = null;
            statusImageInput.value = "";
            previewMediaImg.src = "";
            selectedMediaPreview.style.display = "none";
            
        } catch (error) {
            alert("Signal interrupted. Could not post status.");
        } finally {
            postStatusBtn.innerText = "Send Update";
            postStatusBtn.disabled = false;
        }
    });
}

// --- The Chronological Ledger ---
let feedLimit = 20;
let feedUnsubscribe = null;
const loadMoreFeedBtn = document.getElementById("loadMoreFeedBtn");

function attachFeedListener(userId) {
    function fetchFeed() {
        if (feedUnsubscribe) feedUnsubscribe(); 
        const globalStatusesRef = collectionGroup(db, "statuses");
        const q = query(globalStatusesRef, orderBy("timestamp", "desc"), limit(feedLimit));
        
        feedUnsubscribe = onSnapshot(q, (snapshot) => {
            feedContainer.innerHTML = ""; 
            if (snapshot.empty) {
                feedContainer.innerHTML = `<p style="color: var(--text-muted);">No broadcasts yet. The channel is clear.</p>`;
                if (loadMoreFeedBtn) loadMoreFeedBtn.style.display = "none";
                return;
            }

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const timeString = data.timestamp ? data.timestamp.toDate().toLocaleString() : "Just now";
                const avatarSrc = data.author_avatar || "default-avatar.jpg";
                const profileLink = data.author_id ? `profile.html?user=${data.author_id}` : "#";
                const feedImgUrl = data.media_url || data.gif_url;
                const mediaHTML = feedImgUrl ? `<div style="margin-top: 15px;"><img src="${feedImgUrl}" style="max-width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid var(--strike-gold); object-fit: contain;"></div>` : '';
                
                // REACTION DATA PARSING
                const reactions = data.reactions || { star: [], alert: [], tiger: [] };
                const starCount = reactions.star ? reactions.star.length : 0;
                const alertCount = reactions.alert ? reactions.alert.length : 0;
                const tigerCount = reactions.tiger ? reactions.tiger.length : 0;

                const reactionHTML = `
                    <div class="reaction-wrapper">
                        <button class="u01-btn" style="padding: 5px 12px; font-size: 0.75rem; background: transparent; border: 1px solid var(--strike-gold); color: var(--strike-gold);">Acknowledge</button>
                        <div class="reaction-menu">
                            <span class="reaction-emoji" data-action="react" data-type="star" data-author="${data.author_id}" data-status="${docSnap.id}">⭐</span>
                            <span class="reaction-emoji" data-action="react" data-type="alert" data-author="${data.author_id}" data-status="${docSnap.id}">❗</span>
                            <span class="reaction-emoji" data-action="react" data-type="tiger" data-author="${data.author_id}" data-status="${docSnap.id}">🐅</span>
                        </div>
                    </div>
                    <span style="font-size: 0.85rem; color: var(--text-muted); display: inline-block; transform: translateY(2px); margin-right: 15px;">
                        ${starCount > 0 ? `⭐ ${starCount} ` : ''}
                        ${alertCount > 0 ? `❗ ${alertCount} ` : ''}
                        ${tigerCount > 0 ? `🐅 ${tigerCount} ` : ''}
                    </span>
                `;

                // REDACTION PROTOCOL (Delete Button)
                // Appears if you are the author, OR if you are the Admin
                const showDeleteStatus = (currentUser.uid === data.author_id || currentUser.uid === ADMIN_UID);
                const deleteBtnHTML = showDeleteStatus ? `<button class="u01-btn" data-action="delete-status" data-author="${data.author_id}" data-status="${docSnap.id}" style="padding: 5px 12px; font-size: 0.75rem; background: transparent; border: 1px solid darkred; color: darkred; margin-left: auto;">Scrub</button>` : '';
                
                const statusHTML = `
                    <div class="status-item" style="display: flex; gap: 15px; align-items: flex-start; padding: 20px; border-bottom: 1px solid var(--bronze-shadow);">
                        <a href="${profileLink}" style="flex-shrink: 0;">
                            <img src="${avatarSrc}" alt="${data.author}" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid var(--strike-gold); object-fit: cover; background-color: var(--armor-dark);">
                        </a>
                        <div style="flex: 1; min-width: 0;">
                            <div style="margin-bottom: 8px;">
                                <a href="${profileLink}" style="text-decoration: none;">
                                    <strong style="color: var(--strike-gold); font-family: var(--font-mono); text-transform: uppercase;">
                                        ${data.author}
                                    </strong>
                                </a>
                                <span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 10px;">
                                    ${timeString}
                                </span>
                            </div>
                            <p style="color: var(--text-clarity); font-size: 1.05rem; margin: 0; line-height: 1.5; word-wrap: break-word;">${data.text}</p>
                            ${mediaHTML}
                            
                            <div class="status-actions" style="margin-top: 15px; border-top: 1px solid rgba(200, 151, 54, 0.2); padding-top: 10px; display: flex; align-items: center;">
                                ${reactionHTML}
                                <button class="u01-btn" data-action="toggle-comments" data-author="${data.author_id}" data-status="${docSnap.id}" style="padding: 5px 12px; font-size: 0.75rem; background: transparent; border: 1px solid var(--strike-gold); color: var(--strike-gold);">
                                    View / Send Intercept
                                </button>
                                ${deleteBtnHTML}
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

            if (snapshot.docs.length === feedLimit) {
                if (loadMoreFeedBtn) loadMoreFeedBtn.style.display = "block";
            } else {
                if (loadMoreFeedBtn) loadMoreFeedBtn.style.display = "none";
            }
        });
    }

    fetchFeed();

    if (loadMoreFeedBtn && !loadMoreFeedBtn.dataset.listenerAttached) {
        loadMoreFeedBtn.addEventListener("click", () => {
            feedLimit += 20;
            fetchFeed();
        });
        loadMoreFeedBtn.dataset.listenerAttached = "true";
    }
}

// --- Event Engine (Reactions, Deletes, Comments) ---
window.activeCommentListeners = window.activeCommentListeners || {};

if (feedContainer && !feedContainer.dataset.eventsAttached) {
    feedContainer.addEventListener("click", async (e) => {
        const target = e.target;
        
        // REACTION CLICK
        if (target.dataset.action === "react") {
            const type = target.dataset.type;
            const statusId = target.dataset.status;
            const authorId = target.dataset.author;
            const statusRef = doc(db, "users", authorId, "statuses", statusId);
            
            try {
                const snap = await getDoc(statusRef);
                if (snap.exists()) {
                    const data = snap.data();
                    const reactions = data.reactions || { star: [], alert: [], tiger: [] };
                    const currentArray = reactions[type] || [];
                    
                    if (currentArray.includes(currentUser.uid)) {
                        await updateDoc(statusRef, { [`reactions.${type}`]: arrayRemove(currentUser.uid) });
                    } else {
                        await updateDoc(statusRef, { [`reactions.${type}`]: arrayUnion(currentUser.uid) });
                    }
                }
            } catch (error) {
                console.error("Reaction failed", error);
            }
        }

        // REDACT STATUS (Delete)
        if (target.dataset.action === "delete-status") {
            if (!confirm("Commander: Permanently redact this dispatch?")) return;
            const statusId = target.dataset.status;
            const authorId = target.dataset.author;
            try {
                await deleteDoc(doc(db, "users", authorId, "statuses", statusId));
            } catch (error) {
                alert("Redaction failed. Check perimeter permissions.");
            }
        }

        // REDACT COMMENT (Delete)
        if (target.dataset.action === "delete-comment") {
            if (!confirm("Permanently redact this intercept?")) return;
            const statusId = target.dataset.status;
            const statusAuthorId = target.dataset.statusAuthor;
            const commentId = target.dataset.comment;
            try {
                await deleteDoc(doc(db, "users", statusAuthorId, "statuses", statusId, "comments", commentId));
            } catch (error) {
                alert("Redaction failed. Check perimeter permissions.");
            }
        }

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
        
        // BUG FIXES INJECTED HERE
        if (target.dataset.action === "post-comment") {
            const statusId = target.dataset.status;
            const authorId = target.dataset.author;
            const inputField = document.getElementById(`comment-input-${statusId}`);
            const text = inputField.value.trim();
            
            if (!text) return;

            // BUG FIX 1: Prevent commenting on legacy test posts that have no Author ID
            if (!authorId || authorId === "undefined") {
                alert("Cannot intercept: This is a legacy dispatch missing a target ID.");
                return;
            }

            target.innerText = "...";
            target.disabled = true;
            
            try {
                const commentsRef = collection(db, "users", authorId, "statuses", statusId, "comments");
                await addDoc(commentsRef, {
                    text: text,
                    timestamp: serverTimestamp(),
                    // BUG FIX 2: Fallback string prevents Firebase SDK from crashing if name is null
                    author: currentUser.displayName || "Independent Unit", 
                    author_id: currentUser.uid,
                    author_avatar: currentUser.photoURL || "default-avatar.jpg"
                });
                inputField.value = "";
            } catch (error) {
                console.error("Intercept failed:", error);
                alert("Signal interrupted: " + error.message);
            } finally {
                target.innerText = "Reply";
                target.disabled = false;
            }
        }
    });
    feedContainer.dataset.eventsAttached = "true";
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
            
            // Delete Comment Button [X]
            const showDeleteComment = (currentUser.uid === data.author_id || currentUser.uid === statusAuthorId || currentUser.uid === ADMIN_UID);
            const deleteCommentHTML = showDeleteComment ? `<span data-action="delete-comment" data-status="${statusId}" data-status-author="${statusAuthorId}" data-comment="${docSnap.id}" style="color: darkred; cursor: pointer; font-size: 0.75rem; margin-left: 10px; font-weight: bold;" title="Redact Intercept">[X]</span>` : '';

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
                        ${deleteCommentHTML}
                        <p style="color: var(--text-clarity); font-size: 0.95rem; margin: 4px 0 0 0; line-height: 1.4;">${data.text}</p>
                    </div>
                </div>
            `;
            listContainer.innerHTML += commentHTML;
        });
        listContainer.scrollTop = listContainer.scrollHeight; 
    });
}