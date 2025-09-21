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
import { useRouter } from "next/navigation";
import React from "react";
import Image from "next/image";
import Sidebar from "@/components/admin/Sidebar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { updateReportStatus } from "@/lib/reportUtils";
import { getMapCoordinatesForUser, getUserBarangay } from "@/lib/userMapping";
import { useReports } from "@/contexts/ReportsContext";

export default function AdminDashboard() {
  const [showHighRiskDialog, setShowHighRiskDialog] = React.useState(false);
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [highRiskCount, setHighRiskCount] = React.useState(0);
  const [selectedReport, setSelectedReport] = React.useState(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useCurrentUser();
  const { reports, getPendingReports, getReportsByBarangay } = useReports();
  
  // Use centralized user mapping - only get coordinates when user is loaded
  const userEmail = user?.email || "";
  const userBarangay = getUserBarangay(userEmail);
  const userCoordinates = isUserLoading ? { center: [14.8527, 120.816], zoom: 16 } : getMapCoordinatesForUser(userEmail);

  // Get filtered reports and statistics from context
  const filteredReports = getReportsByBarangay(userBarangay);
  const totalReports = filteredReports.length;
  const pendingReports = getPendingReports(userBarangay).length;

  console.log("👤 Admin page - Current user:", user);
  console.log("📧 Admin page - User email:", userEmail);
  console.log("🏘️ Admin page - Mapped barangay:", userBarangay);
  console.log("🎯 Admin page - User coordinates:", userCoordinates);
  console.log("🔄 Admin page - Is user loading:", isUserLoading);

  React.useEffect(() => {
    calculateHighRiskAreas();
  }, [reports]); // Update when reports change

  const calculateHighRiskAreas = () => {
    const locationData = {};

    reports.forEach(report => {
      // Calculate high-risk areas (for all data, not filtered by user barangay)
      let barangay = report.Barangay || report.barangay || report.Location || report.location;
      if (barangay && typeof barangay === 'string') {
        barangay = barangay.trim();
        if (barangay.toLowerCase().includes('bulihan')) barangay = 'Bulihan';
        else if (barangay.toLowerCase().includes('mojon')) barangay = 'Mojon';
        else if (barangay.toLowerCase().includes('dakila')) barangay = 'Dakila';
        else if (barangay.toLowerCase().includes('pinagbakahan')) barangay = 'Pinagbakahan';
        else if (barangay.toLowerCase().includes('look')) barangay = 'Look 1st';
        else if (barangay.toLowerCase().includes('longos')) barangay = 'Longos';
        else if (barangay.toLowerCase().includes('tiaong')) barangay = 'Tiaong';
        else return;
      } else return;

      if (!locationData[barangay]) {
        locationData[barangay] = {
          name: barangay,
          totalIncidents: 0,
          highSeverityIncidents: 0,
          incidentTypes: {}
        };
      }

      locationData[barangay].totalIncidents++;

      const incidentType = (report.IncidentType || "").toLowerCase();
      if (incidentType.includes("robbery") || incidentType.includes("assault") || 
          incidentType.includes("violence") || incidentType.includes("murder") ||
          incidentType.includes("kidnap") || incidentType.includes("rape")) {
        locationData[barangay].highSeverityIncidents++;
      }

      const type = report.IncidentType || "Other";
      locationData[barangay].incidentTypes[type] = (locationData[barangay].incidentTypes[type] || 0) + 1;
    });

    // Calculate high-risk areas count using WCRA
    const highRiskAreas = Object.values(locationData)
      .map(area => {
        const frequencyScore = Math.min(Math.log2(area.totalIncidents + 1) * 8, 35);
        const severityScore = area.highSeverityIncidents * 25;
        const diversityScore = Math.min(Object.keys(area.incidentTypes).length * 4, 20);
        
        area.riskScore = Math.round((frequencyScore + severityScore + diversityScore));
        area.riskScore = Math.min(area.riskScore, 100);
        
        return area.riskScore >= 70 ? area : null; // Only HIGH risk (70+)
      })
      .filter(area => area !== null);

    console.log("📊 Dashboard High Risk Calculation:", {
      totalAreas: Object.keys(locationData).length,
      highRiskCount: highRiskAreas.length,
      areas: highRiskAreas.map(a => `${a.name}: ${a.riskScore}`)
    });

    setHighRiskCount(highRiskAreas.length);
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push("/");
  };

  const handleVerify = async (id) => {
    const success = await updateReportStatus(id, "Verified");
    if (success) {
      console.log("Report verified successfully");
      // No need to refresh stats as context will update automatically
    }
  };

  const handleReject = async (id) => {
    const success = await updateReportStatus(id, "Rejected");
    if (success) {
      console.log("Report rejected successfully");
      // No need to refresh stats as context will update automatically
    }
  };

  // Remove duplicate mapping logic, use userBarangay from above
  

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <Sidebar onLogout={() => setShowLogoutModal(true)} />
      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 bg-white min-h-screen">
        <h1 className="text-3xl font-bold text-red-600 mb-6">Dashboard</h1>
        {/* Dashboard Stat Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Reports */}
          <div className="rounded-lg bg-red-500 text-white shadow-md p-6 flex flex-col items-start">
            <div className="text-sm font-medium mb-2">Total Reports</div>
            <div className="text-3xl font-bold">{totalReports.toLocaleString()}</div>
          </div>
          {/* Pending Verification */}
          <Link href="/admin/reports" className="rounded-lg bg-red-500 text-white shadow-md p-6 flex flex-col items-start transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400">
            <div className="text-sm font-medium mb-2">Pending Verification</div>
            <div className="text-3xl font-bold">{pendingReports}</div>
          </Link>
          {/* High Risk Areas */}
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
          {/* ML Prediction Accuracy */}
          <div className="rounded-lg bg-red-500 text-white shadow-md p-6 flex flex-col items-start">
            <div className="text-sm font-medium mb-2">ML Prediction Accuracy</div>
            <div className="text-3xl font-bold">81%</div>
          </div>
        </div>

        {/* Incident Distribution (Bubble Chart) */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-2xl font-bold text-red-600 mb-1">Incident Distribution</div>
          <div className="text-xs text-gray-500 mb-4">Bubble size represents incident frequency, color indicates risk levels</div>
          {isUserLoading ? (
            <div className="flex h-[500px] w-full items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading map...</p>
              </div>
            </div>
          ) : (
            <CrimeMap 
              barangay={userBarangay}
              center={userCoordinates.center}
              zoom={userCoordinates.zoom}
            />
          )}
        </div>
        {/* High Risk Areas Dialog (ensure it overlays the map) */}
        <HighRiskAreasDialog 
          open={showHighRiskDialog} 
          onOpenChange={setShowHighRiskDialog} 
          userBarangay={userBarangay}
          dialogClassName="relative z-[9999] overflow-hidden"
        />

        {/* Recent Reports */}
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
          // Refresh the stats when a report is deleted
          fetchReportStats();
        }}
        onEdit={(reportId, updates) => {
          // Refresh the stats when a report is edited
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
