"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { collection, getDocs, doc, updateDoc, query as fsQuery, where } from "firebase/firestore";
import { db } from "@/firebase";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isUserAdmin } from "@/lib/userMapping";
import "@/styles/recent-reports-custom.css";

export function RecentReports({ 
	singleReport, 
	onVerify, 
	onReject, 
	onViewDetails, 
	statusFilter, 
	barangay, 
	enablePagination = false, // New prop to enable pagination
	reportsPerPage = 3 // Default to 3 reports for dashboard
}) {
	const [allReports, setAllReports] = useState(singleReport ? [singleReport] : []);
	const [actionStatus, setActionStatus] = useState({}); // { [id]: 'verified' | 'rejected' }
	const [currentPage, setCurrentPage] = useState(1);
	const { user } = useCurrentUser();
	const isAdmin = isUserAdmin(user?.email);

	// Calculate pagination data
	const paginationData = useMemo(() => {
		// Filter out sensitive reports for non-admin users
		const filteredReports = allReports.filter(report => {
			return isAdmin || !report?.isSensitive;
		});

		if (!enablePagination) {
			return {
				currentReports: filteredReports,
				totalReports: filteredReports.length,
				totalPages: 1,
				startIndex: 1,
				endIndex: filteredReports.length
			};
		}

		const totalReports = filteredReports.length;
		const totalPages = Math.ceil(totalReports / reportsPerPage);
		const startIndex = (currentPage - 1) * reportsPerPage;
		const endIndex = Math.min(startIndex + reportsPerPage, totalReports);
		const currentReports = filteredReports.slice(startIndex, endIndex);

		return {
			currentReports,
			totalReports,
			totalPages,
			startIndex: startIndex + 1,
			endIndex
		};
	}, [allReports, currentPage, reportsPerPage, enablePagination, isAdmin]);

	// Reset to first page when reports change
	useEffect(() => {
		setCurrentPage(1);
	}, [allReports]);

	const handlePreviousPage = () => {
		setCurrentPage(prev => Math.max(prev - 1, 1));
	};

	const handleNextPage = () => {
		setCurrentPage(prev => Math.min(prev + 1, paginationData.totalPages));
	};

	const handlePageClick = (pageNumber) => {
		setCurrentPage(pageNumber);
	};

    useEffect(() => {
		if (!singleReport) {
			const fetchReports = async () => {
				let queryRef = collection(db, "reports");
				const normalized = (statusFilter || "").toString().trim().toLowerCase();
				let filters = [];
				if (normalized && normalized !== "all") {
					const statusValue = normalized.charAt(0).toUpperCase() + normalized.slice(1);
					filters.push(where("Status", "==", statusValue));
				}
				if (barangay) {
					filters.push(where("Barangay", "==", barangay));
				}
				if (filters.length > 0) {
					queryRef = fsQuery(queryRef, ...filters);
				}
				const querySnapshot = await getDocs(queryRef);
				const reportsData = querySnapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				}));
				// Sort by date (newest first)
				const sortedReports = reportsData.sort((a, b) => {
					const dateA = a.DateTime?.seconds ? new Date(a.DateTime.seconds * 1000) : new Date(a.DateTime || 0);
					const dateB = b.DateTime?.seconds ? new Date(b.DateTime.seconds * 1000) : new Date(b.DateTime || 0);
					return dateB - dateA;
				});
				setAllReports(sortedReports);
			};
			fetchReports();
		} else {
			setAllReports([singleReport]);
		}
	}, [singleReport, statusFilter, barangay]);

	const formatDate = (dateValue) => {
		if (!dateValue) return "-";
		let date;
		// Firestore Timestamp object
		if (dateValue.seconds) {
			date = new Date(dateValue.seconds * 1000);
		} else if (typeof dateValue === "string" || typeof dateValue === "number") {
			date = new Date(dateValue);
		} else {
			return "-";
		}
		if (isNaN(date.getTime())) return "-";
		return new Intl.DateTimeFormat("en-US", {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(date);
	};

	const handleVerify = async (id) => {
		try {
			await updateDoc(doc(db, "reports", id), { Status: "Verified" });
			setAllReports((prev) => prev.map((r) => r.id === id ? { ...r, Status: "Verified" } : r));
			setActionStatus((prev) => ({ ...prev, [id]: "verified" }));
		} catch (e) {
			console.error(e);
		}
	};

	const handleReject = async (id) => {
		try {
			await updateDoc(doc(db, "reports", id), { Status: "Rejected" });
			setAllReports((prev) => prev.map((r) => r.id === id ? { ...r, Status: "Rejected" } : r));
			setActionStatus((prev) => ({ ...prev, [id]: "rejected" }));
		} catch (e) {
			console.error(e);
		}
	};

	return (
		<div className="space-y-4">
			{/* Pagination Info for Dashboard */}
			{enablePagination && paginationData.totalReports > reportsPerPage && (
				<div className="flex justify-between items-center text-sm text-gray-600 px-1 mb-2">
					<span>
						Showing {paginationData.startIndex}-{paginationData.endIndex} of {paginationData.totalReports} reports
					</span>
					{paginationData.totalPages > 1 && (
						<span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
							Page {currentPage} of {paginationData.totalPages}
						</span>
					)}
				</div>
			)}

			{paginationData.currentReports.length === 0 ? (
				<Card className="flex flex-col space-y-2 border p-3">
					<CardHeader>
						<CardTitle className="text-base text-gray-400 font-normal">
							No recent reports found.
						</CardTitle>
					</CardHeader>
				</Card>
			) : (
				paginationData.currentReports.map((report) => (
					<Card key={report.id} className="flex flex-col border p-5 rounded-2xl shadow-sm transition-all">
						<CardHeader className="flex flex-row items-start justify-between p-0 pb-2">
							<div className="flex-1 flex flex-row items-center gap-3">
								<CardTitle className="text-xl md:text-2xl font-bold text-red-600 flex items-center gap-3">
									{report.Title || report.IncidentType || <span className="text-gray-400">Untitled</span>}
									{report.Status && (
										<span className={`ml-2 px-3 py-1 rounded-lg border text-xs font-medium ${report.Status.toLowerCase() === 'verified' ? 'bg-green-100 text-green-600 border-green-400' : report.Status.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-600 border-red-400' : 'bg-white text-black border-black'}`}>
											{report.Status.charAt(0).toUpperCase() + report.Status.slice(1)}
										</span>
									)}
									{report.isSensitive && (
										<span className="ml-2 px-3 py-1 rounded-lg bg-orange-100 text-orange-600 border border-orange-400 text-xs font-medium">
											Sensitive
										</span>
									)}
								</CardTitle>
							</div>
							<div className="flex flex-col md:flex-row md:items-center gap-2 md:mt-0 md:self-start md:ml-auto">
								<Button
									variant="outline"
									size="sm"
									className="border border-red-400 text-red-500 font-medium hover:bg-red-50 transition-colors"
									onClick={() => onViewDetails && onViewDetails(report)}
								>
									View Details
								</Button>
							</div>
						</CardHeader>
						<div className="flex flex-row items-center gap-2 mb-3 px-1 md:px-2">
							<span className="text-sm text-gray-500 font-medium">
								{report.Barangay || <span className="text-gray-400">- Barangay</span>}
							</span>
							<span className="text-sm text-gray-500">•</span>
							<span className="text-sm text-gray-500">
								{formatDate(report.DateTime)}
							</span>
							{report.hasMedia && (
								<span className="text-sm text-gray-400">• Has media</span>
							)}
						</div>
						<div className="flex flex-row gap-3 items-center mt-2 px-1 md:px-2 pb-1">
							{report.Status?.toLowerCase?.() === "pending" && (
								<>
									<Button
										variant="outline"
										size="sm"
										className="flex items-center gap-1 border-green-600 btn-verify px-6 py-2 rounded-lg text-green-600 hover:bg-green-50"
										onClick={() => handleVerify(report.id)}
									>
										<CheckCircle className="h-5 w-5" />
										Verify
									</Button>
									<Button
										variant="outline"
									size="sm"
										className="flex items-center gap-1 border-red-600 btn-reject px-6 py-2 rounded-lg text-red-600 hover:bg-red-50"
										onClick={() => handleReject(report.id)}
									>
										<XCircle className="h-5 w-5" />
										Reject
									</Button>
								</>
							)}
						</div>
					</Card>
				))
			)}

			{/* Pagination Controls */}
			{enablePagination && paginationData.totalPages > 1 && (
				<div className="flex justify-center items-center mt-8 pt-6 border-t border-gray-200">
					<div className="flex items-center gap-2">
						{/* Previous Button */}
						<Button
							variant="outline"
							size="sm"
							onClick={handlePreviousPage}
							disabled={currentPage === 1}
							className="flex items-center gap-1 px-3"
						>
							<ChevronLeft className="h-4 w-4" />
							<span className="hidden sm:inline">Previous</span>
						</Button>

						{/* Page Numbers */}
						<div className="flex items-center gap-1">
							{Array.from({ length: paginationData.totalPages }, (_, i) => i + 1).map((pageNumber) => {
								// Show first page, last page, current page, and adjacent pages
								const showPage = 
									pageNumber === 1 || 
									pageNumber === paginationData.totalPages || 
									Math.abs(pageNumber - currentPage) <= 1;

								if (!showPage) {
									// Show ellipsis for gaps
									if (pageNumber === 2 && currentPage > 4) {
										return <span key={pageNumber} className="text-gray-400">...</span>;
									}
									if (pageNumber === paginationData.totalPages - 1 && currentPage < paginationData.totalPages - 3) {
										return <span key={pageNumber} className="text-gray-400">...</span>;
									}
									return null;
								}

								return (
									<Button
										key={pageNumber}
										variant={currentPage === pageNumber ? "default" : "outline"}
										size="sm"
										onClick={() => handlePageClick(pageNumber)}
										className={`w-9 h-9 p-0 ${
											currentPage === pageNumber 
												? "bg-red-500 text-white hover:bg-red-600 border-red-500" 
												: "hover:bg-gray-50"
										}`}
									>
										{pageNumber}
									</Button>
								);
							})}
						</div>

						{/* Next Button */}
						<Button
							variant="outline"
							size="sm"
							onClick={handleNextPage}
							disabled={currentPage === paginationData.totalPages}
							className="flex items-center gap-1 px-3 border-red-400 text-red-500 hover:bg-red-50"
						>
							<span className="hidden sm:inline">Next</span>
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}

			{/* Mobile-friendly pagination info */}
			{enablePagination && paginationData.totalPages > 1 && (
				<div className="text-center text-xs text-gray-500 mt-2">
					Scroll up to see more reports on previous pages
				</div>
			)}
		</div>
	);
}
