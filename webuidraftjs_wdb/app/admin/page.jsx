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
  const [selectedReport, setSelectedReport] = React.useState(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const router = useRouter();
  const user = useCurrentUser();
  // Map email to barangay name
  const userBarangayMap = {
    "testpinagbakahan@example.com": "Pinagbakahan",
    "testbulihan@example.com": "Bulihan",
    "testtiaong@example.com": "Tiaong",
    "testdakila@example.com": "Dakila",
    "testmojon@example.com": "Mojon",
    // Add more accounts and their barangay names here
  };
  const userEmail = user?.email || "";
  const userBarangay = userBarangayMap[userEmail] || "";

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
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (!userBarangay || data.Barangay === userBarangay) {
        total++;
        if ((data.Status ?? "").toLowerCase() === "pending") {
          pending++;
        }
      }
    });
    setTotalReports(total);
    setPendingReports(pending);
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
            <div className="text-3xl font-bold">4</div>
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
          <CrimeMap barangay={userBarangay} zoom={15} />
        </div>
        {/* High Risk Areas Dialog (ensure it overlays the map) */}
        <HighRiskAreasDialog 
          open={showHighRiskDialog} 
          onOpenChange={setShowHighRiskDialog} 
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
