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
import { AddCategoryDialog } from "@/components/admin/add-category-dialog.jsx";
import AddReportDialog from "@/components/admin/add-report-dialog";
import LogoutConfirmationModal from "@/components/admin/LogoutConfirmationModal";
import Sidebar from "@/components/admin/Sidebar";
import ReportList from "@/components/admin/ReportList";
import { db } from "@/firebase";
import { useCurrentUser } from "@/hooks/use-current-user";

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
  const router = useRouter();
  const user = useCurrentUser();

  useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("DateTime", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setReports(reportsData);
    });
    return () => unsubscribe();
  }, []);

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

    return matchesSearch && matchesStatus;
  });

  const handleVerify = (id) => {
    setReports(reports.map((r) => (r.id === id ? { ...r, status: "verified" } : r)));
  };

  const handleReject = (id, reason) => {
    setReports(reports.map((r) => (r.id === id ? { ...r, status: "rejected", rejectionReason: reason } : r)));
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
                Add Category
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
            <h2 className="text-2xl font-bold text-red-600 mb-1">All Reports</h2>
            <p className="text-gray-400 mb-6">Showing all incident reports from all barangays</p>
            <ReportList
              reports={filteredReports}
              onVerify={handleVerify}
              onReject={handleReject}
              onViewDetails={(report) => {
                setSelectedReport(report);
                setIsDialogOpen(true);
              }}
              statusFilter={statusFilter}
            />
            <ReportDetailDialog
              report={{
                ...selectedReport,
                category: selectedReport?.category || categories[0]?.name,
                keywords:
                  selectedReport?.category
                    ? categories.find((cat) => cat.name === selectedReport.category)?.keywords || []
                    : categories[0]?.keywords || [],
              }}
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              onVerify={handleVerify}
              onReject={handleReject}
            />
            <AddCategoryDialog
              open={isAddDialogOpen}
              onOpenChange={setIsAddDialogOpen}
              onSave={({ name, keywords }) => {
                setCategories((prev) => [...prev, { name, keywords }]);
              }}
            />
          </div>
        </main>
      </div>
      <AddReportDialog open={showAddReport} onClose={() => setShowAddReport(false)} />
      <LogoutConfirmationModal
        open={showLogoutModal}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
}
