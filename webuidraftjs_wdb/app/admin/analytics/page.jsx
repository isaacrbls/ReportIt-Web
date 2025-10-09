"use client";

import Link from "next/link";
import { LayoutDashboard, BarChart2, FileText, LogOut, ShieldAlert, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { CrimeDistributionChart } from "@/components/admin/crime-distribution-chart";
import { IncidentTrendChart } from "@/components/admin/incident-trend-chart";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React from "react";
import Image from "next/image";
import LogoutConfirmationModal from "@/components/admin/LogoutConfirmationModal";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { useCurrentUser } from "../../../hooks/use-current-user";
import { useReports } from "@/contexts/ReportsContext";
import { getUserBarangay } from "@/lib/userMapping";
import { generateHotspotName } from "@/lib/mapUtils";

export default function AnalyticsPage() {
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [timePeriod, setTimePeriod] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("count");
  const [sortOrder, setSortOrder] = React.useState("desc");
  const [hotspotNames, setHotspotNames] = React.useState(new Map());
  const [loadingHotspotNames, setLoadingHotspotNames] = React.useState(false);
  const hotspotsPerPage = 5;
  const router = useRouter();
  const { user } = useCurrentUser();
  const { reports, isLoading, calculateBarangayHotspots } = useReports();

  const userEmail = user?.email || "";
  const barangay = getUserBarangay(userEmail) || 'All';

  const hotspots = React.useMemo(() => {
    if (!barangay || barangay === 'Unknown') return [];
    
    console.log("Analytics - Calculating hotspots for barangay:", barangay);
    const calculatedHotspots = calculateBarangayHotspots(barangay);
    console.log("Analytics - Found hotspots:", calculatedHotspots.length);
    
    return calculatedHotspots.map(hotspot => {
      const hotspotId = `${hotspot.lat}_${hotspot.lng}`;
      const cachedName = hotspotNames.get(hotspotId);
      
      return {
        id: hotspotId,
        latitude: hotspot.lat,
        longitude: hotspot.lng,
        incidentCount: hotspot.incidentCount,
        incidentType: hotspot.incidents?.[0]?.IncidentType || 'Unknown',
        riskLevel: hotspot.riskLevel,
        area: cachedName || `${barangay} Area (${hotspot.lat.toFixed(4)}, ${hotspot.lng.toFixed(4)})`,
        incidents: hotspot.incidents || []
      };
    });
  }, [barangay, calculateBarangayHotspots, hotspotNames]);

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push("/"); 
  };

  const totalHotspots = hotspots.length;
  const totalPages = Math.ceil(totalHotspots / hotspotsPerPage);
  const startIndex = (currentPage - 1) * hotspotsPerPage;
  const endIndex = Math.min(startIndex + hotspotsPerPage, totalHotspots);
  const currentHotspots = hotspots.slice(startIndex, endIndex);

  // Effect to generate street names for hotspots
  React.useEffect(() => {
    const generateHotspotNames = async () => {
      if (!barangay || barangay === 'Unknown') return;
      
      const calculatedHotspots = calculateBarangayHotspots(barangay);
      if (calculatedHotspots.length === 0) return;
      
      setLoadingHotspotNames(true);
      const newNames = new Map();
      
      // Generate names for all hotspots
      const namePromises = calculatedHotspots.map(async (hotspot) => {
        const hotspotId = `${hotspot.lat}_${hotspot.lng}`;
        
        // Skip if we already have this name cached
        if (hotspotNames.has(hotspotId)) {
          newNames.set(hotspotId, hotspotNames.get(hotspotId));
          return;
        }
        
        try {
          const streetName = await generateHotspotName(hotspot.lat, hotspot.lng, barangay);
          newNames.set(hotspotId, streetName);
        } catch (error) {
          console.warn('Failed to generate name for hotspot:', hotspotId, error);
          newNames.set(hotspotId, `${barangay} Area (${hotspot.lat.toFixed(4)}, ${hotspot.lng.toFixed(4)})`);
        }
      });
      
      await Promise.allSettled(namePromises);
      setHotspotNames(newNames);
      setLoadingHotspotNames(false);
    };
    
    generateHotspotNames();
  }, [barangay, calculateBarangayHotspots]);

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
      <Sidebar onLogout={() => setShowLogoutModal(true)} />
      
      <main className="flex-1 ml-64 p-10 bg-white min-h-screen">
        <h1 className="text-3xl font-bold text-red-600 mb-8">Analytics</h1>
        
        <div className="bg-white rounded-2xl border p-6 shadow-sm mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-red-500 mb-1">Incident Analytics Dashboard</h2>  
              <p className="text-gray-400">Comprehensive view of incident data in {barangay === 'All' ? 'all areas' : barangay}</p>
            </div>
            <div className="flex gap-3">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="count">By Count</SelectItem>
                  <SelectItem value="name">By Name</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="flex items-center gap-1"
              >
                <ArrowUpDown className="h-4 w-4" />
                {sortOrder === "asc" ? "Asc" : "Desc"}
              </Button>
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="daily">This Day</SelectItem>
                  <SelectItem value="weekly">This Week</SelectItem>
                  <SelectItem value="monthly">This Month</SelectItem>
                  <SelectItem value="yearly">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="relative">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Incident Type Distribution</h3>
              <CrimeDistributionChart 
                timePeriod={timePeriod} 
                sortBy={sortBy}
                sortOrder={sortOrder}
              />
            </div>
            <div className="relative">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Incident Trends Over Time</h3>
              <IncidentTrendChart 
                timePeriod={timePeriod}
                sortBy={sortBy}
                sortOrder={sortOrder}
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-red-500 mb-1">Incident Hotspots</h2>
          <p className="text-gray-400 mb-4">All active hotspots from the map for {barangay === 'All' ? 'all areas' : barangay}</p>
          
          {isLoading || loadingHotspotNames ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <span className="ml-2 text-gray-600">
                {isLoading ? 'Loading hotspots...' : 'Generating street names...'}
              </span>
            </div>
          ) : (
            <>
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
                            hotspot.riskLevel === 'high' 
                              ? 'bg-red-100 text-red-600 border-red-200'
                              : hotspot.riskLevel === 'medium'
                              ? 'bg-orange-100 text-orange-600 border-orange-200'
                              : 'bg-yellow-100 text-yellow-600 border-yellow-200'
                          }`}>
                            {hotspot.riskLevel.charAt(0).toUpperCase() + hotspot.riskLevel.slice(1)} Risk
                          </span>
                        </div>
                        <div className="text-gray-700 text-base">
                          Primary incident type: <span className="font-semibold">{hotspot.incidentType}</span>
                        </div>
                        <div className="text-gray-600 text-sm">
                          Location: {hotspot.area === `${barangay} Area (${hotspot.latitude.toFixed(4)}, ${hotspot.longitude.toFixed(4)})` ? 
                            `${hotspot.latitude.toFixed(6)}, ${hotspot.longitude.toFixed(6)}` : 
                            hotspot.area}
                        </div>
                        <div className="text-gray-600 text-sm">
                          Radius: ~{Math.max(50, Math.min(Math.sqrt(hotspot.incidentCount) * 60, 150))}m
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex justify-center items-center mt-8 pt-6 border-t border-gray-200">
                      <div className="flex items-center gap-2">
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

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
                            const showPage = 
                              pageNumber === 1 || 
                              pageNumber === totalPages || 
                              Math.abs(pageNumber - currentPage) <= 1;

                            if (!showPage) {
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

                  {totalPages > 1 && (
                    <div className="text-center text-xs text-gray-500 mt-2">
                      Scroll up to see more hotspots on previous pages
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-gray-50 rounded-xl border p-6 text-center text-gray-500">
                  {totalHotspots === 0 
                    ? `No hotspots detected in ${barangay === 'All' ? 'any area' : barangay}. Hotspots are identified when 2 or more verified incidents occur in the same area.`
                    : "No hotspots found for the current page."
                  }
                </div>
              )}
            </>
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
