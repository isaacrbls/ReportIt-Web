"use client"

import { useState, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import { Calendar, CheckCircle, Clock, FileText, ImageIcon, MapPin, Tag, XCircle, Edit, Trash2, Printer, Move } from "lucide-react"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateReportStatus, formatReportForDisplay, deleteReport, updateReportDetails } from "@/lib/reportUtils"
import { reverseGeocode } from "@/lib/mapUtils"
import { getUserBarangay, USER_BARANGAY_MAP } from "@/lib/userMapping"
import { useCurrentUser } from "@/hooks/use-current-user"
import { trackReportRejection } from "@/lib/suspensionUtils"
import { archiveReport } from "@/lib/archiveUtils"
import { useToast } from "@/hooks/use-toast"
import { GeoPoint } from "firebase/firestore"
import { formatSubmittedBy as fetchUserDisplayName } from "@/lib/userDataUtils"

const MapWithNoSSR = dynamic(() => import("./map-component"), {
  ssr: false,
  loading: () => <div className="flex h-[250px] w-full items-center justify-center bg-gray-100 rounded-lg">Loading map...</div>,
})

;

export function ReportDetailDialog({ report, open, onOpenChange, onVerify, onReject, onDelete, onEdit, categories = [] }) {
  const { user: currentUser } = useCurrentUser()
  const [rejectionReason, setRejectionReason] = useState("")
  const [isRejecting, setIsRejecting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedReport, setEditedReport] = useState({})
  const [error, setError] = useState("")
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedLocation, setEditedLocation] = useState(null)
  const [editedDateTime, setEditedDateTime] = useState("")
  const [isEditingPin, setIsEditingPin] = useState(false)
  const [mapKey, setMapKey] = useState(0)
  const [deleteClickCount, setDeleteClickCount] = useState(0)
  const [deleteTimeout, setDeleteTimeout] = useState(null)
  const [currentReportData, setCurrentReportData] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletionReason, setDeletionReason] = useState("Admin deletion")
  const [resolvedAddress, setResolvedAddress] = useState("")
  const [submittedByDisplayName, setSubmittedByDisplayName] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (report) {
      setCurrentReportData(report)
    }
  }, [report])

  useEffect(() => {
    if (open) {
      const refreshTimeout = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 150);

      return () => clearTimeout(refreshTimeout);
    }
  }, [open])

  // Effect to resolve street address for the report
  useEffect(() => {
    const resolveAddress = async () => {
      if (report && report.Latitude && report.Longitude) {
        try {
          const address = await reverseGeocode(report.Latitude, report.Longitude);
          setResolvedAddress(address);
        } catch (error) {
          setResolvedAddress(report.Barangay || "Unknown Location");
        }
      }
    };

    if (open && report) {
      resolveAddress();
    }
  }, [open, report])

  // Effect to fetch user display name from Realtime Database
  useEffect(() => {
    const loadUserDisplayName = async () => {
      if (report?.SubmittedByEmail || report?.SubmittedBy) {
        const email = report.SubmittedByEmail || report.SubmittedBy;
        console.log(`🔍 Report Detail: Fetching user data for email: ${email}`);
        
        // Set loading state
        setSubmittedByDisplayName('Loading...');
        
        try {
          const displayName = await fetchUserDisplayName(email);
          console.log(`✅ Report Detail: Got display name: ${displayName}`);
          setSubmittedByDisplayName(displayName || email.split('@')[0]);
        } catch (error) {
          console.error('❌ Report Detail: Error fetching user display name:', error);
          // Fallback to username from email
          const fallbackName = email.split('@')[0] || 'Unknown User';
          setSubmittedByDisplayName(fallbackName);
        }
      } else {
        console.log('❌ Report Detail: No email found in report data');
        setSubmittedByDisplayName('Unknown User');
      }
    };

    if (open && report) {
      loadUserDisplayName();
    } else {
      setSubmittedByDisplayName('');
    }
  }, [open, report])

  const formattedReport = useMemo(() => {
    return formatReportForDisplay(currentReportData || report)
  }, [currentReportData, report])

  const stableDisplayData = useMemo(() => {
    const originalReport = report
    const formatted = formatReportForDisplay(originalReport)
    
    return {
      title: formatted?.title,
      date: formatted?.date,
      time: formatted?.time,
      location: formatted?.location,
      category: formatted?.category,
      submittedBy: formatted?.submittedBy,
      isSensitive: originalReport?.isSensitive,
      status: originalReport?.Status || 'Pending'
    }
  }, [
    report?.Title,
    report?.IncidentType,
    report?.DateTime,
    report?.Barangay,
    report?.isSensitive,
    report?.Status,
    report?.SubmittedBy
  ])



  const mapBarangay = report?.Barangay;
  
  const reportLocation = useMemo(() => {
    const mapLatitude = isEditMode && editedLocation ? editedLocation[0] : report?.Latitude;
    const mapLongitude = isEditMode && editedLocation ? editedLocation[1] : report?.Longitude;
    return mapLatitude && mapLongitude ? [mapLatitude, mapLongitude] : null;
  }, [isEditMode, editedLocation, report?.Latitude, report?.Longitude]);
  
  const handleMapClick = (location) => {
    if (isEditMode && isEditingPin) {
      setEditedLocation(location)
    }
  }
  
  const renderMapComponent = () => {
    const addingIncidentProp = isEditMode && isEditingPin;
    const onMapClickProp = isEditMode && isEditingPin ? handleMapClick : undefined;
    
    if (reportLocation && reportLocation.length === 2) {
      // Prepare the report data for the map component
      const reportForMap = [currentReportData || report];
      
      return (
        <MapWithNoSSR
          key={`report-map-${mapKey}`}
          center={reportLocation}
          zoom={18}
          showPins={true}
          showHotspots={false}
          showControls={false}
          showPopups={false}
          barangay={mapBarangay}
          newIncidentLocation={reportLocation}
          preloadedIncidents={reportForMap}
          addingIncident={addingIncidentProp}
          onMapClick={onMapClickProp}
        />
      );
    }
    return (
      <div className="text-gray-500 text-center">
        <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
        <p>No location data available</p>
      </div>
    );
  };

  useEffect(() => {
    if (isEditMode && (currentReportData || report)) {
      const reportToEdit = currentReportData || report
      setEditedReport({
        Title: reportToEdit.Title || reportToEdit.IncidentType || "",
        IncidentType: reportToEdit.IncidentType || "",
        Description: reportToEdit.Description || "",
        Barangay: reportToEdit.Barangay || "",
        isSensitive: reportToEdit.isSensitive || false
      })
      
      if (reportToEdit.Latitude && reportToEdit.Longitude) {
        setEditedLocation([reportToEdit.Latitude, reportToEdit.Longitude])
      }
      
      if (reportToEdit.DateTime) {
        try {
          const dateObj = reportToEdit.DateTime.toDate ? reportToEdit.DateTime.toDate() : new Date(reportToEdit.DateTime)
          const year = dateObj.getFullYear()
          const month = String(dateObj.getMonth() + 1).padStart(2, '0')
          const day = String(dateObj.getDate()).padStart(2, '0')
          const hours = String(dateObj.getHours()).padStart(2, '0')
          const minutes = String(dateObj.getMinutes()).padStart(2, '0')
          setEditedDateTime(`${year}-${month}-${day}T${hours}:${minutes}`)
        } catch (e) {
        }
      }
      
      setError("")
    }
  }, [isEditMode, currentReportData, report])

  useEffect(() => {
    if (!open) {
      setError("")
      setEditedReport({})
      setIsEditMode(false)
      setDeleteClickCount(0)
      setCurrentReportData(null)
      setShowDeleteConfirm(false)
      setEditedLocation(null)
      setEditedDateTime("")
      setIsEditingPin(false)
      if (deleteTimeout) {
        clearTimeout(deleteTimeout)
        setDeleteTimeout(null)
      }
    }
  }, [open, deleteTimeout])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!open) return
      
      if (e.key === 'Escape') {
        if (isEditMode) {
          setIsEditMode(false)
          setError("")
        } else {
          onOpenChange(false)
        }
      }
      
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        if (isEditMode && !isSaving) {
          handleSaveEdit()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, isEditMode, isSaving])

  if (!report) return null

  const handleVerify = async () => {
    setIsVerifying(true)
    try {
      const success = await updateReportStatus(report.id, "Verified")
      if (success) {
        setCurrentReportData(prevData => ({
          ...(prevData || report),
          Status: "Verified"
        }))
        
        toast({
          title: "Report Verified",
          description: "The report has been successfully verified.",
        })
        onVerify?.(report.id)
        onOpenChange(false)
      } else {
        toast({
          title: "Verification Failed",
          description: "Failed to verify the report. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Error verifying report: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    setIsRejecting(true)
    try {
      const success = await updateReportStatus(report.id, "Rejected")
      if (success) {
        // Track the rejection for suspension system
        const userEmail = report.SubmittedBy;
        
        if (userEmail) {
          try {
            await trackReportRejection(
              userEmail, 
              report.id, 
              rejectionReason.trim(),
              currentUser?.email || 'Unknown Admin'
            );
            console.log(`✅ Rejection tracked for user: ${userEmail}`);
          } catch (suspensionError) {
            console.error("Error tracking rejection for suspension:", suspensionError);
            // Continue with rejection even if suspension tracking fails
          }
        }

        setCurrentReportData(prevData => ({
          ...(prevData || report),
          Status: "Rejected"
        }))
        
        toast({
          title: "Report Rejected",
          description: "The report has been rejected and the user has been notified.",
        })
        onReject?.(report.id)
        onOpenChange(false)
      } else {
        toast({
          title: "Rejection Failed",
          description: "Failed to reject the report. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Error rejecting report: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsRejecting(false)
    }
  }

  const handleDelete = () => {
    setDeletionReason("Admin deletion") // Reset to default
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    setError("")
    try {
      // First archive the report before deleting
      const archiveSuccess = await archiveReport(
        currentReportData || report, // Pass the full report object
        currentUser?.email || 'Unknown Admin', // deletedBy
        deletionReason // Use selected deletion reason
      );
      
      if (archiveSuccess) {
        // Now delete the report from active collection
        const deleteSuccess = await deleteReport(report.id);
        
        if (deleteSuccess) {
          toast({
            title: "Report Deleted",
            description: "The report has been archived and removed from active reports.",
          })
          onDelete?.(report.id)
          onOpenChange(false)
        } else {
          // If deletion fails but archive succeeded, we should handle this gracefully
          setError("Report was archived but failed to remove from active reports. Please try again.")
          toast({
            title: "Deletion Failed",
            description: "Report was archived but failed to remove from active reports.",
            variant: "destructive",
          })
        }
      } else {
        setError("Failed to archive report. Deletion cancelled.")
        toast({
          title: "Archive Failed",
          description: "Failed to archive the report before deletion. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMessage = `Error processing report deletion: ${error.message}`
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setDeletionReason("Admin deletion") // Reset to default
  }

  const handleEdit = () => {
    setIsEditMode(true)
  }

  const handleSaveEdit = async () => {
    setIsSaving(true)
    setError("")

    if (!editedReport.Title?.trim()) {
      setError("Title is required")
      setIsSaving(false)
      return
    }
    if (!editedReport.IncidentType?.trim()) {
      setError("Incident type is required")
      setIsSaving(false)
      return
    }
    if (!editedReport.Description?.trim()) {
      setError("Description is required")
      setIsSaving(false)
      return
    }

    try {
      const updateData = { ...editedReport }
      
      if (editedLocation) {
        updateData.Latitude = editedLocation[0]
        updateData.Longitude = editedLocation[1]
        updateData.GeoLocation = new GeoPoint(editedLocation[0], editedLocation[1])
      }
      
      if (editedDateTime) {
        updateData.DateTime = new Date(editedDateTime)
      }
      
      const success = await updateReportDetails(report.id, updateData)
      if (success) {
        setCurrentReportData(prevData => ({
          ...(prevData || report),
          ...updateData
        }))
        
        toast({
          title: "Report Updated",
          description: "The report has been successfully updated.",
        })
        onEdit?.(report.id, updateData)
        setIsEditMode(false)
      } else {
        setError("Failed to update report. Please try again.")
        toast({
          title: "Update Failed",
          description: "Failed to update the report. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMessage = `Error updating report: ${error.message}`
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    setError("")
    setEditedLocation(null)
    setEditedDateTime("")
    setIsEditingPin(false)
  }

  const handleGenerateReport = () => {
    try {
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Report - ${formattedReport?.title}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              html, body {
                width: 100%;
                height: 100%;
                font-family: Arial, sans-serif;
                background: white;
                overflow: hidden;
              }
              
              .report-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 40px;
                background: white;
                height: 100vh;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
              }
              
              .report-title {
                color: #F14B51;
                text-align: center;
                margin-bottom: 30px;
                font-size: 28px;
                font-weight: bold;
              }
              
              .report-subtitle {
                color: #F14B51;
                border-bottom: 2px solid #F14B51;
                padding-bottom: 5px;
                margin-bottom: 20px;
                font-size: 20px;
                font-weight: bold;
              }
              
              .report-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
              }
              
              .report-field {
                margin-bottom: 8px;
                line-height: 1.5;
              }
              
              .report-section {
                margin-bottom: 20px;
              }
              
              .description-box {
                border: 1px solid #ddd;
                padding: 15px;
                background-color: #f9f9f9;
                border-radius: 4px;
                line-height: 1.6;
                word-wrap: break-word;
              }
              
              .footer {
                margin-top: auto;
                text-align: center;
                color: #666;
                font-size: 12px;
                border-top: 1px solid #eee;
                padding-top: 20px;
                flex-shrink: 0;
              }
              
              .page-break {
                page-break-before: always;
                break-before: page;
              }
              
              @media print {
                html, body {
                  width: 210mm;
                  height: 297mm;
                  margin: 0;
                  padding: 0;
                  overflow: visible;
                }
                
                .report-container {
                  padding: 20mm;
                  margin: 0;
                  max-width: none;
                  width: 100%;
                  height: 257mm;
                  box-sizing: border-box;
                  page-break-after: avoid;
                  break-after: avoid;
                  overflow: hidden;
                  display: flex;
                  flex-direction: column;
                }
                
                .report-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                }
              }
            </style>
          </head>
          <body>
            <div class="report-container" style="page-break-after: avoid; break-after: avoid;">
              <div style="text-align: right; color: #666; font-size: 12px; margin-bottom: 20px;">
                Individual Report
              </div>
              
              <h1 class="report-title">INCIDENT REPORT</h1>
              
              <div class="report-section">
                <h2 class="report-subtitle">${formattedReport?.title || 'Untitled Report'}</h2>
              </div>
              
              <div class="report-grid">
                <div>
                  <div class="report-field"><strong>Date:</strong> ${formattedReport?.date}</div>
                  <div class="report-field"><strong>Time:</strong> ${formattedReport?.time}</div>
                  <div class="report-field"><strong>Location:</strong> ${(currentReportData || report)?.Barangay || 'Not specified'}</div>
                </div>
                <div>
                  <div class="report-field"><strong>Status:</strong> ${(currentReportData || report)?.Status || 'Pending'}</div>
                  <div class="report-field"><strong>Submitted by:</strong> ${submittedByDisplayName || 'Unknown User'}</div>
                  <div class="report-field"><strong>Report ID:</strong> ${(currentReportData || report)?.id}</div>
                </div>
              </div>
              
              <div class="report-section">
                <h3 style="color: #F14B51; margin-bottom: 10px;">Description:</h3>
                <div class="description-box">
                  ${formattedReport?.description || "No description provided"}
                </div>
              </div>
              
              ${(currentReportData || report)?.Address ? `
                <div class="report-section">
                  <h3 style="color: #F14B51; margin-bottom: 10px;">Address:</h3>
                  <div style="padding: 10px; background-color: #f5f5f5; border-radius: 4px;">
                    ${(currentReportData || report)?.Address}
                  </div>
                </div>
              ` : ''}
              
              ${(currentReportData || report)?.Latitude && (currentReportData || report)?.Longitude ? `
                <div class="report-section">
                  <h3 style="color: #F14B51; margin-bottom: 10px;">Coordinates:</h3>
                  <div style="padding: 10px; background-color: #f5f5f5; border-radius: 4px;">
                    Latitude: ${(currentReportData || report)?.Latitude}<br>
                    Longitude: ${(currentReportData || report)?.Longitude}
                  </div>
                </div>
              ` : ''}
              
              <div class="footer">
                Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
              </div>
            </div>
            
            <script>
              window.onload = function() {
                
                setTimeout(function() {
                  window.print();
                }, 100);

                setTimeout(function() {
                  window.close();
                }, 1000);
              }

              window.onafterprint = function() {
                setTimeout(function() {
                  window.close();
                }, 100);
              }
            </script>
          </body>
        </html>
      `

      const blob = new Blob([printContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      const printWindow = window.open(url, '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
      
      if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site to generate reports.');
        URL.revokeObjectURL(url);
        return;
      }

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 5000);
      
      toast({
        title: "Report Generated",
        description: "Print dialog has been opened for the report.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-none w-full h-full p-0 bg-transparent border-none shadow-none flex items-center justify-center overflow-y-auto"
        onEscapeKeyDown={() => onOpenChange(false)}
      >
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => onOpenChange(false)} />
        <div 
          className="w-full h-full flex items-center justify-center p-4 relative z-10"
          onClick={() => onOpenChange(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 shadow-lg w-[900px] max-w-[90vw] max-h-[90vh] overflow-y-auto flex flex-col gap-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold w-6 h-6 flex items-center justify-center z-10 bg-transparent border-0 outline-0 focus:outline-0 shadow-none"
              style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
              onClick={() => onOpenChange(false)}
            >
              ×
            </button>
          <div className="grid grid-cols-1 md:grid-cols-[1fr,400px] gap-6">
            <div className="min-w-[320px]">
              <div className="flex items-center gap-3 mb-4 pr-8">
                <h2 className="text-[#F14B51] text-2xl font-bold">Report Details</h2>
                {(currentReportData || report)?.isSensitive && (
                  <span className="px-3 py-1 rounded-lg bg-orange-100 text-orange-600 border border-orange-400 text-sm font-medium">
                    Sensitive
                  </span>
                )}
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                  {error}
                </div>
              )}
              
              {}
              <div className="mb-4">
                {isEditMode ? (
                  <Input
                    value={editedReport.Title || ""}
                    onChange={(e) => setEditedReport({...editedReport, Title: e.target.value})}
                    placeholder="Enter title of report"
                    className={`flex-1 ${!editedReport.Title?.trim() && error ? 'border-red-500 focus:ring-red-500' : ''}`}
                  />
                ) : (
                  <div className="text-2xl font-bold text-gray-800 mb-3">
                    {(currentReportData || report)?.Title || formattedReport?.title}
                  </div>
                )}
              </div>

              {}
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-[#F14B51]" />
                {isEditMode ? (
                  <select
                    value={editedReport.IncidentType || ""}
                    onChange={(e) => setEditedReport({...editedReport, IncidentType: e.target.value})}
                    className={`flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F14B51] ${!editedReport.IncidentType?.trim() && error ? 'border-red-500 focus:ring-red-500' : ''}`}
                  >
                    <option value="">Select type of incident</option>
                    {/* Default categories */}
                    <option value="Theft">Theft</option>
                    <option value="Reports/Agreement">Reports/Agreement</option>
                    <option value="Accident">Accident</option>
                    <option value="Debt / Unpaid Wages Report">Debt / Unpaid Wages Report</option>
                    <option value="Defamation Complaint">Defamation Complaint</option>
                    <option value="Assault/Harassment">Assault/Harassment</option>
                    <option value="Property Damage/Incident">Property Damage/Incident</option>
                    <option value="Animal Incident">Animal Incident</option>
                    <option value="Verbal Abuse and Threats">Verbal Abuse and Threats</option>
                    <option value="Alarm and Scandal">Alarm and Scandal</option>
                    <option value="Lost Items">Lost Items</option>
                    <option value="Scam/Fraud">Scam/Fraud</option>
                    <option value="Drugs Addiction">Drugs Addiction</option>
                    <option value="Missing Person">Missing Person</option>
                    <option value="Others">Others</option>
                    {/* Custom categories */}
                    {categories.length > 0 && (
                      <>
                        <option disabled>── Custom Categories ──</option>
                        {categories.map((category, index) => (
                          <option key={index} value={category.name || category}>
                            {category.name || category}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                ) : (
                  <span className="text-gray-600">
                    {formattedReport?.category}
                  </span>
                )}
              </div>
              
              {}
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-[#F14B51]" />
                {isEditMode ? (
                  <Input
                    value={editedReport.Barangay || ""}
                    onChange={(e) => setEditedReport({...editedReport, Barangay: e.target.value})}
                    placeholder="Enter location"
                    className="flex-1"
                  />
                ) : (
                  <div className="text-gray-600">
                    <div>{formattedReport?.location}</div>
                    {resolvedAddress && resolvedAddress !== formattedReport?.location && (
                      <div className="text-sm text-gray-500 mt-1">{resolvedAddress}</div>
                    )}
                  </div>
                )}
              </div>
              
              {isEditMode ? (
                <div className="mb-4">
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Calendar className="w-5 h-5 text-[#F14B51]" />
                    <Clock className="w-5 h-5 text-[#F14B51]" />
                    <span>Date and Time:</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={editedDateTime}
                    onChange={(e) => setEditedDateTime(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#F14B51]"
                    placeholder="Select date and time"
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-[#F14B51]" />
                    <span className="text-gray-600">{formattedReport?.date}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-[#F14B51]" />
                    <span className="text-gray-600">{formattedReport?.time}</span>
                  </div>
                </>
              )}
              
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-[#F14B51]" />
                <span className="font-medium text-gray-700">Description:</span>
              </div>
              {isEditMode ? (
                <Textarea
                  className={`w-full border rounded-lg px-4 py-2 focus:outline-none min-h-[80px] mb-4 ${!editedReport.Description?.trim() && error ? 'border-red-500 focus:ring-red-500' : ''}`}
                  value={editedReport.Description || ""}
                  onChange={(e) => setEditedReport({...editedReport, Description: e.target.value})}
                  placeholder="Describe the incident"
                />
              ) : (
                <Textarea
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none min-h-[80px] mb-4"
                  value={formattedReport?.description || "No description provided"}
                  readOnly
                />
              )}
              
              {isEditMode && (
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="sensitive-checkbox"
                    checked={editedReport.isSensitive || false}
                    onChange={(e) => setEditedReport({...editedReport, isSensitive: e.target.checked})}
                    className="w-4 h-4 text-[#F14B51] border-gray-300 rounded focus:ring-[#F14B51] focus:ring-2"
                  />
                  <label htmlFor="sensitive-checkbox" className="text-sm font-medium text-gray-700">
                    Mark as Sensitive
                  </label>
                </div>
              )}
              
              {}
              {isEditMode && (
                <div className="flex gap-3 mb-6">
                  <Button
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="bg-[#F14B51] hover:bg-[#D13B41] px-6 py-2 min-w-[120px]"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="px-6 py-2"
                  >
                    Cancel
                  </Button>
                </div>
              )}
              
              <div className="font-bold text-[#F14B51] mb-4 mt-6">Media Attachments</div>
              {report?.MediaURL ? (
                <div className="mb-4">
                  {report.MediaType === "video" ? (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <video 
                        src={report.MediaURL} 
                        controls 
                        className="w-full max-w-md mx-auto rounded-lg"
                        style={{ maxHeight: '300px' }}
                      >
                        Your browser does not support the video tag.
                      </video>
                      <p className="text-sm text-gray-600 text-center mt-2">Video attachment</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <img 
                        src={report.MediaURL} 
                        alt="Report attachment" 
                        className="w-full max-w-md mx-auto rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ maxHeight: '300px', objectFit: 'contain' }}
                        onClick={() => window.open(report.MediaURL, '_blank')}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.textContent = 'Image not accessible - stored locally on mobile device';
                          e.target.nextElementSibling.className = 'text-sm text-orange-600 text-center mt-2 font-medium';
                        }}
                      />
                      <p className="text-sm text-gray-600 text-center mt-2">Click image to view full size</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex gap-4 mb-4">
                  <div className="flex flex-col items-center border rounded-xl p-6 bg-[#FFF3F2] w-44">
                    <ImageIcon className="w-12 h-12 text-[#F14B51] mb-2" />
                    <span className="font-medium text-base text-[#F14B51]">No Photo</span>
                  </div>
                  <div className="flex flex-col items-center border rounded-xl p-6 bg-[#FFF3F2] w-44">
                    <ImageIcon className="w-12 h-12 text-[#F14B51] mb-2" />
                    <span className="font-medium text-base text-[#F14B51]">No Video</span>
                  </div>
                </div>
              )}
              {!report?.MediaURL && (
                <div className="text-xs text-gray-400 mb-4">No media attachments available</div>
              )}
              
              {}
              {!isEditMode && (
                <div className="flex gap-3 mt-8 flex-wrap">
                  <button 
                    className="border border-blue-500 text-blue-500 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-50 transition-colors"
                    onClick={handleEdit}
                  >
                    <Edit className="w-4 h-4" /> Edit Report
                  </button>
                  <button 
                    className="border border-red-500 text-red-500 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-red-50 transition-colors"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4" /> Delete Report
                  </button>
                  <button 
                    className="border border-green-500 text-green-500 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-50 transition-colors"
                    onClick={handleGenerateReport}
                  >
                    <Printer className="w-4 h-4" /> Generate Report
                  </button>
                </div>
              )}
            </div>
            
            {}
            {/* Map Section */}
            <div className="w-full flex flex-col items-center justify-start">
              <div className="flex items-center justify-between w-full mb-2">
                <div className="font-bold text-[#F14B51] text-xl text-center flex-1">Incident Location</div>
                {isEditMode && (
                  <button
                    onClick={() => setIsEditingPin(!isEditingPin)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isEditingPin 
                        ? 'bg-green-500 text-white hover:bg-green-600' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    <Move className="w-4 h-4" />
                    {isEditingPin ? 'Done Editing' : 'Edit Pin Location'}
                  </button>
                )}
              </div>
              {isEditMode && isEditingPin && !editedLocation && (
                <div className="w-full mb-2 text-sm text-center text-gray-600 bg-blue-50 py-2 px-3 rounded-lg border border-blue-200">
                  <span className="font-medium text-blue-700 flex items-center justify-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Click on the map to set the new incident location (Map Key: {mapKey})
                  </span>
                </div>
              )}
              {isEditMode && isEditingPin && editedLocation && (
                <div className="w-full mb-2 text-sm text-center text-green-600 bg-green-50 py-2 px-3 rounded-lg border border-green-200">
                  <span className="font-medium flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Location updated to [{editedLocation[0].toFixed(6)}, {editedLocation[1].toFixed(6)}]! Click "Done Editing" to finish.
                  </span>
                </div>
              )}
              {isEditMode && editedLocation && !isEditingPin && (
                <div className="w-full mb-2 text-sm text-center text-green-600 bg-green-50 py-2 px-3 rounded-lg border border-green-200">
                  <span className="font-medium flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Location updated! Remember to save your changes.
                  </span>
                </div>
              )}
              <div className="w-full h-[250px] bg-[#F8E3DE] rounded-lg flex items-center justify-center overflow-hidden mb-2">
                {renderMapComponent()}
              </div>
              
              <div className="w-full text-center text-gray-500 text-sm">
                Submitted by: <span className="font-semibold text-black">{submittedByDisplayName || 'Loading...'}</span>
              </div>
            </div>
          </div>
          
          {}
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
            <button 
              className="border border-gray-400 text-gray-600 px-6 py-2 rounded-md hover:bg-gray-50 transition-colors" 
              onClick={() => onOpenChange(false)}
            >
              Close
            </button>
          </div>
        </div>
        </div>
      </DialogContent>

      {}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Delete Report</h3>
            <p className="text-gray-600 mb-6">
              Do you want to delete this report? This action cannot be undone.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700">
                <strong>Title:</strong> {(currentReportData || report)?.Title || formattedReport?.title}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Category:</strong> {(currentReportData || report)?.IncidentType || formattedReport?.category}
              </p>
            </div>

            {/* Deletion Reason Dropdown */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Deletion
              </label>
              <Select value={deletionReason} onValueChange={setDeletionReason}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select deletion reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin deletion">Admin deletion</SelectItem>
                  <SelectItem value="Spam report">Spam report</SelectItem>
                  <SelectItem value="False information">False information</SelectItem>
                  <SelectItem value="Duplicate report">Duplicate report</SelectItem>
                  <SelectItem value="Inappropriate content">Inappropriate content</SelectItem>
                  <SelectItem value="Privacy violation">Privacy violation</SelectItem>
                  <SelectItem value="Test report">Test report</SelectItem>
                  <SelectItem value="User request">User request</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  )
}
