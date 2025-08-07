"use client";

import Link from "next/link";
import { LayoutDashboard, BarChart2, FileText, LogOut, ShieldAlert } from "lucide-react";
import { CrimeDistributionChart } from "@/components/admin/crime-distribution-chart";
import React from "react";
import Image from "next/image";
import LogoutConfirmationModal from "@/components/admin/LogoutConfirmationModal";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";

import { useCurrentUser } from "@/hooks/use-current-user";
import { CrimeMap } from "@/components/admin/crime-map";


export default function AnalyticsPage() {
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const router = useRouter();
  const user = useCurrentUser();

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
        {/* Show Hotspots and pins only if NOT testbulihan@example.com AND NOT testtiaong@example.com */}
        {user?.email !== "testbulihan@example.com" && user?.email !== "testtiaong@example.com" && (
          <>
            <div className="bg-white rounded-2xl border p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-red-500 mb-1">Emerging Hotspots</h2>
              <p className="text-gray-400 mb-4">Based on the recent and spatial analysis.</p>
              <div className="bg-white rounded-xl border p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-red-600 text-lg">Look 1st – Market Area</span>
                  <span className="px-4 py-1 rounded-full bg-red-100 text-red-600 font-semibold text-sm border border-red-200">High Risk</span>
                </div>
                <div className="text-gray-700 text-base">Type of incident: <span className="font-semibold">Theft</span></div>
              </div>
            </div>
            {/* Map with pins/hotspots for other users */}
            <div className="bg-white rounded-2xl border p-6 shadow-sm mt-6">
              <h2 className="text-2xl font-bold text-red-500 mb-1">Incident Map</h2>
              <div className="flex justify-center items-center">
                <div className="w-full max-w-md">
                  <CrimeMap />
                </div>
              </div>
            </div>
          </>
        )}
        {/* Show plain map only (no hotspots/pins/controls) for testbulihan@example.com and testtiaong@example.com */}
        {(user?.email === "testbulihan@example.com" || user?.email === "testtiaong@example.com") && (
          <div className="bg-white rounded-2xl border p-6 shadow-sm mt-6">
            <h2 className="text-2xl font-bold text-red-500 mb-1">{user?.email === "testbulihan@example.com" ? "Bulihan, Malolos, Bulacan Map" : "Tiaong Map"}</h2>
            <div className="flex justify-center items-center">
              <div className="w-full max-w-md">
                <CrimeMap
                  barangay={user?.email === "testbulihan@example.com" ? "Brgy Bulihan" : "Brgy Tiaong"}
                  showPins={false}
                  showHotspots={false}
                  showControls={false}
                  center={user?.email === "testbulihan@example.com" ? [14.8441, 120.8116] : [14.8455, 120.8130]}
                  zoom={15}
                />
              </div>
            </div>
          </div>
        )}
      </main>
      <LogoutConfirmationModal
        open={showLogoutModal}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
}
