import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBR-JTMjrf66e9vcemzdd38b5X-EzN4uZE",
  authDomain: "portfolio-39211.firebaseapp.com",
  projectId: "portfolio-39211",
  storageBucket: "portfolio-39211.firebasestorage.app",
  messagingSenderId: "14539122818",
  appId: "1:14539122818:web:fc6b4ff1439259de362c9b",
  measurementId: "G-X3D098DF36"
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
