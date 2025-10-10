/**
 * User Management API
 * Utility functions for managing users in the admin panel
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  addDoc,
} from "firebase/firestore";
import { db } from "@/firebase";

/**
 * Fetch all users from Firestore
 */
export async function getAllUsers() {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

/**
 * Fetch a single user by ID
 */
export async function getUserById(userId) {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return {
        id: userSnap.id,
        ...userSnap.data()
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
}

/**
 * Suspend a user account
 */
export async function suspendUser(userId, reason, durationDays = 14) {
  try {
    const userRef = doc(db, "users", userId);
    const suspensionEndDate = new Date();
    suspensionEndDate.setDate(suspensionEndDate.getDate() + durationDays);

    await updateDoc(userRef, {
      suspended: true,
      isSuspended: true,
      suspensionReason: reason,
      suspensionDate: Timestamp.now(),
      suspensionEndDate: Timestamp.fromDate(suspensionEndDate),
      updatedAt: Timestamp.now(),
    });

    // Log the suspension
    await addDoc(collection(db, "userSuspensions"), {
      userId,
      reason,
      suspendedAt: Timestamp.now(),
      suspensionEndDate: Timestamp.fromDate(suspensionEndDate),
      isActive: true,
    });

    return true;
  } catch (error) {
    console.error("Error suspending user:", error);
    throw error;
  }
}

/**
 * Unsuspend a user account
 */
export async function unsuspendUser(userId) {
  try {
    const userRef = doc(db, "users", userId);
    
    await updateDoc(userRef, {
      suspended: false,
      isSuspended: false,
      suspensionReason: null,
      suspensionDate: null,
      suspensionEndDate: null,
      unsuspendedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Update suspension records
    const suspensionsRef = collection(db, "userSuspensions");
    const q = query(
      suspensionsRef,
      where("userId", "==", userId),
      where("isActive", "==", true)
    );
    const snapshot = await getDocs(q);
    
    const updatePromises = snapshot.docs.map(doc =>
      updateDoc(doc.ref, {
        isActive: false,
        unsuspendedAt: Timestamp.now(),
      })
    );
    
    await Promise.all(updatePromises);

    return true;
  } catch (error) {
    console.error("Error unsuspending user:", error);
    throw error;
  }
}

/**
 * Promote user to admin
 */
export async function promoteToAdmin(userId) {
  try {
    const userRef = doc(db, "users", userId);
    
    await updateDoc(userRef, {
      role: "admin",
      isAdmin: true,
      promotedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return true;
  } catch (error) {
    console.error("Error promoting user:", error);
    throw error;
  }
}

/**
 * Demote admin to regular user
 */
export async function demoteFromAdmin(userId) {
  try {
    const userRef = doc(db, "users", userId);
    
    await updateDoc(userRef, {
      role: "user",
      isAdmin: false,
      demotedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return true;
  } catch (error) {
    console.error("Error demoting user:", error);
    throw error;
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(userId) {
  try {
    // Fetch user's reports
    const reportsRef = collection(db, "reports");
    const reportsQuery = query(reportsRef, where("userId", "==", userId));
    const reportsSnapshot = await getDocs(reportsQuery);
    const reports = reportsSnapshot.docs.map(doc => doc.data());

    // Fetch suspension history
    const suspensionsRef = collection(db, "userSuspensions");
    const suspensionsQuery = query(suspensionsRef, where("userId", "==", userId));
    const suspensionsSnapshot = await getDocs(suspensionsQuery);

    return {
      totalReports: reports.length,
      approvedReports: reports.filter(r => r.status === "approved").length,
      rejectedReports: reports.filter(r => r.status === "rejected").length,
      pendingReports: reports.filter(r => r.status === "pending").length,
      totalSuspensions: suspensionsSnapshot.docs.length,
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    throw error;
  }
}

/**
 * Get all suspended users
 */
export async function getSuspendedUsers() {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("suspended", "==", true));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching suspended users:", error);
    throw error;
  }
}

/**
 * Get all admin users
 */
export async function getAdminUsers() {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("role", "==", "admin"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching admin users:", error);
    throw error;
  }
}

/**
 * Search users by email or name
 */
export async function searchUsers(searchTerm) {
  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const lowerSearchTerm = searchTerm.toLowerCase();
    return users.filter(user => 
      user.email?.toLowerCase().includes(lowerSearchTerm) ||
      user.displayName?.toLowerCase().includes(lowerSearchTerm) ||
      user.name?.toLowerCase().includes(lowerSearchTerm)
    );
  } catch (error) {
    console.error("Error searching users:", error);
    throw error;
  }
}
