// src/lib/firebase.ts

import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// 🔐 Your Firebase config (from Firebase console)
const firebaseConfig = {
  apiKey: "AIzaSyCtDbA951-mNmP0t725_4RH8Yf5aVWkXw",
  authDomain: "pelagic-rig-465410-a2.firebaseapp.com",
  projectId: "pelagic-rig-465410-a2",
  storageBucket: "pelagic-rig-465410-a2.appspot.com",
  messagingSenderId: "207391020723",
  appId: "1:207391020723:web:49d14e1817e03374a9c2c6",
  measurementId: "G-50PK6BHNLW"
};

// 🚀 Initialize Firebase
const app = initializeApp(firebaseConfig);

// 📊 Set up analytics safely (won’t crash on server)
let analytics: ReturnType<typeof getAnalytics> | null = null;

isSupported().then((enabled) => {
  if (enabled) {
    analytics = getAnalytics(app);
  }
});

// 🧠 Export the app and analytics
export { app, analytics };
