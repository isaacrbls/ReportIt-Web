import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { ref, update, get } from "firebase/database";
import { realtimeDb } from "../firebase";

export async function getReportDetails(reportId) {
  try {
    const docRef = doc(db, "reports", reportId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      let dateTime = data.DateTime || "";
      let datePart = "Unknown date";
      let timePart = "Unknown time";

      if (typeof dateTime === 'string' && dateTime.includes(" at ")) {
        [datePart, timePart] = dateTime.split(" at ");
        timePart = timePart?.split(" ")[0] || "Unknown time"; 
      } else if (dateTime?.seconds) {
        
        const date = new Date(dateTime.seconds * 1000);
        datePart = date.toLocaleDateString("en-US", { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        timePart = date.toLocaleTimeString("en-US", { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      } else if (dateTime) {
        
        const date = new Date(dateTime);
        if (!isNaN(date.getTime())) {
          datePart = date.toLocaleDateString("en-US", { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          timePart = date.toLocaleTimeString("en-US", { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          });
        }
      }
      
      return {
        id: reportId,
        category: data.IncidentType || "Unknown",
        description: data.Description || "",
        location: data.Barangay || "Unknown Location",
        coordinates: {
          lat: data.Latitude || null,
          lng: data.Longitude || null,
          geo: data.GeoLocation || ""
        },
        date: datePart || "Unknown date",
        time: timePart || "Unknown time", 
        submittedBy: data.SubmittedByEmail || "Unknown",
        status: data.Status || "Pending",
        hasMedia: data.hasMedia || false,
        mediaType: data.MediaType || null,
        mediaURL: data.MediaURL || null,
        timestamp: dateTime,
        
        ...data
      };
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

export async function updateReportStatus(reportId, status, rejectionReason = null) {
  try {
    const docRef = doc(db, "reports", reportId);
    
    // Get the report to find the user email
    const reportSnap = await getDoc(docRef);
    if (!reportSnap.exists()) {
      console.error("Report not found");
      return false;
    }
    
    const reportData = reportSnap.data();
    const userEmail = reportData.SubmittedByEmail;
    
    const updateData = { Status: status };
    
    if (rejectionReason) {
      updateData.RejectionReason = rejectionReason;
    }
    
    await updateDoc(docRef, updateData);
    
    // If status is "Rejected", increment the user's rejectedReportCount
    if (status === "Rejected" && userEmail) {
      await incrementUserRejectionCount(userEmail);
    }
    
    return true;
  } catch (error) {
    console.error("Error updating report status:", error);
    return false;
  }
}

/**
 * Increment the rejected report count for a user
 */
async function incrementUserRejectionCount(userEmail) {
  try {
    // Find user by email in Realtime Database
    const usersRef = ref(realtimeDb, 'users');
    const usersSnapshot = await get(usersRef);
    
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      const userId = Object.keys(users).find(id => users[id].email === userEmail);
      
      if (userId) {
        const userRef = ref(realtimeDb, `users/${userId}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();
        
        const currentCount = userData.rejectedReportCount || 0;
        const newCount = currentCount + 1;
        
        await update(userRef, {
          rejectedReportCount: newCount,
          updatedAt: new Date().toISOString(),
        });
        
        console.log(`✅ User ${userEmail} rejection count updated: ${currentCount} → ${newCount}`);
        return newCount;
      }
    }
    
    return 0;
  } catch (error) {
    console.error("Error incrementing rejection count:", error);
    return 0;
  }
}

/**
 * Get the rejected report count for a user by email
 */
export async function getUserRejectionCount(userEmail) {
  try {
    const usersRef = ref(realtimeDb, 'users');
    const usersSnapshot = await get(usersRef);
    
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      const userId = Object.keys(users).find(id => users[id].email === userEmail);
      
      if (userId) {
        const userRef = ref(realtimeDb, `users/${userId}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();
        
        return userData.rejectedReportCount || 0;
      }
    }
    
    return 0;
  } catch (error) {
    console.error("Error getting rejection count:", error);
    return 0;
  }
}

/**
 * Reset the rejected report count for a user
 */
export async function resetUserRejectionCount(userEmail) {
  try {
    const usersRef = ref(realtimeDb, 'users');
    const usersSnapshot = await get(usersRef);
    
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      const userId = Object.keys(users).find(id => users[id].email === userEmail);
      
      if (userId) {
        const userRef = ref(realtimeDb, `users/${userId}`);
        
        await update(userRef, {
          rejectedReportCount: 0,
          updatedAt: new Date().toISOString(),
        });
        
        console.log(`✅ User ${userEmail} rejection count reset to 0`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error resetting rejection count:", error);
    return false;
  }
}

export async function deleteReport(reportId) {
  try {
    const docRef = doc(db, "reports", reportId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting report:", error);
    return false;
  }
}

export async function updateReportDetails(reportId, updates) {
  try {
    const docRef = doc(db, "reports", reportId);
    await updateDoc(docRef, updates);
    return true;
  } catch (error) {
    console.error("Error updating report:", error);
    return false;
  }
}

export function formatReportForDisplay(report) {
  if (!report) return null;

  let dateTime = report.DateTime || "";
  let datePart = "Unknown date";
  let timePart = "Unknown time";

  if (typeof dateTime === 'string' && dateTime.includes(" at ")) {
    [datePart, timePart] = dateTime.split(" at ");
    timePart = timePart?.split(" ")[0] || "Unknown time"; 
  } else if (dateTime?.seconds) {
    
    const date = new Date(dateTime.seconds * 1000);
    datePart = date.toLocaleDateString("en-US", { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    timePart = date.toLocaleTimeString("en-US", { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  } else if (dateTime) {
    
    const date = new Date(dateTime);
    if (!isNaN(date.getTime())) {
      datePart = date.toLocaleDateString("en-US", { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      timePart = date.toLocaleTimeString("en-US", { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
  }

  return {
    id: report.id,
    title: report.IncidentType || "Unknown Incident",
    category: report.IncidentType || "Unknown",
    description: report.Description || "",
    location: report.Barangay || "Unknown Location",
    coordinates: {
      lat: report.Latitude,
      lng: report.Longitude,
      geo: report.GeoLocation
    },
    date: datePart,
    time: timePart,
    timestamp: dateTime,
    submittedBy: report.SubmittedByEmail || "Unknown",
    status: (report.Status || "Pending").toLowerCase(),
    hasMedia: report.hasMedia || false,
    mediaType: report.MediaType || null,
    mediaURL: report.MediaURL || null,
    barangay: report.Barangay || ""
  };
}
