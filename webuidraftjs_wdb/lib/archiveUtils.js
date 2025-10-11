/**
 * Archive Management Utilities
 * Handles archiving of deleted reports
 */

import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  deleteDoc,
  setDoc
} from "firebase/firestore";
import { db } from "@/firebase";

// Constants
export const ARCHIVE_CONSTANTS = {
  COLLECTION_NAMES: {
    ARCHIVED_REPORTS: "archivedReports"
  }
};

/**
 * Archive a report when it's deleted
 * @param {Object} reportData - The report data to archive
 * @param {string} deletedBy - Admin who deleted the report
 * @param {string} deletionReason - Reason for deletion (optional)
 */
export async function archiveReport(reportData, deletedBy, deletionReason = null) {
  try {
    console.log(`📦 Archiving report: ${reportData.id}`);
    
    // Filter out undefined values to prevent Firestore errors
    const cleanReportData = Object.fromEntries(
      Object.entries(reportData).filter(([key, value]) => value !== undefined)
    );
    
    const archiveData = {
      ...cleanReportData,
      originalId: reportData.id, // Keep reference to original ID
      archivedAt: Timestamp.now(),
      deletedBy,
      deletionReason,
      isArchived: true,
      archiveVersion: "1.0"
    };
    
    // Remove the original Firestore document ID to avoid conflicts
    delete archiveData.id;
    
    const docRef = await addDoc(collection(db, ARCHIVE_CONSTANTS.COLLECTION_NAMES.ARCHIVED_REPORTS), archiveData);
    
    console.log(`✅ Report archived successfully with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error("Error archiving report:", error);
    throw error;
  }
}

/**
 * Get all archived reports
 * @param {string} barangay - Filter by barangay (optional)
 * @returns {Array} Array of archived reports
 */
export async function getArchivedReports(barangay = null) {
  try {
    console.log(`📚 Fetching archived reports${barangay ? ` for ${barangay}` : ''}`);
    
    let q;
    if (barangay) {
      q = query(
        collection(db, ARCHIVE_CONSTANTS.COLLECTION_NAMES.ARCHIVED_REPORTS),
        where("Barangay", "==", barangay),
        orderBy("archivedAt", "desc")
      );
    } else {
      q = query(
        collection(db, ARCHIVE_CONSTANTS.COLLECTION_NAMES.ARCHIVED_REPORTS),
        orderBy("archivedAt", "desc")
      );
    }
    
    const snapshot = await getDocs(q);
    const archivedReports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`✅ Retrieved ${archivedReports.length} archived reports`);
    return archivedReports;
  } catch (error) {
    console.error("Error fetching archived reports:", error);
    return [];
  }
}

/**
 * Get archived reports by date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} barangay - Filter by barangay (optional)
 * @returns {Array} Array of archived reports
 */
export async function getArchivedReportsByDateRange(startDate, endDate, barangay = null) {
  try {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    let q;
    if (barangay) {
      q = query(
        collection(db, ARCHIVE_CONSTANTS.COLLECTION_NAMES.ARCHIVED_REPORTS),
        where("Barangay", "==", barangay),
        where("archivedAt", ">=", startTimestamp),
        where("archivedAt", "<=", endTimestamp),
        orderBy("archivedAt", "desc")
      );
    } else {
      q = query(
        collection(db, ARCHIVE_CONSTANTS.COLLECTION_NAMES.ARCHIVED_REPORTS),
        where("archivedAt", ">=", startTimestamp),
        where("archivedAt", "<=", endTimestamp),
        orderBy("archivedAt", "desc")
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching archived reports by date range:", error);
    return [];
  }
}

/**
 * Search archived reports
 * @param {string} searchTerm - Search term
 * @param {string} barangay - Filter by barangay (optional)
 * @returns {Array} Array of matching archived reports
 */
export async function searchArchivedReports(searchTerm, barangay = null) {
  try {
    const allArchived = await getArchivedReports(barangay);
    
    if (!searchTerm) return allArchived;
    
    const searchLower = searchTerm.toLowerCase();
    
    return allArchived.filter(report => {
      const searchableFields = [
        report.originalId?.toString(),
        report.Title,
        report.IncidentType,
        report.Description,
        report.Barangay,
        report.SubmittedBy,
        report.deletedBy,
        report.deletionReason
      ];
      
      return searchableFields.some(field => 
        field?.toString().toLowerCase().includes(searchLower)
      );
    });
  } catch (error) {
    console.error("Error searching archived reports:", error);
    return [];
  }
}

/**
 * Get archive statistics
 * @param {string} barangay - Filter by barangay (optional)
 * @returns {Object} Archive statistics
 */
export async function getArchiveStatistics(barangay = null) {
  try {
    const archivedReports = await getArchivedReports(barangay);
    
    const stats = {
      totalArchived: archivedReports.length,
      archivedThisMonth: 0,
      archivedThisWeek: 0,
      byCategory: {},
      byDeletedBy: {},
      recentArchives: archivedReports.slice(0, 5)
    };
    
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeek = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    archivedReports.forEach(report => {
      const archivedDate = report.archivedAt.toDate();
      
      // Count this month
      if (archivedDate >= thisMonth) {
        stats.archivedThisMonth++;
      }
      
      // Count this week
      if (archivedDate >= thisWeek) {
        stats.archivedThisWeek++;
      }
      
      // Count by category
      const category = report.IncidentType || 'Unknown';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      
      // Count by deleted by
      const deletedBy = report.deletedBy || 'Unknown';
      stats.byDeletedBy[deletedBy] = (stats.byDeletedBy[deletedBy] || 0) + 1;
    });
    
    return stats;
  } catch (error) {
    console.error("Error getting archive statistics:", error);
    return {
      totalArchived: 0,
      archivedThisMonth: 0,
      archivedThisWeek: 0,
      byCategory: {},
      byDeletedBy: {},
      recentArchives: []
    };
  }
}

/**
 * Format archived report for display
 * @param {Object} archivedReport - Archived report data
 * @returns {Object} Formatted report data
 */
export function formatArchivedReportForDisplay(archivedReport) {
  if (!archivedReport) return null;
  
  const originalDateTime = archivedReport.DateTime;
  const archivedAt = archivedReport.archivedAt;
  
  let formattedDateTime = "Unknown date/time";
  let formattedArchivedDate = "Unknown archive date";
  
  try {
    if (originalDateTime) {
      const dateObj = originalDateTime.toDate ? originalDateTime.toDate() : new Date(originalDateTime);
      formattedDateTime = `${dateObj.toLocaleDateString()} at ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    if (archivedAt) {
      const archiveDate = archivedAt.toDate ? archivedAt.toDate() : new Date(archivedAt);
      formattedArchivedDate = archiveDate.toLocaleDateString();
    }
  } catch (error) {
    console.error("Error formatting archived report dates:", error);
  }
  
  return {
    id: archivedReport.id,
    originalId: archivedReport.originalId,
    title: archivedReport.Title || "Untitled Report",
    category: archivedReport.IncidentType || "Unknown",
    description: archivedReport.Description || "No description",
    location: archivedReport.Barangay || "Unknown location",
    submittedBy: archivedReport.SubmittedBy || "Unknown user",
    status: archivedReport.Status || "Unknown",
    dateTime: formattedDateTime,
    archivedDate: formattedArchivedDate,
    deletedBy: archivedReport.deletedBy || "Unknown admin",
    deletionReason: archivedReport.deletionReason || "No reason provided",
    isArchived: true,
    originalReport: archivedReport // Include full original data
  };
}
/**
 * Recover an archived report back to active reports
 * @param {string} archiveId - ID of the archived report
 * @param {Object} archivedReportData - The archived report data
 * @returns {Promise<string>} - ID of the recovered report
 */
export async function recoverArchivedReport(archiveId, archivedReportData) {
  try {
    console.log(' Recovering archived report:', archiveId);
    
    // Prepare report data for recovery
    const recoveredReportData = { ...archivedReportData };
    
    // Remove archive-specific fields
    delete recoveredReportData.id;
    delete recoveredReportData.archivedAt;
    delete recoveredReportData.deletedBy;
    delete recoveredReportData.deletionReason;
    delete recoveredReportData.isArchived;
    delete recoveredReportData.archiveVersion;
    delete recoveredReportData.originalId;
    
    // Set status back to Pending if it was deleted
    if (!recoveredReportData.Status || recoveredReportData.Status === 'Deleted') {
      recoveredReportData.Status = 'Pending';
    }
    
    // Add recovery metadata
    recoveredReportData.recoveredAt = Timestamp.now();
    recoveredReportData.wasRecovered = true;
    
    // Add back to reports collection
    const docRef = await addDoc(collection(db, 'reports'), recoveredReportData);
    console.log(' Report recovered with new ID:', docRef.id);
    
    // Delete from archive
    await deleteDoc(doc(db, ARCHIVE_CONSTANTS.COLLECTION_NAMES.ARCHIVED_REPORTS, archiveId));
    console.log(' Removed from archive:', archiveId);
    
    return docRef.id;
  } catch (error) {
    console.error(' Error recovering archived report:', error);
    throw error;
  }
}
