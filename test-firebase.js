import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDp7tefCAVKrZPA1UWpnAwIWD4SCt67j6o",
    authDomain: "financialtracker-653a3.firebaseapp.com",
    projectId: "financialtracker-653a3",
    storageBucket: "financialtracker-653a3.firebasestorage.app",
    messagingSenderId: "892807839835",
    appId: "1:892807839835:web:ad7293d4743c068e6a3f7e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
    try {
        console.log("Adding doc...");
        const docRef = await addDoc(collection(db, "transactions"), {
            amount: 999,
            category: "Test",
            date: new Date().toISOString().split('T')[0],
            description: "Node.js Test",
            type: "income"
        });
        console.log("Added doc with ID:", docRef.id);

        console.log("Fetching docs...");
        const snapshot = await getDocs(collection(db, "transactions"));
        console.log("Total docs:", snapshot.size);
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

test();
