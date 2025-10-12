/**
 * Suspension and False Reporting Tracking Utilities
 * Handles user account suspensions for false reporting
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  addDoc,
  Timestamp 
} from "firebase/firestore";
import { db } from "@/firebase";

// Constants
export const SUSPENSION_CONSTANTS = {
  MAX_REJECTIONS: 3,
  SUSPENSION_DURATION_DAYS: 14,
  COLLECTION_NAMES: {
    USER_SUSPENSIONS: "userSuspensions",
    REJECTION_HISTORY: "rejectionHistory",
    NOTIFICATIONS: "userNotifications"
  }
};

/**
 * Track a report rejection for a user
 * @param {string} userEmail - User's email
 * @param {string} reportId - Report ID that was rejected
 * @param {string} rejectionReason - Reason for rejection
 * @param {string} rejectedBy - Admin who rejected the report
 */
export async function trackReportRejection(userEmail, reportId, rejectionReason, rejectedBy) {
  try {
    console.log(`📝 Tracking rejection for user: ${userEmail}, report: ${reportId}`);
    
    // Add to rejection history
    const rejectionData = {
      userEmail,
      reportId,
      rejectionReason,
      rejectedBy,
      rejectedAt: Timestamp.now(),
      processed: false
    };
    
    await addDoc(collection(db, SUSPENSION_CONSTANTS.COLLECTION_NAMES.REJECTION_HISTORY), rejectionData);
    
    // Check rejection count
    const rejectionCount = await getUserRejectionCount(userEmail);
    console.log(`🔢 User ${userEmail} now has ${rejectionCount} rejections`);
    
    // Do NOT auto-suspend - let the admin decide via the modal
    // Only send notification if under the limit
    if (rejectionCount < SUSPENSION_CONSTANTS.MAX_REJECTIONS) {
      // Send rejection notification
      await sendNotification(userEmail, {
        type: 'REPORT_REJECTED',
        title: 'Report Rejected',
        message: `Your report has been rejected. Reason: ${rejectionReason}. You have ${SUSPENSION_CONSTANTS.MAX_REJECTIONS - rejectionCount} warnings remaining.`,
        reportId,
        rejectionReason
      });
    }
    
    return rejectionCount;
  } catch (error) {
    console.error("Error tracking report rejection:", error);
    throw error;
  }
}

/**
 * Get the number of rejections for a user in the current period
 * @param {string} userEmail - User's email
 * @returns {number} Number of rejections
 */
export async function getUserRejectionCount(userEmail) {
  try {
    const q = query(
      collection(db, SUSPENSION_CONSTANTS.COLLECTION_NAMES.REJECTION_HISTORY),
      where("userEmail", "==", userEmail),
      where("processed", "==", false),
      orderBy("rejectedAt", "desc")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("Error getting user rejection count:", error);
    return 0;
  }
}

/**
 * Suspend a user for false reporting
 * @param {string} userEmail - User's email
 * @param {number} rejectionCount - Number of rejections that triggered suspension
 */
export async function suspendUser(userEmail, rejectionCount) {
  try {
    console.log(`🚫 Suspending user: ${userEmail} for ${SUSPENSION_CONSTANTS.SUSPENSION_DURATION_DAYS} days`);
    
    const now = Timestamp.now();
    const suspensionEnd = new Date(now.toDate());
    suspensionEnd.setDate(suspensionEnd.getDate() + SUSPENSION_CONSTANTS.SUSPENSION_DURATION_DAYS);
    
    const suspensionData = {
      userEmail,
      suspendedAt: now,
      suspensionEnd: Timestamp.fromDate(suspensionEnd),
      rejectionCount,
      isActive: true,
      suspendedBy: "SYSTEM",
      reason: `Exceeded maximum rejections (${rejectionCount}/${SUSPENSION_CONSTANTS.MAX_REJECTIONS})`
    };
    
    // Create suspension record
    await setDoc(doc(db, SUSPENSION_CONSTANTS.COLLECTION_NAMES.USER_SUSPENSIONS, userEmail), suspensionData);
    
    // Do NOT mark rejections as processed - keep the counter at 3
    // This ensures the rejection count persists even after suspension
    
    // Send suspension notification
    await sendNotification(userEmail, {
      type: 'ACCOUNT_SUSPENDED',
      title: 'Account Suspended',
      message: `Your account has been suspended for ${SUSPENSION_CONSTANTS.SUSPENSION_DURATION_DAYS} days due to repeated false reports. You will be automatically reinstated on ${suspensionEnd.toLocaleDateString()}.`,
      suspensionEnd: Timestamp.fromDate(suspensionEnd)
    });
    
    console.log(`✅ User ${userEmail} suspended until ${suspensionEnd.toLocaleDateString()} - rejection counter kept at ${rejectionCount}`);
  } catch (error) {
    console.error("Error suspending user:", error);
    throw error;
  }
}

/**
 * Mark all unprocessed rejections for a user as processed
 * @param {string} userEmail - User's email
 */
async function markRejectionsAsProcessed(userEmail) {
  try {
    const q = query(
      collection(db, SUSPENSION_CONSTANTS.COLLECTION_NAMES.REJECTION_HISTORY),
      where("userEmail", "==", userEmail),
      where("processed", "==", false)
    );
    
    const snapshot = await getDocs(q);
    const batch = [];
    
    snapshot.forEach((docSnapshot) => {
      batch.push(updateDoc(docSnapshot.ref, { processed: true }));
    });
    
    await Promise.all(batch);
    console.log(`✅ Marked ${batch.length} rejections as processed for ${userEmail}`);
  } catch (error) {
    console.error("Error marking rejections as processed:", error);
  }
}

/**
 * Check if a user is currently suspended
 * @param {string} userEmail - User's email
 * @returns {Object|null} Suspension info or null if not suspended
 */
export async function getUserSuspensionStatus(userEmail) {
  try {
    const docRef = doc(db, SUSPENSION_CONSTANTS.COLLECTION_NAMES.USER_SUSPENSIONS, userEmail);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const suspensionData = docSnap.data();
    
    // Check if suspension has expired
    const now = new Date();
    const suspensionEnd = suspensionData.suspensionEnd.toDate();
    
    if (now >= suspensionEnd && suspensionData.isActive) {
      // Auto-reinstate user
      await reinstateUser(userEmail);
      return null;
    }
    
    return suspensionData.isActive ? suspensionData : null;
  } catch (error) {
    console.error("Error checking user suspension status:", error);
    return null;
  }
}

/**
 * Automatically reinstate a user after suspension period
 * @param {string} userEmail - User's email
 */
export async function reinstateUser(userEmail) {
  try {
    console.log(`🔄 Auto-reinstating user: ${userEmail}`);
    
    const docRef = doc(db, SUSPENSION_CONSTANTS.COLLECTION_NAMES.USER_SUSPENSIONS, userEmail);
    await updateDoc(docRef, {
      isActive: false,
      reinstatedAt: Timestamp.now(),
      reinstatedBy: "SYSTEM"
    });
    
    // Send reinstatement notification
    await sendNotification(userEmail, {
      type: 'ACCOUNT_REINSTATED',
      title: 'Account Reinstated',
      message: 'Your account has been automatically reinstated. You can now submit reports again. Please ensure all future reports are accurate to avoid future suspensions.'
    });
    
    console.log(`✅ User ${userEmail} reinstated successfully`);
  } catch (error) {
    console.error("Error reinstating user:", error);
    throw error;
  }
}

/**
 * Send notification to user
 * @param {string} userEmail - User's email
 * @param {Object} notificationData - Notification details
 */
export async function sendNotification(userEmail, notificationData) {
  try {
    const notification = {
      userEmail,
      ...notificationData,
      createdAt: Timestamp.now(),
      read: false,
      id: `${userEmail}_${Date.now()}`
    };
    
    await addDoc(collection(db, SUSPENSION_CONSTANTS.COLLECTION_NAMES.NOTIFICATIONS), notification);
    console.log(`📬 Notification sent to ${userEmail}: ${notificationData.title}`);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

/**
 * Get all notifications for a user
 * @param {string} userEmail - User's email
 * @returns {Array} Array of notifications
 */
export async function getUserNotifications(userEmail) {
  try {
    const q = query(
      collection(db, SUSPENSION_CONSTANTS.COLLECTION_NAMES.NOTIFICATIONS),
      where("userEmail", "==", userEmail),
      orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting user notifications:", error);
    return [];
  }
}

/**
 * Check for users whose suspensions have expired and reinstate them
 * This should be called periodically (e.g., daily cron job)
 */
export async function processExpiredSuspensions() {
  try {
    console.log("🔄 Processing expired suspensions...");
    
    const now = Timestamp.now();
    const q = query(
      collection(db, SUSPENSION_CONSTANTS.COLLECTION_NAMES.USER_SUSPENSIONS),
      where("isActive", "==", true),
      where("suspensionEnd", "<=", now)
    );
    
    const snapshot = await getDocs(q);
    const reinstatePromises = [];
    
    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      reinstatePromises.push(reinstateUser(data.userEmail));
    });
    
    await Promise.all(reinstatePromises);
    console.log(`✅ Processed ${reinstatePromises.length} expired suspensions`);
  } catch (error) {
    console.error("Error processing expired suspensions:", error);
  }
}