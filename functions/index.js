const functions = require("firebase-functions/v1");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");

initializeApp();
const db = getFirestore();

// Standard Auth Trigger (No GCIP upgrade required)
exports.forgeU01Profile = functions.auth.user().onCreate(async (user) => {
  const initialProfile = {
    displayName: user.displayName || "Independent Unit",
    email: user.email,
    bio: "Demanded dignity - Non Negotiable.",
    media_url: "", 
    role: "user", 
    friends: ["3TF1XGyopqNKnBlbUg9bZux1u6u1"], 
    createdAt: FieldValue.serverTimestamp()
  };

  await db.collection("users").doc(user.uid).set(initialProfile);
  
  console.log(`U01 Profile forged for: ${user.uid}`);
  
  return null;
});