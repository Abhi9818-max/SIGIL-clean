// src/lib/firebase.ts

import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


// 🔐 Your Firebase config should be in environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// 🚀 Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}


// 📊 Set up analytics safely (won’t crash on server)
let analytics: ReturnType<typeof getAnalytics> | null = null;

if (typeof window !== 'undefined') {
    isSupported().then((enabled) => {
      if (enabled) {
        analytics = getAnalytics(app);
      }
    });
}

const auth = getAuth(app);
const db = getFirestore(app);


// 🧠 Export the app and other Firebase services
export { app, analytics, auth, db };
