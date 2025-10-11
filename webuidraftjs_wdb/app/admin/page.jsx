"use client";

import Link from "next/link";
import { ShieldAlert, LayoutDashboard, BarChart2, FileText, LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CrimeMap } from "@/components/admin/crime-map";
import { RecentReports } from "@/components/admin/recent-reports";
import { StatsCards } from "@/components/admin/stats-cards";
import { HighRiskAreasDialog } from "../../components/admin/high-risk-areas-dialog.jsx";
import { ReportDetailDialog } from "@/components/admin/report-detail-dialog.jsx";
import LogoutConfirmationModal from "@/components/admin/LogoutConfirmationModal";
import { MLModelHealthWidget } from "@/components/admin/ml-model-health-widget";
import { useRouter } from "next/navigation";
import React from "react";
import Image from "next/image";
import Sidebar from "@/components/admin/Sidebar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { updateReportStatus } from "@/lib/reportUtils";
import { getMapCoordinatesForUser, getUserBarangay } from "@/lib/userMapping";
import { useReports } from "@/contexts/ReportsContext";
import { clusterIncidents } from "@/lib/clusterUtils";

export default function AdminDashboard() {
  const [showHighRiskDialog, setShowHighRiskDialog] = React.useState(false);
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [highRiskCount, setHighRiskCount] = React.useState(0);
  const [selectedReport, setSelectedReport] = React.useState(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [userBarangay, setUserBarangay] = React.useState("");
  const [userCoordinates, setUserCoordinates] = React.useState({ center: [14.8527, 120.816], zoom: 16 });
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useCurrentUser();
  const { reports, getPendingReports, getReportsByBarangay } = useReports();

  const userEmail = user?.email || "";

  // Fetch user barangay and coordinates from database
  React.useEffect(() => {
    const loadUserData = async () => {
      if (userEmail && !isUserLoading) {
        const barangay = await getUserBarangay(userEmail);
        const coordinates = await getMapCoordinatesForUser(userEmail);
        
        setUserBarangay(barangay);
        setUserCoordinates(coordinates || { center: [14.8527, 120.816], zoom: 16 });
        
        console.log("👤 Admin page - Current user:", user);
        console.log("📧 Admin page - User email:", userEmail);
        console.log("🏘️ Admin page - Mapped barangay:", barangay);
        console.log("🎯 Admin page - User coordinates:", coordinates);
      }
    };
    
    loadUserData();
  }, [user, userEmail, isUserLoading]);

  // Calculate stats based on userBarangay - will recalculate when userBarangay changes
  const filteredReports = React.useMemo(() => {
    console.log("🔢 Calculating filteredReports - userBarangay:", userBarangay, "total reports:", reports.length);
    if (!userBarangay) {
      console.log("⏳ Barangay not loaded yet, returning empty array");
      return [];
    }
    const filtered = getReportsByBarangay(userBarangay);
    console.log("✅ Filtered reports for", userBarangay, ":", filtered.length);
    return filtered;
  }, [userBarangay, reports, getReportsByBarangay]);
  
  const totalReports = filteredReports.length;
  const pendingReports = React.useMemo(() => {
    if (!userBarangay) return 0;
    const pending = getPendingReports(userBarangay).length;
    console.log("📋 Pending reports for", userBarangay, ":", pending);
    return pending;
  }, [userBarangay, reports, getPendingReports]);

  React.useEffect(() => {
    if (userBarangay) {
      calculateHighRiskAreas();
    }
  }, [reports, userBarangay]); 

  const calculateHighRiskAreas = () => {
    if (!userBarangay) {
      console.log("⏳ Waiting for user barangay to load...");
      return;
    }
    
    console.log("🔄 Calculating high-risk areas for dashboard...");
    console.log("📧 User barangay filter:", userBarangay);
    
    // Filter reports by barangay if provided, same as the map
    const filteredReports = userBarangay 
      ? reports.filter(report => report.Barangay === userBarangay)
      : reports;
    
    console.log("� Filtered reports for clustering:", {
      userBarangay,
      totalReports: reports.length,
      filteredReports: filteredReports.length
    });
    
    // Use the same clustering logic as the map visualization (clusterIncidents from clusterUtils)
    // This creates clusters with 6+ incidents within 500m of each other
    const clusters = clusterIncidents(filteredReports, 500, 6);
    
    console.log("� Map-style clusters (red circles):", {
      userBarangay,
      clustersFound: clusters.length,
      clusters: clusters.map(c => ({
        locationName: c.locationName,
        count: c.count,
        location: `[${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}]`
      })),
      method: "Using same clusterIncidents function as map (6+ incidents, 500m radius)"
    });

    // The number of clusters is exactly what shows as red circles on the map
    setHighRiskCount(clusters.length);
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push("/");
  };

  const handleVerify = async (id) => {
    const success = await updateReportStatus(id, "Verified");
    if (success) {
      console.log("Report verified successfully");
      
    }
  };

  const handleReject = async (id) => {
    const success = await updateReportStatus(id, "Rejected");
    if (success) {
      console.log("Report rejected successfully");
      
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {}
      <Sidebar onLogout={() => setShowLogoutModal(true)} />
      {}
      <main className="flex-1 ml-64 p-8 bg-white min-h-screen">
        <h1 className="text-3xl font-bold text-red-600 mb-6">Dashboard</h1>
        {}
        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {}
          <div className="rounded-lg bg-red-500 text-white shadow-md p-6 flex flex-col items-start">
            <div className="text-sm font-medium mb-2">Total Reports</div>
            <div className="text-3xl font-bold">{totalReports.toLocaleString()}</div>
          </div>
          {}
          <Link href="/admin/reports" className="rounded-lg bg-red-500 text-white shadow-md p-6 flex flex-col items-start transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400">
            <div className="text-sm font-medium mb-2">Pending Verification</div>
            <div className="text-3xl font-bold">{pendingReports}</div>
          </Link>
          {}
          <div
            role="button"
            tabIndex={0}
            className="rounded-lg bg-red-500 text-white shadow-md p-6 flex flex-col items-start transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
            onClick={() => setShowHighRiskDialog(true)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setShowHighRiskDialog(true); }}
            aria-label="Show High Risk Areas"
          >
            <div className="text-sm font-medium mb-2">High Risk Areas</div>
            <div className="text-3xl font-bold">{highRiskCount}</div>
          </div>
          {}
          <MLModelHealthWidget />
        </div>

        {}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-2xl font-bold text-red-600 mb-1">Incident Distribution</div>
          <div className="text-xs text-gray-500 mb-4">Bubble size represents incident frequency, color indicates risk levels</div>
          {isUserLoading || !userBarangay || !userCoordinates ? (
            <div className="flex h-[500px] w-full items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading map...</p>
              </div>
            </div>
          ) : (
            <CrimeMap 
              barangay={userBarangay}
              center={userCoordinates?.center || [14.8527, 120.816]}
              zoom={userCoordinates?.zoom || 14}
            />
          )}
        </div>
        {}
        <HighRiskAreasDialog 
          open={showHighRiskDialog} 
          onOpenChange={setShowHighRiskDialog} 
          userBarangay={userBarangay}
          dialogClassName="relative z-[9999] overflow-hidden"
        />

        {}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-2xl font-bold text-red-600">Recent Reports</div>
              <div className="text-xs text-gray-500">Latest incident reports submitted</div>
            </div>
            <Link href="/admin/reports" className="text-sm font-medium text-red-600 hover:underline">View All</Link>
          </div>
          <RecentReports 
            barangay={userBarangay} 
            onVerify={handleVerify}
            onReject={handleReject}
            onViewDetails={(report) => {
              setSelectedReport(report);
              setIsDialogOpen(true);
            }}
            enablePagination={true}
            reportsPerPage={4}
          />
        </div>
      </main>
      <ReportDetailDialog
        report={selectedReport}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onVerify={handleVerify}
        onReject={handleReject}
        onDelete={(reportId) => {
          
          fetchReportStats();
        }}
        onEdit={(reportId, updates) => {
          
          fetchReportStats();
        }}
      />
      <LogoutConfirmationModal
        open={showLogoutModal}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
}
