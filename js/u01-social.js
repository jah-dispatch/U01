import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, collection, collectionGroup, addDoc, serverTimestamp, query, orderBy, onSnapshot, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);
console.log("U01 Network Front-End: Armed and Operational.");

// --- DOM Elements ---
const userDisplayName = document.getElementById("userDisplayName");
const userAvatar = document.getElementById("userAvatar");
const userBio = document.getElementById("userBio");
const statusInput = document.getElementById("newStatusInput");
const postStatusBtn = document.getElementById("postStatusBtn");

// Identity Editor DOM Elements
const editIdentityBtn = document.getElementById("editIdentityBtn");
const editProfileMatrix = document.getElementById("editProfileMatrix");
const editBioInput = document.getElementById("editBioInput");
const editMediaInput = document.getElementById("editMediaInput");
const saveIdentityBtn = document.getElementById("saveIdentityBtn");
const mediaEmbedContainer = document.getElementById("mediaEmbedContainer");

let currentUser = null; 

// --- Security & Profile Data Fetch ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        console.log("Verified Unit:", user.uid);
        
        userDisplayName.innerText = user.displayName || "Independent Unit";
        if (user.photoURL) { userAvatar.src = user.photoURL; }

        attachFeedListener(user.uid); 

        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
            const profileData = userSnap.data();
            userBio.innerText = profileData.bio;
            if (profileData.media_url) {
                renderMediaEmbed(profileData.media_url);
            }
        }
    } else {
        window.location.href = "login.html"; 
    }
});

// --- Identity Editor Logic ---
if (editIdentityBtn) {
    editIdentityBtn.addEventListener("click", () => {
        if (editProfileMatrix.style.display === "none") {
            editProfileMatrix.style.display = "block";
            editBioInput.value = userBio.innerText; 
        } else {
            editProfileMatrix.style.display = "none";
        }
    });
}

if (saveIdentityBtn) {
    saveIdentityBtn.addEventListener("click", async () => {
        const newBio = editBioInput.value.trim();
        const newMedia = editMediaInput.value.trim();
        
        saveIdentityBtn.innerText = "Encrypting...";
        saveIdentityBtn.disabled = true;

        try {
            const userDocRef = doc(db, "users", currentUser.uid);
            await updateDoc(userDocRef, {
                bio: newBio,
                media_url: newMedia
            });

            userBio.innerText = newBio;
            if (newMedia) {
                renderMediaEmbed(newMedia);
            } else {
                mediaEmbedContainer.innerHTML = "";
            }

            editProfileMatrix.style.display = "none";
            console.log("Identity successfully updated.");
        } catch (error) {
            console.error("Update failed:", error);
            alert("Signal interrupted. Identity update failed.");
        } finally {
            saveIdentityBtn.innerText = "Lock In Changes";
            saveIdentityBtn.disabled = false;
        }
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

// --- The Status Broadcaster ---
if (postStatusBtn) {
    postStatusBtn.addEventListener("click", async () => {
        const statusText = statusInput.value.trim();
        if (!statusText || !currentUser) return; 

        postStatusBtn.innerText = "Transmitting...";
        postStatusBtn.disabled = true;

        try {
            const statusRef = collection(db, "users", currentUser.uid, "statuses");
            // NEW PAYLOAD: We are now pushing the user's ID and Avatar to the cloud
            await addDoc(statusRef, {
                text: statusText,
                timestamp: serverTimestamp(),
                author: currentUser.displayName,
                author_id: currentUser.uid,
                author_avatar: currentUser.photoURL || "default-avatar.jpg"
            });
            statusInput.value = ""; 
        } catch (error) {
            alert("Signal interrupted. Could not post status.");
        } finally {
            postStatusBtn.innerText = "Send Update";
            postStatusBtn.disabled = false;
        }
    });
}

// --- The Chronological Ledger (Global Network Feed) ---
function attachFeedListener(userId) {
    const feedContainer = document.getElementById("globalFeed");
    const globalStatusesRef = collectionGroup(db, "statuses");
    const q = query(globalStatusesRef, orderBy("timestamp", "desc"), limit(20));

    onSnapshot(q, (snapshot) => {
        feedContainer.innerHTML = ""; 
        
        if (snapshot.empty) {
            feedContainer.innerHTML = `<p style="color: var(--text-muted);">No broadcasts yet. The channel is clear.</p>`;
            return;
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const timeString = data.timestamp ? data.timestamp.toDate().toLocaleString() : "Just now";
            
            // Fallbacks in case the old test statuses don't have an avatar/id attached
            const avatarSrc = data.author_avatar || "default-avatar.jpg";
            const profileLink = data.author_id ? `profile.html?user=${data.author_id}` : "#";
            
            // NEW UI: Flexbox layout to put the avatar next to the text, wrapped in links
            const statusHTML = `
                <div class="status-item" style="display: flex; gap: 15px; align-items: flex-start; padding: 15px; border-bottom: 1px solid var(--bronze-shadow);">
                    <a href="${profileLink}" style="flex-shrink: 0;">
                        <img src="${avatarSrc}" alt="${data.author}" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid var(--strike-gold); object-fit: cover;">
                    </a>
                    <div style="flex: 1;">
                        <div style="margin-bottom: 5px;">
                            <a href="${profileLink}" style="text-decoration: none;">
                                <strong style="color: var(--strike-gold); font-family: var(--font-mono); text-transform: uppercase;">
                                    ${data.author}
                                </strong>
                            </a>
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
    }, (error) => {
        console.error("Network Feed Error:", error);
    });
}