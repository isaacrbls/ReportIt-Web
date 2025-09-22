"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';

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

  const calculateBarangayHotspots = (targetBarangay) => {
    if (!targetBarangay || !reports.length) return [];

    const cacheKey = `${targetBarangay}_${reports.length}_${reports.filter(r => r.Status === "Verified").length}`;
    if (hotspotsCache.has(cacheKey)) {
      console.log('🔥 ReportsProvider: Using cached hotspots for', targetBarangay);
      return hotspotsCache.get(cacheKey);
    }
    
    const barangayReports = reports.filter(r => r.Barangay === targetBarangay && r.Status === "Verified");

    const gridSize = 0.001; 
    const locations = {};
    
    barangayReports.forEach(report => {
      if (report.Latitude && report.Longitude) {
        
        const gridLat = Math.floor(report.Latitude / gridSize) * gridSize;
        const gridLng = Math.floor(report.Longitude / gridSize) * gridSize;
        const key = `${gridLat.toFixed(3)}_${gridLng.toFixed(3)}`;
        
        if (!locations[key]) {
          locations[key] = {
            lat: gridLat + (gridSize / 2), 
            lng: gridLng + (gridSize / 2),
            incidents: [],
            count: 0
          };
        }
        
        locations[key].incidents.push(report);
        locations[key].count++;
      }
    });

    const hotspotThreshold = 2; 
    const calculatedHotspots = Object.values(locations)
      .filter(location => location.count >= hotspotThreshold)
      .map(location => ({
        lat: location.lat,
        lng: location.lng,
        incidentCount: location.count,
        riskLevel: location.count >= 5 ? 'high' : location.count >= 3 ? 'medium' : 'low',
        incidents: location.incidents,
        
        radius: Math.max(50, Math.min(Math.sqrt(location.count) * 60, 150)) 
      }))
      .sort((a, b) => b.incidentCount - a.incidentCount); 

    console.log('🔥 ReportsProvider: Calculated hotspots for', targetBarangay, ':', calculatedHotspots.length);

    setHotspotsCache(prevCache => {
      const newCache = new Map(prevCache);
      newCache.set(cacheKey, calculatedHotspots);
      
      if (newCache.size > 10) {
        const firstKey = newCache.keys().next().value;
        newCache.delete(firstKey);
      }
      return newCache;
    });
    
    return calculatedHotspots;
  };

  const getReportsByBarangay = (barangay) => {
    if (!barangay || barangay === 'All') return reports;
    return reports.filter(r => r.Barangay === barangay);
  };

  const getVerifiedReports = (barangay = null) => {
    const filtered = barangay ? getReportsByBarangay(barangay) : reports;
    return filtered.filter(r => r.Status === "Verified");
  };

  const getPendingReports = (barangay = null) => {
    const filtered = barangay ? getReportsByBarangay(barangay) : reports;
    return filtered.filter(r => (r.Status ?? "").toLowerCase() === "pending");
  };

  const value = {
    
    reports,
    isLoading,
    error,

    calculateBarangayHotspots,
    getReportsByBarangay,
    getVerifiedReports,
    getPendingReports,

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