import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Fetch and format report details from Firebase
 * @param {string} reportId - The ID of the report to fetch
 * @returns {Object|null} - Formatted report data or null if not found
 */
export async function getReportDetails(reportId) {
  try {
    const docRef = doc(db, "reports", reportId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Parse the DateTime field to extract date and time
      let dateTime = data.DateTime || "";
      let datePart = "Unknown date";
      let timePart = "Unknown time";
      
      // Handle different types of DateTime values
      if (typeof dateTime === 'string' && dateTime.includes(" at ")) {
        [datePart, timePart] = dateTime.split(" at ");
        timePart = timePart?.split(" ")[0] || "Unknown time"; // Remove timezone
      } else if (dateTime?.seconds) {
        // Handle Firebase Timestamp
        const date = new Date(dateTime.seconds * 1000);
        datePart = date.toLocaleDateString("en-US", { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        timePart = date.toLocaleTimeString("en-US", { 
          hour: 'numeric', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: true 
        });
      } else if (dateTime) {
        // Try to parse as regular date
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
            second: '2-digit',
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
        time: timePart?.split(" ")[0] || "Unknown time", // Remove timezone part
        submittedBy: data.SubmittedByEmail || "Unknown",
        status: data.Status || "Pending",
        hasMedia: data.hasMedia || false,
        mediaType: data.MediaType || null,
        mediaURL: data.MediaURL || null,
        timestamp: dateTime,
        // Keep original data for backward compatibility
        ...data
      };
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

/**
 * Update report status in Firebase
 * @param {string} reportId - The ID of the report to update
 * @param {string} status - New status ("Verified", "Rejected", "Pending")
 * @param {string} rejectionReason - Reason for rejection (optional)
 */
export async function updateReportStatus(reportId, status, rejectionReason = null) {
  try {
    const docRef = doc(db, "reports", reportId);
    const updateData = { Status: status };
    
    if (rejectionReason) {
      updateData.RejectionReason = rejectionReason;
    }
    
    await updateDoc(docRef, updateData);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Format report data for display in components
 * @param {Object} report - Raw report data from Firebase
 * @returns {Object} - Formatted report data
 */
export function formatReportForDisplay(report) {
  if (!report) return null;

  // Safely handle DateTime field
  let dateTime = report.DateTime || "";
  let datePart = "Unknown date";
  let timePart = "Unknown time";
  
  // Handle different types of DateTime values
  if (typeof dateTime === 'string' && dateTime.includes(" at ")) {
    [datePart, timePart] = dateTime.split(" at ");
    timePart = timePart?.split(" ")[0] || "Unknown time"; // Remove timezone
  } else if (dateTime?.seconds) {
    // Handle Firebase Timestamp
    const date = new Date(dateTime.seconds * 1000);
    datePart = date.toLocaleDateString("en-US", { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    timePart = date.toLocaleTimeString("en-US", { 
      hour: 'numeric', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  } else if (dateTime) {
    // Try to parse as regular date
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
        second: '2-digit',
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
