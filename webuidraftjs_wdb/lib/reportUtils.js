import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

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
          second: '2-digit',
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
        time: timePart?.split(" ")[0] || "Unknown time", 
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
      second: '2-digit',
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
