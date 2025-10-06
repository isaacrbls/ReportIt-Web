"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, Brain, Shield, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isUserAdmin } from "@/lib/userMapping";
import { useReports } from "@/contexts/ReportsContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { reverseGeocode } from "@/lib/mapUtils";
import apiClient from "@/lib/apiClient";
import { 
  generateMockMLData, 
  getRiskBadge, 
  getConfidenceBadge, 
  getPriorityBadge 
} from "@/lib/mlUtils";
import "@/styles/recent-reports-custom.css";

export function RecentReports({ 
	singleReport, 
	onVerify, 
	onReject, 
	onViewDetails, 
	statusFilter, 
	barangay, 
	enablePagination = false, 
	reportsPerPage = 3 
}) {
	const [actionStatus, setActionStatus] = useState({}); 
	const [currentPage, setCurrentPage] = useState(1);
	const [resolvedAddresses, setResolvedAddresses] = useState({});
	const [mlDataCache, setMlDataCache] = useState({});
	const { user } = useCurrentUser();
	const { reports, getReportsByBarangay } = useReports();
	const isAdmin = isUserAdmin(user?.email);

	const allReports = singleReport ? [singleReport] : getReportsByBarangay(barangay);

	// Helper function to get ML data for a report (either from backend or process with ML API)
	const getReportMLData = async (report) => {
		// If report has ML data from backend with confidence > 0.5, use it
		if (report.ml_processed && report.ml_predicted_category && report.ml_confidence && report.ml_confidence > 0.5) {
			console.log("📊 Using existing ML data:", report.ml_confidence);
			return {
				ml_predicted_category: report.ml_predicted_category,
				ml_confidence: report.ml_confidence,
				risk_level: report.risk_level || 'medium',
				priority: report.priority || 'medium',
				ml_processed: true
			};
		}

		// If no reliable ML data, process with ML API to get real confidence
		try {
			console.log("🤖 Processing report with ML API...");
			const mlResult = await apiClient.processReportML({
				title: report.Title || report.title || '',
				description: report.Description || report.description || '',
				incident_type: report.IncidentType || report.incident_type || ''
			});

			console.log("✅ ML processing result:", mlResult);
			return {
				ml_predicted_category: mlResult.ml_predicted_category,
				ml_confidence: mlResult.ml_confidence,
				risk_level: mlResult.risk_level,
				priority: mlResult.priority,
				ml_processed: true
			};
		} catch (error) {
			console.error('❌ ML processing failed:', error);
			
			// Fallback to manual assignment based on incident type
			const incidentType = report.IncidentType || report.incident_type || '';
			const manualResult = getManualPriorityAndRisk(incidentType);
			
			console.log("� Using manual classification:", manualResult);
			return {
				ml_predicted_category: incidentType || 'Others',
				ml_confidence: manualResult.confidence,
				risk_level: manualResult.riskLevel.toLowerCase(),
				priority: manualResult.priority.toLowerCase(),
				ml_processed: false
			};
		}
	};

	// Manual priority and risk assignment function
	const getManualPriorityAndRisk = (incidentType) => {
		const mappings = {
			'Theft': { priority: 'High', riskLevel: 'High', confidence: 0.85 },
			'Assault/Harassment': { priority: 'High', riskLevel: 'High', confidence: 0.90 },
			'Drugs Addiction': { priority: 'High', riskLevel: 'High', confidence: 0.88 },
			'Missing Person': { priority: 'High', riskLevel: 'High', confidence: 0.92 },
			'Scam/Fraud': { priority: 'High', riskLevel: 'Medium', confidence: 0.75 },
			'Accident': { priority: 'Medium', riskLevel: 'High', confidence: 0.80 },
			'Property Damage/Incident': { priority: 'Medium', riskLevel: 'Medium', confidence: 0.70 },
			'Verbal Abuse and Threats': { priority: 'Medium', riskLevel: 'Medium', confidence: 0.72 },
			'Alarm and Scandal': { priority: 'Medium', riskLevel: 'Low', confidence: 0.65 },
			'Defamation Complaint': { priority: 'Medium', riskLevel: 'Low', confidence: 0.68 },
			'Reports/Agreement': { priority: 'Low', riskLevel: 'Low', confidence: 0.60 },
			'Debt / Unpaid Wages Report': { priority: 'Low', riskLevel: 'Low', confidence: 0.62 },
			'Animal Incident': { priority: 'Low', riskLevel: 'Medium', confidence: 0.55 },
			'Lost Items': { priority: 'Low', riskLevel: 'Low', confidence: 0.50 },
			'Others': { priority: 'Low', riskLevel: 'Low', confidence: 0.45 }
		};

		return mappings[incidentType] || { priority: 'Low', riskLevel: 'Low', confidence: 0.45 };
	};

	// Synchronous function to get ML data from cache or provide fallback
	const getMLDataSync = (report) => {
		// Try to get from cache first
		if (mlDataCache[report.id]) {
			return mlDataCache[report.id];
		}

		// Fallback to manual classification while ML processing is in progress
		const incidentType = report.IncidentType || report.incident_type || '';
		const manualResult = getManualPriorityAndRisk(incidentType);
		
		return {
			ml_predicted_category: incidentType || 'Others',
			ml_confidence: manualResult.confidence,
			risk_level: manualResult.riskLevel.toLowerCase(),
			priority: manualResult.priority.toLowerCase(),
			ml_processed: false
		};
	};

	useEffect(() => {
		console.log("📄 RecentReports - Resetting page to 1 due to change in reports length/barangay/filter");
		setCurrentPage(1);
	}, [allReports?.length, barangay, statusFilter]);

	// Effect to resolve street addresses for all reports
	useEffect(() => {
		const resolveAddresses = async () => {
			const newAddresses = {};
			
			for (const report of allReports) {
				if (report.Latitude && report.Longitude && !resolvedAddresses[report.id]) {
					try {
						const address = await reverseGeocode(report.Latitude, report.Longitude);
						newAddresses[report.id] = address;
					} catch (error) {
						console.warn(`Failed to resolve address for report ${report.id}:`, error);
						newAddresses[report.id] = report.Barangay || "Unknown Location";
					}
				}
			}
			
			if (Object.keys(newAddresses).length > 0) {
				setResolvedAddresses(prev => ({ ...prev, ...newAddresses }));
			}
		};

		if (allReports.length > 0) {
			resolveAddresses();
		}
	}, [allReports, resolvedAddresses]);

	// Effect to process ML data for all reports
	useEffect(() => {
		const processMLData = async () => {
			const newMLData = {};
			
			for (const report of allReports) {
				if (!mlDataCache[report.id]) {
					try {
						const mlData = await getReportMLData(report);
						newMLData[report.id] = mlData;
					} catch (error) {
						console.error(`Failed to process ML data for report ${report.id}:`, error);
						// Use fallback data
						const incidentType = report.IncidentType || report.incident_type || '';
						const manualResult = getManualPriorityAndRisk(incidentType);
						newMLData[report.id] = {
							ml_predicted_category: incidentType || 'Others',
							ml_confidence: manualResult.confidence,
							risk_level: manualResult.riskLevel.toLowerCase(),
							priority: manualResult.priority.toLowerCase(),
							ml_processed: false
						};
					}
				}
			}
			
			if (Object.keys(newMLData).length > 0) {
				setMlDataCache(prev => ({ ...prev, ...newMLData }));
			}
		};

		if (allReports.length > 0) {
			processMLData();
		}
	}, [allReports]);

	const filteredReports = useMemo(() => {
		if (!statusFilter || statusFilter === "all") return allReports;
		
		const normalized = statusFilter.toString().trim().toLowerCase();
		const statusValue = normalized.charAt(0).toUpperCase() + normalized.slice(1);
		
		return allReports.filter(report => report.Status === statusValue);
	}, [allReports, statusFilter]);

	const sortedReports = useMemo(() => {
		return [...filteredReports].sort((a, b) => {
			const dateA = a.DateTime?.seconds ? new Date(a.DateTime.seconds * 1000) : new Date(a.DateTime || 0);
			const dateB = b.DateTime?.seconds ? new Date(b.DateTime.seconds * 1000) : new Date(b.DateTime || 0);
			return dateB - dateA;
		});
	}, [filteredReports]);

	const paginationData = useMemo(() => {
		
		const accessibleReports = sortedReports.filter(report => {
			return isAdmin || !report?.isSensitive;
		});

		if (!enablePagination) {
			return {
				currentReports: accessibleReports,
				totalReports: accessibleReports.length,
				totalPages: 1,
				startIndex: 1,
				endIndex: accessibleReports.length
			};
		}

		const totalReports = accessibleReports.length;
		const totalPages = Math.ceil(totalReports / reportsPerPage);
		const startIndex = (currentPage - 1) * reportsPerPage;
		const endIndex = Math.min(startIndex + reportsPerPage, totalReports);
		const currentReports = accessibleReports.slice(startIndex, endIndex);

		const result = {
			currentReports,
			totalReports,
			totalPages,
			startIndex: startIndex + 1,
			endIndex
		};
		
		console.log("📄 RecentReports - Pagination data:", {
			currentPage,
			totalPages,
			totalReports,
			enablePagination,
			reportsPerPage
		});
		
		return result;
	}, [sortedReports, currentPage, reportsPerPage, enablePagination, isAdmin]);

	const handlePreviousPage = () => {
		console.log("📄 RecentReports - Previous page clicked, current:", currentPage);
		setCurrentPage(prev => Math.max(prev - 1, 1));
	};

	const handleNextPage = () => {
		console.log("📄 RecentReports - Next page clicked, current:", currentPage, "total:", paginationData.totalPages);
		setCurrentPage(prev => Math.min(prev + 1, paginationData.totalPages));
	};

	const handlePageClick = (pageNumber) => {
		console.log("📄 RecentReports - Page number clicked:", pageNumber, "current:", currentPage);
		setCurrentPage(pageNumber);
	};

	const formatDate = (dateValue) => {
		if (!dateValue) return "-";
		let date;
		
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
		if (onVerify) {
			// Use the onVerify function passed from parent
			await onVerify(id);
			setActionStatus((prev) => ({ ...prev, [id]: "verified" }));
		} else {
			// Fallback to direct Firebase update if no onVerify prop
			try {
				await updateDoc(doc(db, "reports", id), { Status: "Verified" });
				setActionStatus((prev) => ({ ...prev, [id]: "verified" }));
			} catch (e) {
				console.error("Error verifying report:", e);
			}
		}
	};

	const handleReject = async (id, reason = null) => {
		if (onReject) {
			// Use the onReject function passed from parent
			await onReject(id, reason);
			setActionStatus((prev) => ({ ...prev, [id]: "rejected" }));
		} else {
			// Fallback to direct Firebase update if no onReject prop
			try {
				await updateDoc(doc(db, "reports", id), { Status: "Rejected" });
				setActionStatus((prev) => ({ ...prev, [id]: "rejected" }));
			} catch (e) {
				console.error("Error rejecting report:", e);
			}
		}
	};

	return (
		<div className="space-y-4">
			{}
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
				paginationData.currentReports.map((report) => {
					// Debug logging to help identify status issues
					console.log(`Report ${report.id}:`, {
						status: report.Status,
						statusType: typeof report.Status,
						statusLower: report.Status?.toLowerCase?.(),
						canShowButtons: (report.Status?.toLowerCase?.() === "pending" || 
										!report.Status || 
										report.Status.toLowerCase() === "pending" ||
										(typeof report.Status === 'string' && report.Status.trim().toLowerCase() === 'pending'))
					});
					
					return (
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
							{resolvedAddresses[report.id] && (
								<>
									<span className="text-sm text-gray-500">•</span>
									<span className="text-sm text-gray-500">
										{resolvedAddresses[report.id]}
									</span>
								</>
							)}
							<span className="text-sm text-gray-500">•</span>
							<span className="text-sm text-gray-500">
								{formatDate(report.DateTime)}
							</span>
							{report.hasMedia && (
								<span className="text-sm text-gray-400">• Has media</span>
							)}
						</div>

						{/* ML Features: Risk, Priority, and Confidence Badges */}
						{(() => {
							const mlData = getMLDataSync(report);
							const riskBadge = getRiskBadge(mlData.risk_level);
							const confidenceBadge = getConfidenceBadge(mlData.ml_confidence);
							const priorityBadge = getPriorityBadge(mlData.priority);

							return (
								<div className="flex flex-wrap items-center gap-2 mb-3 px-1 md:px-2">
									{/* Risk Badge */}
									<span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${riskBadge.bg} ${riskBadge.text}`}>
										<Shield className="h-3 w-3" />
										{riskBadge.label}
									</span>

									{/* Priority Badge */}
									<span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${priorityBadge.bg} ${priorityBadge.text} ${priorityBadge.border}`}>
										<AlertTriangle className="h-3 w-3" />
										{priorityBadge.label}
									</span>

									{/* ML Confidence Badge */}
									<span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${confidenceBadge.bg} ${confidenceBadge.text}`}>
										<Brain className="h-3 w-3" />
										{confidenceBadge.label}
									</span>

									{/* Predicted Category (if different from incident type) */}
									{mlData.ml_predicted_category && mlData.ml_predicted_category !== (report.IncidentType || report.incident_type) && (
										<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
											ML: {mlData.ml_predicted_category}
										</span>
									)}
								</div>
							);
						})()}
						<div className="flex flex-row gap-3 items-center mt-2 px-1 md:px-2 pb-1">
							{/* Show verify/reject buttons for pending reports (handle various case formats) */}
							{(report.Status?.toLowerCase?.() === "pending" || 
							  !report.Status || 
							  report.Status.toLowerCase() === "pending" ||
							  (typeof report.Status === 'string' && report.Status.trim().toLowerCase() === 'pending')) && (
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
				);})
			)}

			{}
			{enablePagination && paginationData.totalPages > 1 && (
				<div className="flex justify-center items-center mt-8 pt-6 border-t border-gray-200">
					<div className="flex items-center gap-2">
						{}
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

						{}
						<div className="flex items-center gap-1">
							{Array.from({ length: paginationData.totalPages }, (_, i) => i + 1).map((pageNumber) => {
								
								const showPage = 
									pageNumber === 1 || 
									pageNumber === paginationData.totalPages || 
									Math.abs(pageNumber - currentPage) <= 1;

								if (!showPage) {
									
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

						{}
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

			{}
			{enablePagination && paginationData.totalPages > 1 && (
				<div className="text-center text-xs text-gray-500 mt-2">
				</div>
			)}
		</div>
	);
}
