import { useEffect, useState } from "react";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";

export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    console.log("🔐 Setting up auth state listener...");
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("🔐 Auth state changed:", firebaseUser);
      setUser(firebaseUser);
      setIsLoading(false);
    });
    return () => {
      console.log("🔐 Cleaning up auth state listener");
      unsubscribe();
    }
  }, []);
  
  return { user, isLoading };
}
