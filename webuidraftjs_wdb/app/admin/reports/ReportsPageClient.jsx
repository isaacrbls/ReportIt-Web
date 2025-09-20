"use client";

import { useState, useEffect } from "react";
import { Search, Plus, LogOut, CheckCircle, XCircle, LayoutDashboard, BarChart2, FileText, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { collection, getDocs, onSnapshot, query, orderBy } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ReportDetailDialog } from "@/components/admin/report-detail-dialog.jsx";
import { EditCategoryDialog } from "@/components/admin/edit-category-dialog.jsx";
import AddReportDialog from "@/components/admin/add-report-dialog";
import LogoutConfirmationModal from "@/components/admin/LogoutConfirmationModal";
import Sidebar from "@/components/admin/Sidebar";
import ReportList from "@/components/admin/ReportList";
import { db } from "@/firebase";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getUserBarangay, isUserAdmin } from "@/lib/userMapping";
import { updateReportStatus, formatReportForDisplay } from "@/lib/reportUtils";

export default function ReportsPageClient() {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showAddReport, setShowAddReport] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [hotspots, setHotspots] = useState([]);
  const router = useRouter();
  const { user } = useCurrentUser();

  useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("DateTime", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setReports(reportsData);
    });
    return () => unsubscribe();
  }, []);

// Use centralized user mapping
const userEmail = user?.email || "";
const userBarangay = getUserBarangay(userEmail);
const isAdmin = isUserAdmin(userEmail);
console.log("👤 Reports page - Current user:", user);
  console.log("📧 Reports page - User email:", userEmail);
  console.log("🏘️ Reports page - Mapped barangay:", userBarangay);
  console.log("🔐 Reports page - Is admin:", isAdmin);
  console.log("📊 Reports page - Total reports loaded:", reports.length);

  // Phase 1: Basic Hotspot Calculation
  const calculateBarangayHotspots = (reports, barangay) => {
    if (!barangay || !reports.length) return [];
    
    const barangayReports = reports.filter(r => r.Barangay === barangay);
    console.log("🔍 Barangay reports for hotspot calculation:", barangayReports);
    
    // Simple density-based hotspot detection with larger grid for better clustering
    const gridSize = 0.002; // ~200m grid cells (increased from 100m)
    const locations = {};
    
    barangayReports.forEach(report => {
      if (report.Latitude && report.Longitude) {
        // Create grid key for grouping nearby incidents
        const gridLat = Math.floor(report.Latitude / gridSize) * gridSize;
        const gridLng = Math.floor(report.Longitude / gridSize) * gridSize;
        const key = `${gridLat.toFixed(3)}_${gridLng.toFixed(3)}`;
        
        console.log(`📍 Report ${report.id}: Lat=${report.Latitude}, Lng=${report.Longitude} → Grid=${key}`);
        
        if (!locations[key]) {
          locations[key] = {
            lat: gridLat + (gridSize / 2), // Center of grid cell
            lng: gridLng + (gridSize / 2),
            incidents: [],
            count: 0
          };
        }
        
        locations[key].incidents.push(report);
        locations[key].count++;
      } else {
        console.log(`❌ Report ${report.id}: Missing coordinates - Lat=${report.Latitude}, Lng=${report.Longitude}`);
      }
    });
    
    console.log("🗂️ Grid locations:", locations);
    
    // Lower threshold to catch your 4 clustered pins
    const hotspotThreshold = 2; // 2+ incidents = hotspot
    const hotspots = Object.values(locations)
      .filter(location => location.count >= hotspotThreshold)
      .map(location => ({
        lat: location.lat,
        lng: location.lng,
        incidentCount: location.count,
        // Risk level classification:
        // Low risk (2 incidents) = Yellow circles 🟡
        // Medium risk (3-4 incidents) = Orange circles 🟠
        // High risk (5+ incidents) = Red circles 🔴
        riskLevel: location.count >= 5 ? 'high' : location.count >= 3 ? 'medium' : 'low',
        incidents: location.incidents,
        radius: Math.min(location.count * 50, 200) // Dynamic radius based on incident count
      }))
      .sort((a, b) => b.incidentCount - a.incidentCount); // Sort by incident count
    
    console.log("🔥 Final hotspots:", hotspots);
    return hotspots;
  };

  // Calculate hotspots when reports or barangay changes
  useEffect(() => {
    if (userBarangay && reports.length > 0) {
      const calculatedHotspots = calculateBarangayHotspots(reports, userBarangay);
      setHotspots(calculatedHotspots);
      console.log("🔥 Hotspots calculated for", userBarangay, ":", calculatedHotspots);
    } else {
      setHotspots([]);
    }
  }, [reports, userBarangay]);

  console.log("📊 Reports page - Total reports loaded:", reports.length);

  const filteredReports = reports.filter((report) => {
    const searchTerm = search.trim().toLowerCase();
    const matchesSearch =
      report?.id?.toString?.().toLowerCase?.().includes(searchTerm) ||
      report?.IncidentType?.toString?.().toLowerCase?.().includes(searchTerm) ||
      report?.Description?.toString?.().toLowerCase?.().includes(searchTerm) ||
      report?.Barangay?.toString?.().toLowerCase?.().includes(searchTerm);

    const normalizedStatus = (report?.Status ?? "").toString().toLowerCase().trim();
    const effectiveStatus = normalizedStatus || "pending";
    const matchesStatus = statusFilter === "all" || effectiveStatus === statusFilter;

    // Only show reports for the user's barangay - strict filtering
    const matchesBarangay = userBarangay ? report?.Barangay === userBarangay : false;
    
    // Filter out sensitive reports for non-admin users
    const canViewSensitive = isAdmin || !report?.isSensitive;
    
    // Debug logging for each report
    if (report?.id) {
      console.log(`🔍 Report ${report.id}: Barangay="${report?.Barangay}" vs UserBarangay="${userBarangay}" = ${matchesBarangay}, Sensitive=${report?.isSensitive}, CanView=${canViewSensitive}`);
    }

    return matchesSearch && matchesStatus && matchesBarangay && canViewSensitive;
  });

  console.log("🔍 Reports page - Filtered reports count:", filteredReports.length);
  console.log("🔍 Reports page - All reports:", reports.map(r => ({ id: r.id, barangay: r.Barangay, status: r.Status })));
  console.log("🔍 Reports page - Filtered reports:", filteredReports.map(r => ({ id: r.id, barangay: r.Barangay, status: r.Status })));

  const handleVerify = async (id) => {
    const success = await updateReportStatus(id, "Verified");
    if (success) {
      // The reports will be updated automatically through the onSnapshot listener
      console.log("Report verified successfully");
    }
  };

  const handleReject = async (id, reason) => {
    const success = await updateReportStatus(id, "Rejected", reason);
    if (success) {
      // The reports will be updated automatically through the onSnapshot listener
      console.log("Report rejected successfully");
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push("/"); // Redirect to root (login)
  };

  return (
    <>
      <div className="flex min-h-screen bg-white">
        {/* Sidebar */}
        <Sidebar onLogout={() => setShowLogoutModal(true)} />
        {/* Main Content */}
        <main className="flex-1 ml-64 p-10 bg-white min-h-screen">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-red-600">Manage Reports</h1>
            <div className="flex gap-4">
              <button
                className="bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg px-6 py-2 text-base transition-colors"
                onClick={() => setIsAddDialogOpen(true)}
              >
                Edit Categories
              </button>
              <button
                className="bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg px-6 py-2 text-base transition-colors"
                onClick={() => setShowAddReport(true)}
              >
                Add Report
              </button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 flex items-center bg-white border rounded-lg px-4 py-2">
              <Search className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search Reports"
                className="flex-1 outline-none bg-transparent text-base"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="border rounded-lg px-4 py-2 text-base text-gray-700 bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Reports</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-red-600 mb-1">
              {userBarangay ? `${userBarangay} Reports` : "No Reports"}
            </h2>
            <p className="text-gray-400 mb-6">
              {userBarangay
                ? `Showing incident reports for barangay: ${userBarangay}`
                : "No reports available for your account. Please contact admin if you think this is an error."}
            </p>
            {userBarangay ? (
              <>
                <ReportList
                  reports={filteredReports}
                  onVerify={handleVerify}
                  onReject={handleReject}
                  onViewDetails={(report) => {
                    setSelectedReport(report);
                    setIsDialogOpen(true);
                  }}
                  statusFilter={statusFilter}
                  reportsPerPage={6} // Show 6 reports per page
                />
              </>
            ) : (
              <div className="text-center text-gray-500 py-10">No reports to show.</div>
            )}
            <ReportDetailDialog
              report={selectedReport}
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              onVerify={handleVerify}
              onReject={handleReject}
              onDelete={(reportId) => {
                // The reports will be updated automatically through the onSnapshot listener
                console.log("Report deleted successfully");
              }}
              onEdit={(reportId, updates) => {
                // The reports will be updated automatically through the onSnapshot listener
                console.log("Report edited successfully");
              }}
            />
            <EditCategoryDialog
              open={isAddDialogOpen}
              onOpenChange={setIsAddDialogOpen}
              categories={categories}
              onSave={({ name, keywords }) => {
                setCategories((prev) => [...prev, { name, keywords }]);
              }}
              onDelete={(categoryName) => {
                setCategories((prev) => prev.filter(cat => (cat.name || cat) !== categoryName));
              }}
            />
          </div>
        </main>
      </div>
      <AddReportDialog 
        open={showAddReport} 
        onClose={() => setShowAddReport(false)} 
        barangay={userBarangay}
        categories={categories}
      />
      <LogoutConfirmationModal
        open={showLogoutModal}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
}
