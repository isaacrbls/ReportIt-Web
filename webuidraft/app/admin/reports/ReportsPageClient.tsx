"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Plus, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ReportDetailDialog } from "@/components/admin/report-detail-dialog"
import { AddCategoryDialog } from "@/components/admin/add-category-dialog"

// Sample data for reports
const allReports = [
	{
		id: "REP-001",
		title: "Smartphone theft at market",
		description: "Victim reported smartphone snatched while shopping at the public market",
		location: "Bulihan",
		timestamp: "May 15, 2023 - 2:30 PM",
		status: "pending",
		hasMedia: true,
		category: "Theft",
		risk: "High",
	},
	{
		id: "REP-002",
		title: "Wallet snatching incident",
		description: "Wallet stolen from backpack while victim was riding a jeepney",
		location: "Mojon",
		timestamp: "May 14, 2023 - 6:45 PM",
		status: "verified",
		hasMedia: true,
		category: "Theft",
		risk: "High",
	},
	{
		id: "REP-003",
		title: "Motorcycle theft",
		description: "Motorcycle stolen from parking area near the market",
		location: "Dakila",
		timestamp: "May 14, 2023 - 9:15 AM",
		status: "pending",
		hasMedia: false,
		category: "Vehicle Theft",
		risk: "Medium",
	},
	{
		id: "REP-004",
		title: "Store robbery",
		description: "Armed individuals robbed a convenience store",
		location: "Look 1st",
		timestamp: "May 13, 2023 - 10:10 PM",
		status: "rejected",
		hasMedia: true,
		category: "Robbery",
		risk: "High",
		rejectionReason: "Duplicate report - already verified under REP-008",
	},
	{
		id: "REP-005",
		title: "Phone snatching",
		description: "Phone snatched while victim was texting near the plaza",
		location: "Longos",
		timestamp: "May 13, 2023 - 4:20 PM",
		status: "verified",
		hasMedia: false,
		category: "Theft",
		risk: "Medium",
	},
]

const allCategories = [
	{
		name: "Theft",
		keywords: ["steal", "pickpocket", "snatched"],
	},
	{
		name: "Robbery",
		keywords: ["armed", "weapon", "holdup"],
	},
	{
		name: "Vehicle Theft",
		keywords: ["car", "motorcycle", "bike"],
	},
]

export default function ReportsPageClient() {
	const [reports, setReports] = useState(allReports)
	const [search, setSearch] = useState("")
	const [statusFilter, setStatusFilter] = useState("all")
	const [selectedReport, setSelectedReport] = useState(null)
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
	const [categories, setCategories] = useState(allCategories)

	const filteredReports = reports.filter((report) => {
		const matchesSearch =
			report.id.toLowerCase().includes(search.toLowerCase()) ||
			report.title.toLowerCase().includes(search.toLowerCase())
		const matchesStatus = statusFilter === "all" || report.status === statusFilter
		return matchesSearch && matchesStatus
	})

	const handleVerify = (id) => {
		setReports(reports.map((r) => (r.id === id ? { ...r, status: "verified" } : r)))
	}

	const handleReject = (id, reason) => {
		setReports(reports.map((r) => (r.id === id ? { ...r, status: "rejected", rejectionReason: reason } : r)))
	}

	return (
		<div className="flex min-h-screen bg-white">
			{/* Sidebar */}
			<aside className="flex flex-col w-64 bg-red-600 text-white min-h-screen justify-between fixed left-0 top-0 z-20">
				<div>
					{/* Logo */}
					<div className="flex items-center gap-2 h-16 px-6 border-b border-red-500">
						<img src="/placeholder-logo.svg" alt="ReportIt Logo" className="h-8 w-8" />
						<span className="text-2xl font-bold tracking-tight">ReportIt</span>
					</div>
					{/* Menu */}
					<nav className="flex flex-col gap-2 mt-8 px-6">
						<Link
							href="/admin"
							className="py-2 px-3 rounded-md text-lg font-medium hover:bg-white/10 transition-colors"
						>
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
							className="py-2 px-3 rounded-md text-lg font-medium bg-white/10"
						>
							Manage Reports
						</Link>
					</nav>
				</div>
				{/* Logout */}
				<div className="mb-8 px-6">
					<button className="w-full py-2 px-3 rounded-md text-lg font-medium bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2">
						<LogOut className="w-5 h-5" /> Log out
					</button>
				</div>
			</aside>
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
						<button className="bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg px-6 py-2 text-base transition-colors">
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
					<div className="flex flex-col gap-4">
						{filteredReports.map((report) => (
							<div
								key={report.id}
								className="rounded-2xl border border-gray-300 p-6 bg-white flex flex-col gap-2 md:flex-row md:items-center md:justify-between shadow-sm hover:shadow-md transition-shadow"
							>
								<div className="flex flex-col gap-2 flex-1">
									<div className="flex items-center gap-3">
										<span className="font-bold text-lg md:text-xl text-red-600">
											{report.id}
										</span>
										<span className="font-bold text-lg md:text-xl text-red-600">
											{report.title}
										</span>
										{report.status === "pending" && (
											<span className="ml-2 px-2 py-0.5 rounded border text-xs font-medium bg-white text-black border-black">
												Pending
											</span>
										)}
										{report.status === "verified" && (
											<span className="ml-2 px-2 py-0.5 rounded border text-xs font-medium bg-white text-green-600 border-green-400">
												Verified
											</span>
										)}
										{report.status === "rejected" && (
											<span className="ml-2 px-2 py-0.5 rounded border text-xs font-medium bg-white text-red-600 border-red-400">
												Rejected
											</span>
										)}
									</div>
									<div className="text-gray-500 text-sm mt-1">
										{report.location} &nbsp; {report.timestamp} &nbsp; {report.hasMedia && 'Has media'}
									</div>
								</div>
								<div className="flex flex-col md:flex-row md:items-center gap-2 mt-2 md:mt-0">
									{report.status === "pending" && (
										<div className="flex gap-2">
											<button
												className="flex items-center gap-1 px-6 py-2 rounded-lg border border-green-400 text-green-600 font-medium bg-white hover:bg-green-50 transition-colors text-base"
												onClick={() => setReports(
													reports.map((r) =>
														r.id === report.id ? { ...r, status: "verified" } : r,
													),
												)}
											>
												✓ Verify
											</button>
											<button
												className="flex items-center gap-1 px-6 py-2 rounded-lg border border-red-400 text-red-600 font-medium bg-white hover:bg-red-50 transition-colors text-base"
												onClick={() => setReports(
													reports.map((r) =>
														r.id === report.id ? { ...r, status: "rejected" } : r,
													),
												)}
											>
												✗ Reject
											</button>
										</div>
									)}
									<button
										className="px-6 py-2 rounded-lg border border-red-400 text-red-500 font-medium bg-white hover:bg-red-50 transition-colors text-base"
										onClick={() => {
											setSelectedReport(report)
											setIsDialogOpen(true)
										}}
									>
										View Details
									</button>
								</div>
							</div>
						))}
						{filteredReports.length === 0 && (
							<div className="text-center text-gray-400 py-12">No reports found</div>
						)}
					</div>
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
							setCategories((prev) => [...prev, { name, keywords }])
						}}
					/>
				</div>
			</main>
		</div>
	)
}
