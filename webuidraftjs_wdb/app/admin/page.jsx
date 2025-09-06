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
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import Sidebar from "@/components/admin/Sidebar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { updateReportStatus } from "@/lib/reportUtils";

export default function AdminDashboard() {
  const [showHighRiskDialog, setShowHighRiskDialog] = React.useState(false);
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [totalReports, setTotalReports] = React.useState(0);
  const [pendingReports, setPendingReports] = React.useState(0);
  const [highRiskCount, setHighRiskCount] = React.useState(0);
  const [selectedReport, setSelectedReport] = React.useState(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isUserLoading, setIsUserLoading] = React.useState(true);
  const router = useRouter();
  const user = useCurrentUser();
  // Map email to barangay name
  const userBarangayMap = {
    "testpinagbakahan@example.com": "Pinagbakahan",
    "testbulihan@example.com": "Bulihan",
    "testtiaong@example.com": "Tiaong",
    "testdakila@example.com": "Dakila",
    "testmojon@example.com": "Mojon",
    "testlook@example.com": "Look 1st",
    "testlongos@example.com": "Longos",
    // Add more accounts and their barangay names here
  };
  const userEmail = user?.email || "";
  const userBarangay = userBarangayMap[userEmail] || "";

  console.log("👤 Admin page - Current user:", user);
  console.log("📧 Admin page - User email:", userEmail);
  console.log("🏘️ Admin page - Mapped barangay:", userBarangay);
  console.log("🗺️ Available barangay mappings:", userBarangayMap);

  // Track user loading state
  React.useEffect(() => {
    if (user !== undefined) {
      setIsUserLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    fetchReportStats();
  }, [userBarangay]);

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push("/");
  };

  const handleVerify = async (id) => {
    const success = await updateReportStatus(id, "Verified");
    if (success) {
      console.log("Report verified successfully");
      // Refresh the stats
      fetchReportStats();
    }
  };

  const handleReject = async (id) => {
    const success = await updateReportStatus(id, "Rejected");
    if (success) {
      console.log("Report rejected successfully");
      // Refresh the stats
      fetchReportStats();
    }
  };

  const fetchReportStats = async () => {
    const querySnapshot = await getDocs(collection(db, "reports"));
    let total = 0;
    let pending = 0;
    const locationData = {};

    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (!userBarangay || data.Barangay === userBarangay) {
        total++;
        if ((data.Status ?? "").toLowerCase() === "pending") {
          pending++;
        }
      }

      // Calculate high-risk areas (for all data, not filtered by user barangay)
      let barangay = data.Barangay || data.barangay || data.Location || data.location;
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

      const incidentType = (data.IncidentType || "").toLowerCase();
      if (incidentType.includes("robbery") || incidentType.includes("assault") || 
          incidentType.includes("violence") || incidentType.includes("murder") ||
          incidentType.includes("kidnap") || incidentType.includes("rape")) {
        locationData[barangay].highSeverityIncidents++;
      }

      const type = data.IncidentType || "Other";
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

    setTotalReports(total);
    setPendingReports(pending);
    setHighRiskCount(highRiskAreas.length);
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
          {/* Debug info */}
          {userEmail === "testbulihan@example.com" && (
            <div className="text-xs text-blue-600 mb-2">
              🎯 Bulihan Map: Center [14.8612, 120.8067] Zoom 15
            </div>
          )}
          {userEmail === "testpinagbakahan@example.com" && (
            <div className="text-xs text-blue-600 mb-2">
              🎯 Pinagbakahan Map: Center [14.8715, 120.8207] Zoom 15
            </div>
          )}
          {userEmail === "testdakila@example.com" && (
            <div className="text-xs text-blue-600 mb-2">
              🎯 Dakila Map: Center [14.8555, 120.8186] Zoom 15
            </div>
          )}
          {userEmail === "testlook@example.com" && (
            <div className="text-xs text-blue-600 mb-2">
              🎯 Look 1st Map: Center [14.8657, 120.8154] Zoom 15
            </div>
          )}
          {userEmail === "testmojon@example.com" && (
            <div className="text-xs text-blue-600 mb-2">
              🎯 Mojon Map: Center [14.8617, 120.8118] Zoom 15
            </div>
          )}
          {console.log("🗺️ Passing to CrimeMap - userEmail:", userEmail, "userBarangay:", userBarangay, "isUserLoading:", isUserLoading)}
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
              center={userEmail === "testbulihan@example.com" ? [14.8612, 120.8067] : 
                      userEmail === "testpinagbakahan@example.com" ? [14.8715, 120.8207] : 
                      userEmail === "testdakila@example.com" ? [14.8555, 120.8186] : 
                      userEmail === "testlook@example.com" ? [14.8657, 120.8154] : 
                      userEmail === "testmojon@example.com" ? [14.8617, 120.8118] : undefined}
              zoom={userEmail === "testbulihan@example.com" ? 15 : 
                    userEmail === "testpinagbakahan@example.com" ? 15 : 
                    userEmail === "testdakila@example.com" ? 15 : 
                    userEmail === "testlook@example.com" ? 15 : 
                    userEmail === "testmojon@example.com" ? 15 : undefined}
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
      />
      <LogoutConfirmationModal
        open={showLogoutModal}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
}
