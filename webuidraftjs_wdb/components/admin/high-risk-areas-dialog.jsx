"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MapPin } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import dynamic from 'next/dynamic';
import { getMapCoordinatesForBarangay } from "@/lib/userMapping";

const MapComponent = dynamic(() => import('./map-component'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div>
});

export const HighRiskAreasDialog = ({ open, onOpenChange, userBarangay }) => {
  const [highRiskAreas, setHighRiskAreas] = useState([]);
  const [mapIncidents, setMapIncidents] = useState([]);
  const [clusterCenter, setClusterCenter] = useState(null);

  // Handle keyboard events for closing the modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setHighRiskAreas([]);
      setMapIncidents([]);
      setClusterCenter(null);
      return;
    }

    const fetchHighRiskAreas = async () => {
      const querySnapshot = await getDocs(collection(db, "reports"));
      const locationData = {}; 
      const incidents = []; 
      let unknownCount = 0;
      let totalProcessed = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();

        if (totalProcessed < 3) {
          console.log(`🔍 Document ${totalProcessed + 1} data:`, {
            id: doc.id,
            Latitude: data.Latitude,
            Longitude: data.Longitude,
            Status: data.Status,
            IncidentType: data.IncidentType,
            Barangay: data.Barangay || data.barangay || data.Location || data.location
          });
        }

        let barangay = data.Barangay || data.barangay || data.Location || data.location;

        if (barangay && typeof barangay === 'string') {
          barangay = barangay.trim();
          
          if (barangay.toLowerCase().includes('bulihan')) barangay = 'Bulihan';
          else if (barangay.toLowerCase().includes('mojon')) barangay = 'Mojon';
          else if (barangay.toLowerCase().includes('dakila')) barangay = 'Dakila';
          else if (barangay.toLowerCase().includes('pinagbakahan')) barangay = 'Pinagbakahan';
          else if (barangay.toLowerCase().includes('look')) barangay = 'Look 1st';
        }

        if (!barangay || barangay === '' || barangay.toLowerCase() === 'unknown') {
          
          const email = data.SubmittedByEmail || '';
          if (email.includes('bulihan')) barangay = 'Bulihan';
          else if (email.includes('mojon')) barangay = 'Mojon';
          else if (email.includes('dakila')) barangay = 'Dakila';
          else if (email.includes('pinagbakahan')) barangay = 'Pinagbakahan';
          else if (email.includes('look')) barangay = 'Look 1st';
          else {
            unknownCount++;
            barangay = 'Unknown'; 
          }
        }

        if (userBarangay && barangay !== userBarangay) {
          return;
        }
        
        totalProcessed++;
        
        if (!locationData[barangay]) {
          locationData[barangay] = {
            name: barangay,
            totalIncidents: 0,
            highSeverityIncidents: 0,
            incidentTypes: {},
            riskScore: 0
          };
        }
        
        locationData[barangay].totalIncidents++;

        const incidentType = (data.IncidentType || "").toLowerCase();
        if (incidentType.includes("robbery") || incidentType.includes("assault") || 
            incidentType.includes("violence") || incidentType.includes("murder") ||
            incidentType.includes("kidnap") || incidentType.includes("rape")) {
          locationData[barangay].highSeverityIncidents++;
        }

        const type = data.IncidentType || "Other";
        locationData[barangay].incidentTypes[type] = (locationData[barangay].incidentTypes[type] || 0) + 1;

        if (data.Latitude && data.Longitude && 
            typeof data.Latitude === 'number' && typeof data.Longitude === 'number' &&
            !isNaN(data.Latitude) && !isNaN(data.Longitude) &&
            data.Latitude !== 0 && data.Longitude !== 0) {

          const isVerified = data.Status === 'verified' || 
                           data.status === 'verified' || 
                           data.Status === 'Verified' ||
                           data.status === 'Verified' ||
                           !data.Status || 
                           data.Status === '';
          
          if (isVerified) {
            
            let riskLevel = 'low';
            if (incidentType.includes("robbery") || incidentType.includes("assault") || 
                incidentType.includes("violence") || incidentType.includes("murder") ||
                incidentType.includes("kidnap") || incidentType.includes("rape")) {
              riskLevel = 'high';
            } else if (incidentType.includes("theft") || incidentType.includes("vandalism") || 
                       incidentType.includes("burglary")) {
              riskLevel = 'medium';
            }
            
            incidents.push({
              id: doc.id,
              Latitude: parseFloat(data.Latitude),
              Longitude: parseFloat(data.Longitude),
              IncidentType: data.IncidentType || "Other",
              Description: data.Description || "No description available",
              DateTime: data.DateReported || data.createdAt || new Date().toISOString(),
              Barangay: barangay,
              Status: data.Status || data.status || 'verified',
              riskLevel: riskLevel
            });
          }
        }
      });

      const highRiskAreas = Object.values(locationData)
        .map(area => {

          const frequencyScore = Math.min(Math.log2(area.totalIncidents + 1) * 8, 35); 
          const severityScore = area.highSeverityIncidents * 25; 
          const diversityScore = Math.min(Object.keys(area.incidentTypes).length * 4, 20); 

          const populationFactor = 1.0; 
          
          area.riskScore = Math.round((frequencyScore + severityScore + diversityScore) * populationFactor);
          area.riskScore = Math.min(area.riskScore, 100); 

          if (area.riskScore >= 70) area.riskLevel = "High";
          else if (area.riskScore >= 40) area.riskLevel = "Medium";
          else area.riskLevel = "Low";

          console.log(`📊 ${area.name} WCRA Score Breakdown:`, {
            frequency: Math.round(frequencyScore),
            severity: severityScore,
            diversity: Math.round(diversityScore),
            total: area.riskScore,
            incidents: area.totalIncidents,
            highSeverity: area.highSeverityIncidents,
            types: Object.keys(area.incidentTypes).length
          });
          
          return area;
        })
        .filter(area => area.riskScore >= 25) 
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 6); 

      console.log(`📊 ${userBarangay || 'All Areas'} Risk Analysis: ${totalProcessed} incidents analyzed, ${Object.keys(locationData).length} areas found, ${unknownCount} unknown entries`);
      console.log(`🗺️ Map Incidents: ${incidents.length} incidents with valid coordinates found for map display`);
      if (incidents.length > 0) {
        console.log(`📍 Sample incidents:`, incidents.slice(0, 3));
        console.log(`🎯 Coordinate ranges:`, {
          latRange: [Math.min(...incidents.map(i => i.Latitude)), Math.max(...incidents.map(i => i.Latitude))],
          lngRange: [Math.min(...incidents.map(i => i.Longitude)), Math.max(...incidents.map(i => i.Longitude))]
        });
        
        // Calculate center of incidents for map centering
        const centerLat = incidents.reduce((sum, i) => sum + i.Latitude, 0) / incidents.length;
        const centerLng = incidents.reduce((sum, i) => sum + i.Longitude, 0) / incidents.length;
        setClusterCenter([centerLat, centerLng]);
      } else {
        console.log(`⚠️ No incidents with valid coordinates found for map display`);
        setClusterCenter(null);
      }
      
      setHighRiskAreas(highRiskAreas);
      setMapIncidents(incidents);
    };

    fetchHighRiskAreas();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-none w-full h-full p-0 bg-transparent border-none shadow-none flex items-center justify-center overflow-y-auto"
        onEscapeKeyDown={() => onOpenChange(false)}
      >
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => onOpenChange(false)} />
        <div 
          className="w-full h-full flex items-center justify-center p-4 relative z-10"
          onClick={() => onOpenChange(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-lg w-full max-w-6xl overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold w-6 h-6 flex items-center justify-center z-10 bg-transparent border-0 outline-0 focus:outline-0 shadow-none"
              style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
              onClick={() => onOpenChange(false)}
            >
              ×
            </button>
            
            {/* Header */}
            <div className="flex items-center px-8 pt-8 pb-2">
              <div className="flex items-center gap-3">
                <MapPin className="text-red-600 w-8 h-8" />
                <div>
                  <div className="text-3xl font-bold leading-tight">High Risk Areas</div>
                  <div className="text-gray-400 text-base mt-1">
                    Areas identified as high risk based on incident analysis
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-8 py-8">
            {/* Map Section */}
            <div className="bg-white rounded-xl border border-gray-200 relative overflow-hidden min-h-[420px]">
              <div className="w-full h-[420px]">
                <MapComponent 
                  key={`high-risk-map-${open ? 'open' : 'closed'}-${mapIncidents.length}`}
                  preloadedIncidents={mapIncidents}
                  showHotspots={false}
                  showClusters={true}
                  showOnlyTopCluster={true}
                  center={clusterCenter || (userBarangay ? getMapCoordinatesForBarangay(userBarangay)?.center : undefined)}
                  zoom={15}
                />
              </div>
            </div>

            {/* Risk Assessment Section */}
            <div className="bg-white rounded-xl p-6 flex flex-col shadow-sm border border-gray-100">
              <div className="font-bold text-2xl mb-6">Risk Assessment Criteria</div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-700">Incident frequency</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-700">Incident severity index</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-700">Proximity to incident hotspots</span>
                </div>
              </div>

              <div className="border-t pt-6 mt-6">
                <div className="font-bold text-2xl mb-6">Risk Level Thresholds</div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span className="text-gray-700 font-medium">High: &gt;75 Risk Score</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-700 font-medium">Medium: 40-75 Risk Score</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700 font-medium">Low: &lt;40 Risk Score</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
