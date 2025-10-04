import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, GeoPoint } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/firebase";
import apiClient from '@/lib/apiClient';
import { useCurrentUser } from '@/hooks/use-current-user';

const HybridReportsContext = createContext();

export const useHybridReports = () => {
  const context = useContext(HybridReportsContext);
  if (!context) {
    throw new Error('useHybridReports must be used within a HybridReportsProvider');
  }
  return context;
};

export const HybridReportsProvider = ({ children }) => {
  const { user } = useCurrentUser(); // Keep using Firebase auth
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useFirebase, setUseFirebase] = useState(true); // Toggle between Firebase and Django
  const [djangoStats, setDjangoStats] = useState(null);

  // Firebase: Real-time reports listener
  useEffect(() => {
    if (!useFirebase || !user) return;

    const unsubscribe = onSnapshot(collection(db, "reports"), (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReports(reportsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, useFirebase]);

  // Django: Fetch reports when not using Firebase
  const fetchDjangoReports = async (filters = {}) => {
    try {
      setLoading(true);
      const data = await apiClient.getReports(filters);
      setReports(data.results || data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch Django reports:', err);
    } finally {
      setLoading(false);
    }
  };

  // Django: Fetch analytics stats
  const fetchDjangoStats = async () => {
    try {
      const stats = await apiClient.getAnalyticsStats();
      setDjangoStats(stats);
      return stats;
    } catch (err) {
      console.error('Failed to fetch Django stats:', err);
      return null;
    }
  };

  // Hybrid: Create report (saves to both Firebase and Django if enabled)
  const createReport = async (reportData, enableDual = true) => {
    try {
      setError(null);
      
      // Always save to Firebase first (primary)
      let mediaUrl = null;
      let uploadedMediaType = null;

      // Handle file upload to Firebase Storage
      if (reportData.mediaFile) {
        const timestamp = Date.now();
        const extension = reportData.mediaFile.name?.split(".").pop() || "bin";
        const path = `reports/${timestamp}_${reportData.mediaType || "file"}.${extension}`;
        const storageRef = ref(storage, path);

        await uploadBytes(storageRef, reportData.mediaFile, { 
          contentType: reportData.mediaFile.type,
          customMetadata: {
            'uploadedBy': user?.email || 'unknown',
            'timestamp': timestamp.toString()
          }
        });
        
        mediaUrl = await getDownloadURL(storageRef);
        uploadedMediaType = reportData.mediaType || (reportData.mediaFile.type?.startsWith("video") ? "video" : "photo");
      }

      // Firebase payload
      const firebasePayload = {
        Title: reportData.title?.trim() || "",
        IncidentType: reportData.incidentType?.trim() || "",
        Description: reportData.description?.trim() || "",
        Barangay: reportData.barangay || "",
        Latitude: reportData.latitude,
        Longitude: reportData.longitude,
        GeoLocation: new GeoPoint(reportData.latitude, reportData.longitude),
        DateTime: reportData.useCustomTime && reportData.customDateTime 
          ? new Date(reportData.customDateTime) 
          : serverTimestamp(),
        Status: "Pending",
        hasMedia: !!mediaUrl,
        MediaType: uploadedMediaType,
        MediaURL: mediaUrl,
        SubmittedByEmail: user?.email || null,
        isSensitive: reportData.isSensitive || false,
      };

      // Save to Firebase
      const firebaseDoc = await addDoc(collection(db, "reports"), firebasePayload);

      // Also save to Django if dual mode is enabled
      if (enableDual) {
        try {
          const djangoPayload = new FormData();
          djangoPayload.append("title", reportData.title?.trim() || "");
          djangoPayload.append("incident_type", reportData.incidentType?.trim() || "");
          djangoPayload.append("description", reportData.description?.trim() || "");
          djangoPayload.append("barangay", reportData.barangay || "");
          djangoPayload.append("latitude", String(reportData.latitude));
          djangoPayload.append("longitude", String(reportData.longitude));
          djangoPayload.append("media_url", mediaUrl || "");
          djangoPayload.append("media_type", uploadedMediaType || "");
          djangoPayload.append("submitted_by_email", user?.email || "");
          djangoPayload.append("is_sensitive", reportData.isSensitive || false);
          
          if (reportData.mediaFile) {
            djangoPayload.append("media", reportData.mediaFile);
          }

          await apiClient.createReport(djangoPayload);
          console.log("✅ Report saved to both Firebase and Django");
        } catch (djangoError) {
          console.warn("⚠️ Failed to save to Django, but Firebase save succeeded:", djangoError);
        }
      }

      return { id: firebaseDoc.id, ...firebasePayload };
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Firebase: Update report
  const updateFirebaseReport = async (id, updates) => {
    try {
      const reportRef = doc(db, "reports", id);
      await updateDoc(reportRef, updates);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Firebase: Delete report
  const deleteFirebaseReport = async (id) => {
    try {
      await deleteDoc(doc(db, "reports", id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Django: Verify report via API
  const verifyReportViaDjango = async (firebaseId, notes = '') => {
    try {
      // This would need mapping between Firebase IDs and Django IDs
      // For now, just use Firebase update
      await updateFirebaseReport(firebaseId, {
        Status: 'Verified',
        VerifiedAt: serverTimestamp(),
        VerifiedBy: user?.email
      });
      console.log("✅ Report verified via Firebase");
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Utility: Convert Firebase reports to uniform format
  const getUniformReports = () => {
    return reports.map(report => ({
      id: report.id,
      title: report.Title || report.IncidentType,
      incident_type: report.IncidentType,
      description: report.Description,
      barangay: report.Barangay,
      latitude: report.Latitude,
      longitude: report.Longitude,
      media_url: report.MediaURL,
      media_type: report.MediaType,
      status: report.Status,
      submitted_by_email: report.SubmittedByEmail,
      is_sensitive: report.isSensitive,
      has_media: report.hasMedia,
      created_at: report.DateTime?.toDate?.() || report.DateTime,
      // Keep original Firebase format for compatibility
      firebase_data: report
    }));
  };

  // Hybrid analytics: Get stats from both sources
  const getHybridStats = async () => {
    const firebaseReports = getUniformReports();
    const firebaseStats = {
      total_reports: firebaseReports.length,
      pending_reports: firebaseReports.filter(r => r.status === 'Pending').length,
      verified_reports: firebaseReports.filter(r => r.status === 'Verified').length,
      resolved_reports: firebaseReports.filter(r => r.status === 'Resolved').length,
    };

    const djangoStats = await fetchDjangoStats();

    return {
      firebase: firebaseStats,
      django: djangoStats,
      combined: {
        total_reports: firebaseStats.total_reports + (djangoStats?.total_reports || 0),
        pending_reports: firebaseStats.pending_reports + (djangoStats?.pending_reports || 0),
        verified_reports: firebaseStats.verified_reports + (djangoStats?.verified_reports || 0),
        resolved_reports: firebaseStats.resolved_reports + (djangoStats?.resolved_reports || 0),
      }
    };
  };

  // Switch between Firebase and Django modes
  const toggleDataSource = (useFirebaseMode) => {
    setUseFirebase(useFirebaseMode);
    if (!useFirebaseMode) {
      fetchDjangoReports();
    }
  };

  const value = {
    reports,
    categories,
    loading,
    error,
    useFirebase,
    djangoStats,
    setError,
    
    // Firebase operations
    createReport,
    updateFirebaseReport,
    deleteFirebaseReport,
    verifyReportViaDjango,
    
    // Django operations
    fetchDjangoReports,
    fetchDjangoStats,
    
    // Hybrid operations
    getUniformReports,
    getHybridStats,
    toggleDataSource,
    
    // Utility methods
    filterReports: (filters) => {
      const uniformReports = getUniformReports();
      return uniformReports.filter(report => {
        if (filters.status && report.status !== filters.status) return false;
        if (filters.barangay && !report.barangay.toLowerCase().includes(filters.barangay.toLowerCase())) return false;
        if (filters.incident_type && !report.incident_type.toLowerCase().includes(filters.incident_type.toLowerCase())) return false;
        return true;
      });
    }
  };

  return (
    <HybridReportsContext.Provider value={value}>
      {children}
    </HybridReportsContext.Provider>
  );
};

export default HybridReportsProvider;