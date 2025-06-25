"use client"

import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BubbleChart } from "@/components/admin/bubble-chart"
import { RecentReports } from "@/components/admin/recent-reports"
import { StatsCards } from "@/components/admin/stats-cards"
import { HighRiskAreasDialog } from "@/components/admin/high-risk-areas-dialog"
import React from "react"

export default function AdminDashboard() {
  const [showHighRiskDialog, setShowHighRiskDialog] = React.useState(false)

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="flex flex-col w-64 bg-red-600 text-white min-h-screen justify-between fixed left-0 top-0 z-20">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2 h-16 px-6 border-b border-red-500">
            <ShieldAlert className="h-7 w-7 text-white" />
            <span className="text-2xl font-bold tracking-tight">ReportIt</span>
          </div>
          {/* Menu */}
          <nav className="flex flex-col gap-2 mt-8 px-6">
            <Link href="/admin" className="py-2 px-3 rounded-md text-lg font-medium bg-white/10 hover:bg-white/20 transition-colors">
              Dashboard
            </Link>
            <Link
              href="/admin/analytics"
              className="py-2 px-3 rounded-md text-lg font-medium hover:bg-white/10 transition-colors"
            >
              Analytics
            </Link>
            <Link
              href="/admin/reports"
              className="py-2 px-3 rounded-md text-lg font-medium hover:bg-white/10 transition-colors"
            >
              Manage Reports
            </Link>
          </nav>
        </div>
        {/* Logout */}
        <div className="mb-8 px-6">
          <button className="w-full py-2 px-3 rounded-md text-lg font-medium bg-white/10 hover:bg-white/20 transition-colors">
            Log out
          </button>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 bg-white min-h-screen">
        <h1 className="text-3xl font-bold text-red-600 mb-6">Dashboard</h1>
        {/* Dashboard Stat Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Reports */}
          <div className="rounded-lg bg-red-500 text-white shadow-md p-6 flex flex-col items-start">
            <div className="text-sm font-medium mb-2">Total Reports</div>
            <div className="text-3xl font-bold">6,731</div>
          </div>
          {/* Pending Verification */}
          <Link href="/admin/reports" className="rounded-lg bg-red-500 text-white shadow-md p-6 flex flex-col items-start transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400">
            <div className="text-sm font-medium mb-2">Pending Verification</div>
            <div className="text-3xl font-bold">18</div>
          </Link>
          {/* High Risk Areas */}
          <button
            className="rounded-lg bg-red-500 text-white shadow-md p-6 flex flex-col items-start transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
            onClick={() => setShowHighRiskDialog(true)}
          >
            <div className="text-sm font-medium mb-2">High Risk Areas</div>
            <div className="text-3xl font-bold">4</div>
          </button>
          {/* ML Prediction Accuracy */}
          <div className="rounded-lg bg-red-500 text-white shadow-md p-6 flex flex-col items-start">
            <div className="text-sm font-medium mb-2">ML Prediction Accuracy</div>
            <div className="text-3xl font-bold">81%</div>
          </div>
        </div>
        <HighRiskAreasDialog open={showHighRiskDialog} onOpenChange={setShowHighRiskDialog} />

        {/* Incident Distribution (Bubble Chart) */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-2xl font-bold text-red-600 mb-1">Incident Distribution</div>
          <div className="text-xs text-gray-500 mb-4">Bubble size represents incident frequency, color indicates risk levels</div>
          <BubbleChart />
        </div>

        {/* Recent Reports */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-2xl font-bold text-red-600">Recent Reports</div>
              <div className="text-xs text-gray-500">Latest incident reports submitted</div>
            </div>
            <Link href="/admin/reports" className="text-sm font-medium text-red-600 hover:underline">View All</Link>
          </div>
          <RecentReports />
        </div>
      </main>
    </div>
  )
}
