import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA9YHqy8Z3KHE16Z4mW60E45_MfTePISPQ",
  authDomain: "gracechord.firebaseapp.com",
  projectId: "gracechord",
  storageBucket: "gracechord.firebasestorage.app",
  messagingSenderId: "508458833246",
  appId: "1:508458833246:web:a247ba217922eb8693ebcf"
};

const app = initializeApp(firebaseConfig);
export const authInstance = getAuth(app);
export const db = getFirestore(app);