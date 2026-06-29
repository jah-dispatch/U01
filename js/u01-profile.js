import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, collection, query, orderBy, onSnapshot, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your proprietary U01 Network Keys
const firebaseConfig = {
  apiKey: "AIzaSyAuiHmPgfj5GHE3BIWeRgbeJWdU4nidhMs",
  authDomain: "unit-of-one-social-network.firebaseapp.com",
  projectId: "unit-of-one-social-network",
  storageBucket: "unit-of-one-social-network.firebasestorage.app",
  messagingSenderId: "26265021963",
  appId: "1:26265021963:web:f1c9b9c6d5c27d4dd8210e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- DOM Elements ---
const profileAvatar = document.getElementById("profileAvatar");
const profileDisplayName = document.getElementById("profileDisplayName");
const profileBio = document.getElementById("profileBio");
const mediaEmbedContainer = document.getElementById("mediaEmbedContainer");
const feedContainer = document.getElementById("userSpecificFeed");

// --- URL Parsing: Who are we looking at? ---
const urlParams = new URLSearchParams(window.location.search);
const targetUserId = urlParams.get('user');

if (!targetUserId) {
    // If no user is specified in the URL, kick them back to the dashboard
    window.location.href = "dashboard.html";
} else {
    console.log("Targeting Profile ID:", targetUserId);
    loadProfileData(targetUserId);
    loadUserFeed(targetUserId);
}

// --- Fetch User Identity ---
async function loadProfileData(userId) {
    try {
        const userDocRef = doc(db, "users", userId);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
            const data = userSnap.data();
            
            profileDisplayName.innerText = data.displayName || "Unknown Unit";
            profileBio.innerText = data.bio || "No biography provided.";
            if (data.photoURL) { profileAvatar.src = data.photoURL; }
            
            if (data.media_url) {
                renderMediaEmbed(data.media_url);
            }
        } else {
            profileDisplayName.innerText = "Unit Not Found";
            profileBio.innerText = "This profile does not exist or has been redacted.";
        }
    } catch (error) {
        console.error("Error fetching profile:", error);
        profileBio.innerText = "Signal interrupted. Could not load identity matrix.";
    }
}

// --- Fetch User Specific Feed ---
function loadUserFeed(userId) {
    const statusesRef = collection(db, "users", userId, "statuses");
    const q = query(statusesRef, orderBy("timestamp", "desc"), limit(20));

    onSnapshot(q, (snapshot) => {
        feedContainer.innerHTML = ""; 
        
        if (snapshot.empty) {
            feedContainer.innerHTML = `<p style="color: var(--text-muted);">No broadcasts yet. The channel is clear.</p>`;
            return;
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const timeString = data.timestamp ? data.timestamp.toDate().toLocaleString() : "Just now";
            
            const avatarSrc = data.author_avatar || "default-avatar.jpg";
            
            const statusHTML = `
                <div class="status-item" style="display: flex; gap: 15px; align-items: flex-start; padding: 15px; border-bottom: 1px solid var(--bronze-shadow);">
                    <img src="${avatarSrc}" alt="${data.author}" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid var(--strike-gold); object-fit: cover; flex-shrink: 0;">
                    <div style="flex: 1;">
                        <div style="margin-bottom: 5px;">
                            <strong style="color: var(--strike-gold); font-family: var(--font-mono); text-transform: uppercase;">
                                ${data.author}
                            </strong>
                            <span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 10px;">
                                ${timeString}
                            </span>
                        </div>
                        <p style="color: var(--text-clarity); font-size: 1.05rem; margin: 0;">${data.text}</p>
                    </div>
                </div>
            `;
            feedContainer.innerHTML += statusHTML;
        });
    });
}

// --- The Media Embed Parser ---
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
        mediaEmbedContainer.innerHTML = `
            <iframe src="${embedUrl}" 
                width="100%" height="${playerHeight}" frameborder="0" allowfullscreen="" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                style="border-radius: 12px; border: 1px solid var(--bronze-shadow); background: transparent; overflow: hidden;">
            </iframe>
        `;
    }
}