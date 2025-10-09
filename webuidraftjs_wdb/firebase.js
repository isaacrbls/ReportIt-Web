import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAOz81U2qnC2MEq-P1yMbUiQW8qAPTh9OU",  
  authDomain: "admin-76567.firebaseapp.com",         
  databaseURL: "https://admin-76567-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "admin-76567",                           
  storageBucket: "admin-76567.appspot.com",        
  messagingSenderId: "189749622351",   
  appId: "1:619048161769:web:b187fce60ba1e109bdfb78"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);
