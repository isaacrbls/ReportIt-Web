"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { collection, getDocs, doc, updateDoc, query as fsQuery, where } from "firebase/firestore";
import { db } from "@/firebase";
import "@/styles/recent-reports-custom.css";

export function RecentReports({ singleReport, onVerify, onReject, onViewDetails, statusFilter }) {
	const [reports, setReports] = useState(singleReport ? [singleReport] : []);
	const [actionStatus, setActionStatus] = useState({}); // { [id]: 'verified' | 'rejected' }

	useEffect(() => {
		if (!singleReport) {
			const fetchReports = async () => {
				let queryRef = collection(db, "reports");
				if (statusFilter && statusFilter !== "All Reports") {
					// Capitalize first letter for Firestore match, but also trim and check for extra spaces
					const statusValue = statusFilter.trim().charAt(0).toUpperCase() + statusFilter.trim().slice(1).toLowerCase();
					queryRef = fsQuery(queryRef, where("Status", "==", statusValue));
				}
				const querySnapshot = await getDocs(queryRef);
				const reportsData = querySnapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				}));
				console.log('Fetched reports:', reportsData); // Debug: see what is fetched
				setReports(reportsData);
			};
			fetchReports();
		} else {
			setReports([singleReport]);
		}
	}, [singleReport, statusFilter]);

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
			setReports((prev) => prev.map((r) => r.id === id ? { ...r, Status: "Verified" } : r));
			setActionStatus((prev) => ({ ...prev, [id]: "verified" }));
		} catch (e) {
			console.error(e);
		}
	};

	const handleReject = async (id) => {
		try {
			await updateDoc(doc(db, "reports", id), { Status: "Rejected" });
			setReports((prev) => prev.map((r) => r.id === id ? { ...r, Status: "Rejected" } : r));
			setActionStatus((prev) => ({ ...prev, [id]: "rejected" }));
		} catch (e) {
			console.error(e);
		}
	};

	return (
		<div className="space-y-4">
			{reports.length === 0 ? (
				<Card className="flex flex-col space-y-2 border p-3">
					<CardHeader>
						<CardTitle className="text-base text-gray-400 font-normal">
							No recent reports found.
						</CardTitle>
					</CardHeader>
				</Card>
			) : (
				reports.map((report) => (
					<Card key={report.id} className="flex flex-col border p-5 rounded-2xl shadow-sm transition-all">
						<CardHeader className="flex flex-row items-start justify-between p-0 pb-2">
							<div className="flex-1 flex flex-row items-center gap-3">
								<CardTitle className="text-xl md:text-2xl font-bold text-red-600 flex items-center gap-3">
									{report.IncidentType || <span className="text-gray-400">Untitled</span>}
									{report.Status && (
										<span className={`ml-2 px-3 py-1 rounded-lg border text-xs font-medium ${report.Status.toLowerCase() === 'verified' ? 'bg-green-100 text-green-600 border-green-400' : report.Status.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-600 border-red-400' : 'bg-white text-black border-black'}`}>
											{report.Status.charAt(0).toUpperCase() + report.Status.slice(1)}
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
		</div>
	);
}
