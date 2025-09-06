"use client";

import Link from "next/link";
import { LayoutDashboard, BarChart2, FileText, LogOut, ShieldAlert } from "lucide-react";
import { CrimeDistributionChart } from "@/components/admin/crime-distribution-chart";
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
  const router = useRouter();
  const user = useCurrentUser(); // Fix: remove destructuring

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
    
    // Create a grid to group nearby incidents
    const gridSize = 0.002; // ~200m grid cells
    const grid = {};
    
    filteredReports.forEach(report => {
      if (report.Latitude && report.Longitude) {
        const gridX = Math.floor(report.Latitude / gridSize);
        const gridY = Math.floor(report.Longitude / gridSize);
        const gridKey = `${gridX},${gridY}`;
        
        if (!grid[gridKey]) {
          grid[gridKey] = [];
        }
        grid[gridKey].push(report);
      }
    });
    
    // Find hotspots (cells with 2+ incidents)
    const hotspots = [];
    Object.entries(grid).forEach(([gridKey, incidents]) => {
      if (incidents.length >= 2) {
        const avgLat = incidents.reduce((sum, inc) => sum + inc.Latitude, 0) / incidents.length;
        const avgLng = incidents.reduce((sum, inc) => sum + inc.Longitude, 0) / incidents.length;
        
        // Determine most common incident type
        const incidentTypes = {};
        incidents.forEach(inc => {
          incidentTypes[inc.IncidentType] = (incidentTypes[inc.IncidentType] || 0) + 1;
        });
        const mostCommonType = Object.keys(incidentTypes).reduce((a, b) => 
          incidentTypes[a] > incidentTypes[b] ? a : b
        );
        
        // Determine risk level based on incident count
        // Low risk (2 incidents) = Yellow circles
        // Medium risk (3-4 incidents) = Orange circles  
        // High risk (5+ incidents) = Red circles
        let riskLevel = 'Low';
        if (incidents.length >= 5) riskLevel = 'High';
        else if (incidents.length >= 3) riskLevel = 'Medium';
        else riskLevel = 'Low'; // 2 incidents
        
        hotspots.push({
          id: gridKey,
          latitude: avgLat,
          longitude: avgLng,
          incidentCount: incidents.length,
          incidentType: mostCommonType,
          riskLevel: riskLevel,
          area: `Grid ${gridKey}`,
          incidents: incidents
        });
      }
    });
    
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
            
            {hotspots.length > 0 ? (
              <div className="space-y-4">
                {hotspots.slice(0, 5).map((hotspot, index) => (
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
            ) : (
              <div className="bg-gray-50 rounded-xl border p-4 text-center text-gray-500">
                No hotspots detected yet. Hotspots are identified when 2 or more incidents occur in the same area.
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