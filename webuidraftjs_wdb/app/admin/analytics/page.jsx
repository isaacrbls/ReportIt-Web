"use client";

import Link from "next/link";
import { LayoutDashboard, BarChart2, FileText, LogOut, ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react";
import { CrimeDistributionChart } from "@/components/admin/crime-distribution-chart";
import { Button } from "@/components/ui/button";
import React from "react";
import Image from "next/image";
import LogoutConfirmationModal from "@/components/admin/LogoutConfirmationModal";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { db } from "../../../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useCurrentUser } from "../../../hooks/use-current-user";

export default function AnalyticsPage() {
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [hotspots, setHotspots] = React.useState([]);
  const [reports, setReports] = React.useState([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const hotspotsPerPage = 5; // Show 5 hotspots per page
  const router = useRouter();
  const { user } = useCurrentUser(); // Fix: remove destructuring

  // User-barangay mapping (same as admin Dashboard)
  const userBarangayMap = {
    "testpinagbakahan@example.com": "Pinagbakahan",
    "testbulihan@example.com": "Bulihan",
    "testtiaong@example.com": "Tiaong",
    "testdakila@example.com": "Dakila",
    "testmojon@example.com": "Mojon",
    "testlook@example.com": "Look 1st",
    "testlongos@example.com": "Longos",
    // Add admin fallback
    'test@example.com': 'All'
  };

  // Calculate hotspots function for specific barangay
  const calculateBarangayHotspots = (reports, barangay) => {
    if (!reports || reports.length === 0) return [];
    
    console.log("Analytics - Calculating hotspots for barangay:", barangay);
    console.log("Analytics - Total reports:", reports.length);
    
    // Filter reports by barangay (unless admin viewing all)
    const filteredReports = barangay === 'All' ? reports : reports.filter(r => r.Barangay === barangay);
    console.log("Analytics - Filtered reports for", barangay + ":", filteredReports.length);
    
    // Filter for recent reports (last 30 days) to identify truly "emerging" hotspots
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentReports = filteredReports.filter(report => {
      if (!report.DateTime) return false;
      const reportDate = new Date(report.DateTime);
      return reportDate >= thirtyDaysAgo;
    });
    
    console.log("Analytics - Recent reports (last 30 days):", recentReports.length);
    
    // Standardized grid calculation (same as ReportsPageClient.jsx)
    const gridSize = 0.002; // ~200m grid cells
    const locations = {};
    
    recentReports.forEach(report => {
      if (report.Latitude && report.Longitude) {
        // Create grid key for grouping nearby incidents (standardized method)
        const gridLat = Math.floor(report.Latitude / gridSize) * gridSize;
        const gridLng = Math.floor(report.Longitude / gridSize) * gridSize;
        const key = `${gridLat.toFixed(3)}_${gridLng.toFixed(3)}`;
        
        if (!locations[key]) {
          locations[key] = {
            lat: gridLat + (gridSize / 2), // Center of grid cell
            lng: gridLng + (gridSize / 2),
            incidents: [],
            count: 0,
            gridKey: key
          };
        }
        
        locations[key].incidents.push(report);
        locations[key].count++;
      }
    });
    
    // Find hotspots (cells with 2+ incidents) 
    const hotspotThreshold = 2;
    const hotspots = Object.values(locations)
      .filter(location => location.count >= hotspotThreshold)
      .map(location => {
        // Determine most common incident type
        const incidentTypes = {};
        location.incidents.forEach(inc => {
          incidentTypes[inc.IncidentType] = (incidentTypes[inc.IncidentType] || 0) + 1;
        });
        const mostCommonType = Object.keys(incidentTypes).reduce((a, b) => 
          incidentTypes[a] > incidentTypes[b] ? a : b
        );
        
        // Determine risk level based on incident count (standardized)
        let riskLevel = 'Low';
        if (location.count >= 5) riskLevel = 'High';
        else if (location.count >= 3) riskLevel = 'Medium';
        else riskLevel = 'Low'; // 2 incidents
        
        // Create meaningful area name instead of generic grid
        const areaName = `${barangay} Area (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`;
        
        return {
          id: location.gridKey,
          latitude: location.lat,
          longitude: location.lng,
          incidentCount: location.count,
          incidentType: mostCommonType,
          riskLevel: riskLevel,
          area: areaName,
          incidents: location.incidents
        };
      })
    
    console.log("Analytics - Found hotspots:", hotspots);
    return hotspots.sort((a, b) => b.incidentCount - a.incidentCount);
  };

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "reports"), (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log("Analytics - Fetched reports:", reportsData.length);
      setReports(reportsData);
      
      // Get user's barangay
      const userEmail = user?.email;
      const barangay = userBarangayMap[userEmail] || 'Unknown';
      console.log("Analytics - User object:", user);
      console.log("Analytics - User email:", userEmail, "Barangay:", barangay);
      
      if (!userEmail) {
        console.log("Analytics - No user email, skipping hotspot calculation");
        return;
      }
      
      // Calculate hotspots for user's barangay
      const calculatedHotspots = calculateBarangayHotspots(reportsData, barangay);
      console.log("Analytics - Calculated hotspots:", calculatedHotspots);
      setHotspots(calculatedHotspots);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push("/"); 
  };

  // Pagination calculations
  const totalHotspots = hotspots.length;
  const totalPages = Math.ceil(totalHotspots / hotspotsPerPage);
  const startIndex = (currentPage - 1) * hotspotsPerPage;
  const endIndex = Math.min(startIndex + hotspotsPerPage, totalHotspots);
  const currentHotspots = hotspots.slice(startIndex, endIndex);

  // Reset to first page when hotspots change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [hotspots]);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    
      <div className="flex min-h-screen bg-white">
        {/* Sidebar */}
        <Sidebar onLogout={() => setShowLogoutModal(true)} />
        {/* Main Content */}
        <main className="flex-1 ml-64 p-10 bg-white min-h-screen">
          <h1 className="text-3xl font-bold text-red-600 mb-8">Analytics</h1>
          {/* Incident Type Distribution Card */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm mb-6">
            <h2 className="text-2xl font-bold text-red-500 mb-1">Incident Type Distribution</h2>
            <p className="text-gray-400 mb-4">Breakdown of incident types</p>
            <div className="flex justify-center items-center">
              <div className="w-full max-w-md">
                <CrimeDistributionChart />
              </div>
            </div>
          </div>
          {/* Emerging Hotspots Card */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-red-500 mb-1">Emerging Hotspots</h2>
            <p className="text-gray-400 mb-4">Based on the recent and spatial analysis.</p>
            
            {/* Pagination Info */}
            {totalHotspots > hotspotsPerPage && (
              <div className="flex justify-between items-center text-sm text-gray-600 px-1 mb-4">
                <span>
                  Showing {startIndex + 1}-{endIndex} of {totalHotspots} hotspots
                </span>
                {totalPages > 1 && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    Page {currentPage} of {totalPages}
                  </span>
                )}
              </div>
            )}
            
            {currentHotspots.length > 0 ? (
              <>
                <div className="space-y-4">
                  {currentHotspots.map((hotspot, index) => (
                    <div key={hotspot.id} className="bg-white rounded-xl border p-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-red-600 text-lg">
                          {hotspot.area} - {hotspot.incidentCount} incidents
                        </span>
                        <span className={`px-4 py-1 rounded-full font-semibold text-sm border ${
                          hotspot.riskLevel === 'High' 
                            ? 'bg-red-100 text-red-600 border-red-200'
                            : hotspot.riskLevel === 'Medium'
                            ? 'bg-orange-100 text-orange-600 border-orange-200'
                            : 'bg-yellow-100 text-yellow-600 border-yellow-200'
                        }`}>
                          {hotspot.riskLevel} Risk
                        </span>
                      </div>
                      <div className="text-gray-700 text-base">
                        Type of incident: <span className="font-semibold">{hotspot.incidentType}</span>
                      </div>
                      <div className="text-gray-600 text-sm">
                        Location: {hotspot.latitude.toFixed(6)}, {hotspot.longitude.toFixed(6)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-8 pt-6 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      {/* Previous Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 px-3"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Previous</span>
                      </Button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
                          // Show first page, last page, current page, and adjacent pages
                          const showPage = 
                            pageNumber === 1 || 
                            pageNumber === totalPages || 
                            Math.abs(pageNumber - currentPage) <= 1;

                          if (!showPage) {
                            // Show ellipsis for gaps
                            if (pageNumber === 2 && currentPage > 4) {
                              return <span key={pageNumber} className="text-gray-400">...</span>;
                            }
                            if (pageNumber === totalPages - 1 && currentPage < totalPages - 3) {
                              return <span key={pageNumber} className="text-gray-400">...</span>;
                            }
                            return null;
                          }

                          return (
                            <Button
                              key={pageNumber}
                              variant={currentPage === pageNumber ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageClick(pageNumber)}
                              className={`w-9 h-9 p-0 ${
                                currentPage === pageNumber 
                                  ? "bg-red-500 text-white hover:bg-red-600 border-red-500" 
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              {pageNumber}
                            </Button>
                          );
                        })}
                      </div>

                      {/* Next Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 px-3 border-red-400 text-red-500 hover:bg-red-50"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Mobile-friendly pagination info */}
                {totalPages > 1 && (
                  <div className="text-center text-xs text-gray-500 mt-2">
                    Scroll up to see more hotspots on previous pages
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-50 rounded-xl border p-4 text-center text-gray-500">
                {totalHotspots === 0 
                  ? "No hotspots detected yet. Hotspots are identified when 2 or more incidents occur in the same area."
                  : "No hotspots found for the current page."
                }
              </div>
            )}
          </div>
        </main>
        <LogoutConfirmationModal
          open={showLogoutModal}
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      </div>
  );
}