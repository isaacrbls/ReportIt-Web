"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { AlertTriangle, CheckCircle } from "lucide-react";
import dynamic from "next/dynamic";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useHybridReports } from "@/contexts/HybridReportsContext";
import { db, storage } from "@/firebase";
import { collection, addDoc, serverTimestamp, GeoPoint } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";


const MapWithNoSSR = dynamic(() => import("./map-component"), {
  ssr: false,
  loading: () => <div className="flex h-[220px] w-full items-center justify-center bg-gray-100">Loading map...</div>,
});

export default function AddReportDialog({ open, onClose, barangay, categories = [] }) {
  const [incidentType, setIncidentType] = useState("");
  const [description, setDescription] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState("");
  const [incidentLocation, setIncidentLocation] = useState(null);
  const [addingIncident, setAddingIncident] = useState(false);
  const [error, setError] = useState("");
  const [uploadFailed, setUploadFailed] = useState(false);
  const [isSensitive, setIsSensitive] = useState(false);
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customDateTime, setCustomDateTime] = useState("");
  


  const defaultCategories = [
    "Theft",
    "Reports/Agreement", 
    "Accident",
    "Debt / Unpaid Wages Report",
    "Defamation Complaint",
    "Assault/Harassment",
    "Property Damage/Incident",
    "Animal Incident",
    "Verbal Abuse and Threats",
    "Alarm and Scandal",
    "Lost Items",
    "Scam/Fraud",
    "Drugs Addiction",
    "Missing Person",
    "Others"
  ];

  const allCategories = [
    ...defaultCategories,
    ...categories.map(cat => cat.name || cat).filter(catName => !defaultCategories.includes(catName))
  ];

  const { user } = useCurrentUser();
  const { createReport, error: hybridError, setError: setHybridError } = useHybridReports();

  console.log("🎯 AddReportDialog - Received barangay prop:", barangay);
  console.log("👤 AddReportDialog - Current user:", user?.email);

  // Priority and Risk Level mapping based on incident types
  const getPriorityAndRisk = (incidentType) => {
    const mappings = {
      'Theft': { priority: 'High', riskLevel: 'High' },
      'Assault/Harassment': { priority: 'High', riskLevel: 'High' },
      'Drugs Addiction': { priority: 'High', riskLevel: 'High' },
      'Missing Person': { priority: 'High', riskLevel: 'High' },
      'Scam/Fraud': { priority: 'High', riskLevel: 'Medium' },
      'Accident': { priority: 'Medium', riskLevel: 'High' },
      'Property Damage/Incident': { priority: 'Medium', riskLevel: 'Medium' },
      'Verbal Abuse and Threats': { priority: 'Medium', riskLevel: 'Medium' },
      'Alarm and Scandal': { priority: 'Medium', riskLevel: 'Low' },
      'Defamation Complaint': { priority: 'Medium', riskLevel: 'Low' },
      'Reports/Agreement': { priority: 'Low', riskLevel: 'Low' },
      'Debt / Unpaid Wages Report': { priority: 'Low', riskLevel: 'Low' },
      'Animal Incident': { priority: 'Low', riskLevel: 'Medium' },
      'Lost Items': { priority: 'Low', riskLevel: 'Low' },
      'Others': { priority: 'Low', riskLevel: 'Low' }
    };

    return mappings[incidentType] || { priority: 'Low', riskLevel: 'Low' };
  };



  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      
      setMediaType(file.type.startsWith("video") ? "video" : "photo");
    }
  };

  const handleMapClick = (latlng) => {
    setIncidentLocation(latlng);
  };

  const handleSubmit = async () => {
    setError("");
    setUploadFailed(false);
    if (!incidentType.trim()) {
      setError("Please enter a description first to predict the incident type.");
      return;
    }
    if (!description.trim()) {
      setError("Please enter a description.");
      return;
    }
    if (!incidentLocation || incidentLocation.length !== 2) {
      setError("Please pin the incident location on the map.");
      return;
    }

    await submitReport(false);
  };

  const handleSubmitWithoutMedia = async () => {
    await submitReport(true);
  };

  const submitReport = async (skipMedia = false) => {
    try {
      setAddingIncident(true);
      setError("");
      setHybridError(null);
      console.log("� Starting hybrid report submission...");

      const [lat, lng] = incidentLocation;
      
      // Get priority and risk level based on incident type
      const { priority, riskLevel } = getPriorityAndRisk(incidentType.trim());
      console.log("🎯 Incident Type:", incidentType.trim());
      console.log("📊 Assigned Priority:", priority);
      console.log("⚠️ Assigned Risk Level:", riskLevel);
      
      // Report data
      const reportData = {
        title: incidentType.trim(),
        incidentType: incidentType.trim(),
        description: description.trim(),
        barangay: barangay || "",
        latitude: lat,
        longitude: lng,
        mediaFile: skipMedia ? null : mediaFile,
        mediaType: mediaType,
        isSensitive: isSensitive,
        useCustomTime: useCustomTime,
        customDateTime: customDateTime,
        
        // Priority and Risk Level based on incident type
        priority: priority,
        riskLevel: riskLevel,
        
        // Auto-verification for admin-created reports
        status: 'Verified',
        verified_by_email: user?.email,
        verified_at: new Date().toISOString(),
        auto_verified: true,
        verification_reason: 'Auto-verified: Created by admin'
      };

      // Use hybrid context to create report (saves to both Firebase and Django)
      await createReport(reportData, true); // enableDual = true
      console.log("✅ Report saved successfully via hybrid context!");

      setIncidentType("");
      setDescription("");
      setMediaFile(null);
      setMediaType("");
      setIncidentLocation(null);
      setIsSensitive(false);
      setUseCustomTime(false);
      setCustomDateTime("");
      onClose?.(false);
    } catch (e) {
      console.error("❌ Error submitting report:", e);
      console.error("❌ Error details:", e.message);

      if (mediaFile && !skipMedia && e.message.includes("Upload")) {
        setUploadFailed(true);
        setError(`${e.message} Would you like to submit the report without media?`);
      } else {
        setError(`Failed to submit report: ${e.message}`);
      }
    } finally {
      setAddingIncident(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full p-0 bg-transparent border-none shadow-none flex items-center justify-center min-h-screen overflow-y-auto">
        <div className="bg-white rounded-2xl border p-10 shadow-sm w-[500px] flex flex-col items-stretch max-w-full max-h-[90vh] overflow-y-auto relative">
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold w-6 h-6 flex items-center justify-center bg-transparent border-0 outline-0 focus:outline-0 shadow-none"
            style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
            onClick={() => onClose(false)}
          >
            ×
          </button>
          <DialogTitle className="text-red-500 text-2xl font-bold mb-4 pr-8">Detail of report</DialogTitle>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Type of incident</label>
            <select
              className="w-full border rounded-lg px-4 py-2 focus:outline-none"
              value={incidentType}
              onChange={e => setIncidentType(e.target.value)}
            >
              <option value="">Select type of incident</option>
              {allCategories.map((category, index) => (
                <option key={index} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full border rounded-lg px-4 py-2 focus:outline-none min-h-[80px]"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the incident"
            />
          </div>

          {/* Auto-verification notice */}
          <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-400 rounded">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Auto-verification: Report will be marked as verified upon creation
              </span>
            </div>
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={isSensitive}
                onChange={e => setIsSensitive(e.target.checked)}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span>Mark as sensitive (only visible to admin users)</span>
            </label>
          </div>
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={useCustomTime}
                onChange={e => setUseCustomTime(e.target.checked)}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span>Set custom date and time</span>
            </label>
            {useCustomTime && (
              <input
                type="datetime-local"
                value={customDateTime}
                onChange={e => setCustomDateTime(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none"
                placeholder="Select date and time"
              />
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Add photo or video</label>
            <div className="flex gap-4 justify-center">
              <label className="flex flex-col items-center justify-center border rounded-lg px-12 py-8 text-red-500 border-red-200 bg-red-50 hover:bg-red-100 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5V6a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 6v1.5M3 7.5h18M3 7.5v10.125A2.625 2.625 0 0 0 5.625 20.25h12.75A2.625 2.625 0 0 0 21 17.625V7.5M7.5 11.25l2.25 2.25 3-3.75 4.5 6" />
                </svg>
                <span className="font-medium text-base">Photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
              <label className="flex flex-col items-center justify-center border rounded-lg px-12 py-8 text-red-500 border-red-200 bg-red-50 hover:bg-red-100 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V6.75A2.25 2.25 0 0 0 13.5 4.5h-3A2.25 2.25 0 0 0 8.25 6.75V9m7.5 0v6m0-6h1.5A2.25 2.25 0 0 1 19.5 11.25v1.5A2.25 2.25 0 0 1 18 15h-1.5m-7.5-6v6m0-6H6.75A2.25 2.25 0 0 0 4.5 11.25v1.5A2.25 2.25 0 0 0 6 15h1.5" />
                </svg>
                <span className="font-medium text-base">Video</span>
                <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
            {mediaFile && (
              <div className="mt-2 text-xs text-gray-600 text-center">
                Selected: {mediaFile.name}
              </div>
            )}
          </div>
          <div className="mb-6 flex justify-center">
            <div className="w-[400px] h-[220px] bg-[#F8E3DE] rounded-lg flex items-center justify-center overflow-hidden">
              <MapWithNoSSR
                addingIncident={true}
                onMapClick={handleMapClick}
                newIncidentLocation={incidentLocation}
                barangay={barangay}
                hotspots={[]} 
              />
            </div>
          </div>
          {error && (
            <div className="mb-4 text-sm text-red-600">{error}</div>
          )}
          <div className="flex justify-between gap-4">
            <button
              className="border border-red-400 text-red-500 px-8 py-2 rounded-md"
              onClick={() => {
                setError("");
                setUploadFailed(false);
                onClose?.();
              }}
            >
              Back
            </button>
            <div className="flex gap-2">
              {uploadFailed && (
                <button
                  className="bg-orange-500 text-white px-6 py-2 rounded-md disabled:opacity-60"
                  onClick={handleSubmitWithoutMedia}
                  disabled={addingIncident}
                >
                  {addingIncident ? "Submitting..." : "Submit without media"}
                </button>
              )}
              <button
                className="bg-red-500 text-white px-8 py-2 rounded-md disabled:opacity-60"
                onClick={handleSubmit}
                disabled={addingIncident}
              >
                {addingIncident ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
