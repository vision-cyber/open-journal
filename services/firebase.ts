
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

/*
COPY THESE RULES TO YOUR FIREBASE CONSOLE (Firestore -> Rules tab):

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}

NOTE: These are permissive rules for testing. Use more restrictive rules in production.
*/

const firebaseConfig = {
  apiKey: "AIzaSyCLjKzJAIsckUIhVeMuvNJl1qNANxLztHM",
  authDomain: "open-journal-e8eaa.firebaseapp.com",
  projectId: "open-journal-e8eaa",
  storageBucket: "open-journal-e8eaa.firebasestorage.app",
  messagingSenderId: "570355642904",
  appId: "1:570355642904:web:59108beed5edfa3e05096d",
  measurementId: "G-S6F5KKC217"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use initializeFirestore with long polling to bypass "unavailable" connection errors
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
