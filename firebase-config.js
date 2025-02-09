// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDQ__io3wpj1pF-5kSlngUzaGjSl4Zg6hc",
    authDomain: "shelfsync-19905.firebaseapp.com",
    projectId: "shelfsync-19905",
    storageBucket: "shelfsync-19905.firebasestorage.app",
    messagingSenderId: "801578934485",
    appId: "1:801578934485:web:9f14e0e78e5ae4cdb3025c",
    measurementId: "G-TGVXP35TLY",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, app, db };