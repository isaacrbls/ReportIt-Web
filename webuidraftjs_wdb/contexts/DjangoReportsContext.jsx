import React, { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/hooks/use-django-auth';

const ReportsContext = createContext();

export const useReports = () => {
  const context = useContext(ReportsContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportsProvider');
  }
  return context;
};

export const ReportsProvider = ({ children }) => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch reports
  const fetchReports = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getReports(filters);
      setReports(data.results || data); // Handle pagination if implemented
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const data = await apiClient.getCategories();
      setCategories(data.results || data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  // Create report
  const createReport = async (reportData) => {
    try {
      const newReport = await apiClient.createReport(reportData);
      setReports(prev => [newReport, ...prev]);
      return newReport;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update report
  const updateReport = async (id, updates) => {
    try {
      const updatedReport = await apiClient.updateReport(id, updates);
      setReports(prev => 
        prev.map(report => report.id === id ? updatedReport : report)
      );
      return updatedReport;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Delete report
  const deleteReport = async (id) => {
    try {
      await apiClient.deleteReport(id);
      setReports(prev => prev.filter(report => report.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Verify report
  const verifyReport = async (id, notes = '') => {
    try {
      await apiClient.verifyReport(id, notes);
      setReports(prev => 
        prev.map(report => 
          report.id === id 
            ? { ...report, status: 'Verified', verified_by: user?.id, verified_at: new Date() }
            : report
        )
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Reject report
  const rejectReport = async (id, notes = '') => {
    try {
      await apiClient.rejectReport(id, notes);
      setReports(prev => 
        prev.map(report => 
          report.id === id 
            ? { ...report, status: 'Rejected' }
            : report
        )
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update report status
  const updateReportStatus = async (id, status, notes = '') => {
    try {
      await apiClient.updateReportStatus(id, status, notes);
      setReports(prev => 
        prev.map(report => 
          report.id === id 
            ? { ...report, status }
            : report
        )
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Filter reports by various criteria
  const filterReports = (filters) => {
    return reports.filter(report => {
      if (filters.status && report.status !== filters.status) return false;
      if (filters.barangay && !report.barangay.toLowerCase().includes(filters.barangay.toLowerCase())) return false;
      if (filters.incident_type && !report.incident_type.toLowerCase().includes(filters.incident_type.toLowerCase())) return false;
      if (filters.dateFrom && new Date(report.created_at) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(report.created_at) > new Date(filters.dateTo)) return false;
      return true;
    });
  };

  // Get reports for map display (convert to Firebase-like format for compatibility)
  const getMapReports = () => {
    return reports.map(report => ({
      id: report.id.toString(),
      IncidentType: report.incident_type,
      Title: report.title || report.incident_type,
      Description: report.description,
      Barangay: report.barangay,
      Latitude: report.latitude,
      Longitude: report.longitude,
      Status: report.status,
      DateTime: report.created_at,
      MediaURL: report.media || report.media_url,
      MediaType: report.media_type,
      SubmittedByEmail: report.submitted_by_email,
      isSensitive: report.is_sensitive,
      hasMedia: report.has_media,
    }));
  };

  // Initialize data when user changes
  useEffect(() => {
    if (user) {
      fetchReports();
      fetchCategories();
    } else {
      setReports([]);
      setCategories([]);
    }
  }, [user]);

  const value = {
    reports,
    categories,
    loading,
    error,
    setError,
    fetchReports,
    fetchCategories,
    createReport,
    updateReport,
    deleteReport,
    verifyReport,
    rejectReport,
    updateReportStatus,
    filterReports,
    getMapReports,
  };

  return (
    <ReportsContext.Provider value={value}>
      {children}
    </ReportsContext.Provider>
  );
};

export default ReportsProvider;