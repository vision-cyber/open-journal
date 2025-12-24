
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

/*
COPY THESE RULES TO YOUR FIREBASE CONSOLE (Firestore -> Rules tab):

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User Profiles
    match /users/{uid} {
      allow read: if request.auth != null;
      // Allow user to create their own profile
      allow create: if request.auth != null && request.auth.uid == uid;
      // Allow user to update their own profile, OR allow others to increment stars/milestones
      allow update: if request.auth != null && (
        request.auth.uid == uid || 
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['totalStars', 'canCreateSpace'])
      );
    }
    
    // Journals and Notes
    match /journals/{journalId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
      
      match /notes/{noteId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        // Permissive update for starring - checked by service logic
        allow update: if request.auth != null;
      }
    }
    
    // Notifications
    match /notifications/{notificationId} {
      // Must use where("userId", "==", auth.uid) in queries
      allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
    }
    
    // Spaces
    match /spaces/{spaceId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      
      match /members/{memberId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && request.auth.uid == memberId;
      }
    }

    // User Membership Junction
    match /userSpaces/{id} {
      // Corrected read rule to use resource.data for query validation
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
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
