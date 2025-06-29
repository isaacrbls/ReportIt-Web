import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBE0CnuoABFzKi3YraHwOWZ-ARx1gEht58",
  authDomain: "admin-46251.firebaseapp.com",
  projectId: "admin-46251",
  storageBucket: "admin-46251.appspot.com",
  messagingSenderId: "619048161769",
  appId: "1:619048161769:web:b187fce60ba1e109bdfb78"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
