"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import { calculateHotspotsFromReports } from '@/lib/hotspotUtils';

const ReportsContext = createContext();

export const useReports = () => {
  const context = useContext(ReportsContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportsProvider');
  }
  return context;
};

export const ReportsProvider = ({ children }) => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hotspotsCache, setHotspotsCache] = useState(new Map());
  const [refreshTrigger, setRefreshTrigger] = useState(0); 

  useEffect(() => {
    console.log('🔄 ReportsProvider: Setting up Firebase listener');
    setIsLoading(true);

    const q = query(collection(db, "reports"), orderBy("DateTime", "desc"));

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        try {
          const reportsData = snapshot.docs.map((doc) => ({ 
            id: doc.id, 
            ...doc.data() 
          }));
          
          console.log('📊 ReportsProvider: Fetched reports:', reportsData.length);
          
          // Log barangay distribution for debugging
          if (reportsData.length > 0) {
            const barangayCounts = {};
            reportsData.forEach(r => {
              const barangay = r.Barangay || 'Unknown';
              barangayCounts[barangay] = (barangayCounts[barangay] || 0) + 1;
            });
            console.log('📍 Reports by Barangay:', barangayCounts);
          }
          
          setReports(reportsData);
          setError(null);
        } catch (err) {
          console.error('❌ ReportsProvider: Error processing reports:', err);
          setError(err);
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.error('❌ ReportsProvider: Firebase listener error:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => {
      console.log('🧹 ReportsProvider: Cleaning up Firebase listener');
      unsubscribe();
    };
  }, []);

  /**
   * Calculate hotspots based on the ReportIt Mobile algorithm
   * @param {string} targetBarangay - Optional barangay filter (null = all barangays)
   * @param {number} daysWindow - Number of days to look back (default: 30)
   * @returns {Array} Array of hotspot objects
   */
  const calculateHotspots = useCallback((targetBarangay = null, daysWindow = 30) => {
    // Create cache key
    const cacheKey = `${targetBarangay || 'all'}_${daysWindow}_${reports.length}_${reports.filter(r => r.Status === "Verified").length}`;
    if (hotspotsCache.has(cacheKey)) {
      console.log('🔥 Using cached hotspots for', targetBarangay || 'all barangays');
      return hotspotsCache.get(cacheKey);
    }

    // Use utility function for calculation
    const calculatedHotspots = calculateHotspotsFromReports(reports, {
      targetBarangay,
      daysWindow
    });

    // Cache the results
    setHotspotsCache(prevCache => {
      const newCache = new Map(prevCache);
      newCache.set(cacheKey, calculatedHotspots);
      
      // Keep cache size manageable (max 10 entries)
      if (newCache.size > 10) {
        const firstKey = newCache.keys().next().value;
        newCache.delete(firstKey);
      }
      return newCache;
    });
    
    return calculatedHotspots;
  }, [reports, hotspotsCache]);

  /**
   * Legacy method for backward compatibility
   * Calculates hotspots for a specific barangay
   */
  const calculateBarangayHotspots = useCallback((targetBarangay) => {
    if (!targetBarangay) return [];
    return calculateHotspots(targetBarangay, 30);
  }, [calculateHotspots]);

  const getReportsByBarangay = (barangay) => {
    if (!barangay || barangay === 'All') return reports;
    
    // Case-insensitive comparison since Realtime DB might have "mojon" and Firestore might have "Mojon"
    const barangayLower = barangay.toLowerCase();
    const filtered = reports.filter(r => {
      if (!r.Barangay) return false;
      return r.Barangay.toLowerCase() === barangayLower;
    });
    
    console.log(`📍 getReportsByBarangay: Filtering for "${barangay}" - Found ${filtered.length} reports out of ${reports.length} total`);
    return filtered;
  };

  const getVerifiedReports = (barangay = null) => {
    const filtered = barangay ? getReportsByBarangay(barangay) : reports;
    return filtered.filter(r => r.Status === "Verified");
  };

  const getPendingReports = (barangay = null) => {
    const filtered = barangay ? getReportsByBarangay(barangay) : reports;
    return filtered.filter(r => (r.Status ?? "").toLowerCase() === "pending");
  };

  const refreshData = useCallback(() => {
    console.log('🔄 Manual refresh triggered');
    setRefreshTrigger(prev => prev + 1);
    // Clear cache to force recalculation
    setHotspotsCache(new Map());
  }, []);

  const value = {
    // Reports data
    reports,
    isLoading,
    error,

    // Hotspot calculation methods
    calculateHotspots,
    calculateBarangayHotspots,
    
    // Report filtering methods
    getReportsByBarangay,
    getVerifiedReports,
    getPendingReports,
    refreshData,

    // Aggregate counts
    totalReports: reports.length,
    verifiedReportsCount: reports.filter(r => r.Status === "Verified").length,
    pendingReportsCount: reports.filter(r => (r.Status ?? "").toLowerCase() === "pending").length,
  };

  return (
    <ReportsContext.Provider value={value}>
      {children}
    </ReportsContext.Provider>
  );
};