import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Your proprietary U01 Network Keys
const firebaseConfig = {
  apiKey: "AIzaSyAuiHmPgfj5GHE3BIWeRgbeJWdU4nidhMs",
  authDomain: "unit-of-one-social-network.firebaseapp.com",
  projectId: "unit-of-one-social-network",
  storageBucket: "unit-of-one-social-network.firebasestorage.app",
  messagingSenderId: "26265021963",
  appId: "1:26265021963:web:f1c9b9c6d5c27d4dd8210e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Grab the login button from the HTML
const loginBtn = document.getElementById("googleLoginBtn");

// When clicked, trigger the Google popup
if (loginBtn) {
    loginBtn.addEventListener("click", () => {
        signInWithPopup(auth, provider)
            .then((result) => {
                console.log("Authentication Successful:", result.user.email);
                // Redirect straight to the sanctuary
                window.location.href = "dashboard.html"; 
            })
            .catch((error) => {
                console.error("Authentication Failed:", error.message);
                alert("Authentication failed. Please try again.");
            });
    });
}

// Security Check: If they are already logged in, bypass the login screen
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = "dashboard.html";
    }
});