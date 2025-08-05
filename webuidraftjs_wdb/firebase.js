import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAOz81U2qnC2MEq-P1yMbUiQW8qAPTh9OU",  
  authDomain: "admin-76567.firebaseapp.com",         
  projectId: "admin-76567",                           
  storageBucket: "admin-76567.appspot.com",        
  messagingSenderId: "189749622351",   
  appId: "1:619048161769:web:b187fce60ba1e109bdfb78"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
