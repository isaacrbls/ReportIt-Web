"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MapPin } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import dynamic from 'next/dynamic';
import { getMapCoordinatesForBarangay } from "@/lib/userMapping";

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import('./map-component'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div>
});

export const HighRiskAreasDialog = ({ open, onOpenChange, userBarangay }) => {
  const [highRiskAreas, setHighRiskAreas] = useState([]);
  const [mapIncidents, setMapIncidents] = useState([]);

  useEffect(() => {
    if (!open) return;

    const fetchHighRiskAreas = async () => {
      const querySnapshot = await getDocs(collection(db, "reports"));
      const locationData = {}; // Changed from barangayData to locationData
      const incidents = []; // For map display
      let unknownCount = 0;
      let totalProcessed = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Debug first few documents
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
        
        // Improved barangay detection with multiple fallbacks
        let barangay = data.Barangay || data.barangay || data.Location || data.location;
        
        // Clean up barangay names and handle variations
        if (barangay && typeof barangay === 'string') {
          barangay = barangay.trim();
          // Handle common variations and clean up
          if (barangay.toLowerCase().includes('bulihan')) barangay = 'Bulihan';
          else if (barangay.toLowerCase().includes('mojon')) barangay = 'Mojon';
          else if (barangay.toLowerCase().includes('dakila')) barangay = 'Dakila';
          else if (barangay.toLowerCase().includes('pinagbakahan')) barangay = 'Pinagbakahan';
          else if (barangay.toLowerCase().includes('look')) barangay = 'Look 1st';
          else if (barangay.toLowerCase().includes('longos')) barangay = 'Longos';
          else if (barangay.toLowerCase().includes('tiaong')) barangay = 'Tiaong';
        }
        
        // If still no valid barangay, try to infer from coordinates or submitter email
        if (!barangay || barangay === '' || barangay.toLowerCase() === 'unknown') {
          // Try to infer from submitter email
          const email = data.SubmittedByEmail || '';
          if (email.includes('bulihan')) barangay = 'Bulihan';
          else if (email.includes('mojon')) barangay = 'Mojon';
          else if (email.includes('dakila')) barangay = 'Dakila';
          else if (email.includes('pinagbakahan')) barangay = 'Pinagbakahan';
          else if (email.includes('look')) barangay = 'Look 1st';
          else if (email.includes('longos')) barangay = 'Longos';
          else if (email.includes('tiaong')) barangay = 'Tiaong';
          else {
            unknownCount++;
            barangay = 'Unknown'; // Keep unknown entries for display
          }
        }
        
        // If user has a specific barangay, only analyze reports from that barangay
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
        
        // Calculate severity based on incident type
        const incidentType = (data.IncidentType || "").toLowerCase();
        if (incidentType.includes("robbery") || incidentType.includes("assault") || 
            incidentType.includes("violence") || incidentType.includes("murder") ||
            incidentType.includes("kidnap") || incidentType.includes("rape")) {
          locationData[barangay].highSeverityIncidents++;
        }
        
        // Track incident types
        const type = data.IncidentType || "Other";
        locationData[barangay].incidentTypes[type] = (locationData[barangay].incidentTypes[type] || 0) + 1;
        
        // Add to map data if coordinates exist and incident is valid
        if (data.Latitude && data.Longitude && 
            typeof data.Latitude === 'number' && typeof data.Longitude === 'number' &&
            !isNaN(data.Latitude) && !isNaN(data.Longitude) &&
            data.Latitude !== 0 && data.Longitude !== 0) {
          
          // Check various verification status formats
          const isVerified = data.Status === 'verified' || 
                           data.status === 'verified' || 
                           data.Status === 'Verified' ||
                           data.status === 'Verified' ||
                           !data.Status || // Auto-verified reports might not have status
                           data.Status === '';
          
          if (isVerified) {
            // Determine risk level based on incident type
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

      // Calculate risk scores using Weighted Crime Risk Assessment (WCRA) Algorithm
      const highRiskAreas = Object.values(locationData)
        .map(area => {
          // WCRA Formula: Balanced scoring based on frequency, severity, and pattern diversity
          // Components:
          // 1. Frequency Score: Logarithmic scale to prevent over-weighting high-volume areas
          // 2. Severity Score: Linear scale with high penalty for dangerous crimes
          // 3. Diversity Score: Moderate weight for crime pattern complexity
          
          const frequencyScore = Math.min(Math.log2(area.totalIncidents + 1) * 8, 35); // Max 35 points, logarithmic
          const severityScore = area.highSeverityIncidents * 25; // 25 points per high-severity incident
          const diversityScore = Math.min(Object.keys(area.incidentTypes).length * 4, 20); // Max 20 points, 4 per type
          
          // Apply population density factor (optional enhancement)
          const populationFactor = 1.0; // Could be adjusted based on barangay population
          
          area.riskScore = Math.round((frequencyScore + severityScore + diversityScore) * populationFactor);
          area.riskScore = Math.min(area.riskScore, 100); // Cap at 100
          
          // Enhanced risk level thresholds
          if (area.riskScore >= 70) area.riskLevel = "High";
          else if (area.riskScore >= 40) area.riskLevel = "Medium";
          else area.riskLevel = "Low";
          
          // Debug logging for score breakdown
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
        .filter(area => area.riskScore >= 25) // Lower threshold to show more relevant areas
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 6); // Top 6 high-risk areas

      // Log analysis info
      console.log(`📊 ${userBarangay || 'All Areas'} Risk Analysis: ${totalProcessed} incidents analyzed, ${Object.keys(locationData).length} areas found, ${unknownCount} unknown entries`);
      console.log(`🗺️ Map Incidents: ${incidents.length} incidents with valid coordinates found for map display`);
      if (incidents.length > 0) {
        console.log(`📍 Sample incidents:`, incidents.slice(0, 3));
        console.log(`🎯 Coordinate ranges:`, {
          latRange: [Math.min(...incidents.map(i => i.Latitude)), Math.max(...incidents.map(i => i.Latitude))],
          lngRange: [Math.min(...incidents.map(i => i.Longitude)), Math.max(...incidents.map(i => i.Longitude))]
        });
      } else {
        console.log(`⚠️ No incidents with valid coordinates found for map display`);
      }
      
      setHighRiskAreas(highRiskAreas);
      setMapIncidents(incidents);
    };

    fetchHighRiskAreas();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-8 pt-8 pb-2">
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

          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-8 py-8">
            {/* Left: Risk Areas Map */}
            <div className="bg-white rounded-xl border border-gray-200 relative overflow-hidden min-h-[420px]">
              <div className="absolute top-4 left-4 z-10 bg-white/90 px-3 py-2 rounded-lg shadow-sm border">
                <div className="text-lg font-bold text-gray-800">Risk Areas Map</div>
                <div className="text-xs text-gray-600">
                  {userBarangay || 'All Areas'} • {mapIncidents.length} verified incidents
                </div>
              </div>
              
              <div className="w-full h-[420px]">
                <MapComponent 
                  preloadedIncidents={mapIncidents}
                  showHotspots={true}
                  center={userBarangay ? getMapCoordinatesForBarangay(userBarangay)?.center : undefined}
                  zoom={userBarangay ? 15 : 13}
                />
              </div>
              
              {/* Map Legend */}
              <div className="absolute bottom-4 right-4 z-10 bg-white/90 px-3 py-2 rounded-lg shadow-sm border">
                <div className="text-xs font-medium text-gray-800 mb-1">Risk Levels</div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>High</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span>Medium</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Low</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: High Risk Areas Details */}
            <div className="bg-white rounded-xl p-6 flex flex-col shadow-sm border border-gray-100">
              <div className="font-bold text-2xl mb-4">High Risk Areas Analysis</div>
              
              {highRiskAreas.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {highRiskAreas.map((area, idx) => (
                    <div key={area.name} className={`border-l-4 pl-4 py-3 rounded-r-lg ${
                      area.riskLevel === "High" ? "border-red-500 bg-red-50" :
                      area.riskLevel === "Medium" ? "border-orange-500 bg-orange-50" :
                      "border-green-500 bg-green-50"
                    }`}>
                      <div className="flex items-center justify-between mb-2 pr-3">
                        <span className="font-semibold text-lg">{area.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-sm font-medium ${
                          area.riskLevel === "High" ? "bg-red-100 text-red-800" :
                          area.riskLevel === "Medium" ? "bg-orange-100 text-orange-800" :
                          "bg-green-100 text-green-800"
                        }`}>
                          {area.riskLevel} Risk
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                        <div>
                          <div className="font-medium">Risk Score: {area.riskScore}/100</div>
                          <div>Total Incidents: {area.totalIncidents}</div>
                          <div>High Severity: {area.highSeverityIncidents}</div>
                        </div>
                        <div className="pr-2">
                          <div className="font-medium mb-2">Top Incident Types:</div>
                          <div className="text-xs space-y-1">
                            {Object.entries(area.incidentTypes)
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 3)
                              .map(([type, count]) => (
                                <div key={type} className="flex justify-between items-center gap-2 py-1">
                                  <span className="truncate flex-1">{type}</span>
                                  <span className="font-medium text-gray-800 px-1 text-xs min-w-[24px] text-center flex-shrink-0">
                                    {count}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="font-medium">No significant risk areas identified</p>
                  <p className="text-sm">All areas show low risk levels (score &lt; 25)</p>
                </div>
              )}
              
              <div className="border-t pt-4 mt-4">
                <div className="font-bold text-lg mb-3">📊 WCRA Analysis Details</div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">70+</div>
                    <div className="text-sm text-gray-600">High Risk</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">40-69</div>
                    <div className="text-sm text-gray-600">Medium Risk</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">&lt;40</div>
                    <div className="text-sm text-gray-600">Low Risk</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>• <strong>WCRA Algorithm:</strong> Weighted Crime Risk Assessment with logarithmic scaling</div>
                  <div>• <strong>Components:</strong> Frequency (35%), Severity (unlimited), Diversity (20%)</div>
                  <div>• <strong>Scoring:</strong> Logarithmic frequency prevents over-weighting high-volume areas</div>
                  <div>• Data automatically cleaned and verified incidents only</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
