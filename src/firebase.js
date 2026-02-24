import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDp7tefCAVKrZPA1UWpnAwIWD4SCt67j6o",
    authDomain: "financialtracker-653a3.firebaseapp.com",
    projectId: "financialtracker-653a3",
    storageBucket: "financialtracker-653a3.firebasestorage.app",
    messagingSenderId: "892807839835",
    appId: "1:892807839835:web:ad7293d4743c068e6a3f7e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
