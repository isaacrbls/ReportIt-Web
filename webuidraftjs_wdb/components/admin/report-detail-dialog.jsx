"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Calendar, CheckCircle, Clock, ImageIcon, MapPin, Tag, XCircle, Edit } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { EditCategoryDialog } from "@/components/admin/edit-category-dialog"
import { updateReportStatus, formatReportForDisplay } from "@/lib/reportUtils"

// Dynamically import the map component with no SSR
const MapWithNoSSR = dynamic(() => import("./map-component"), {
  ssr: false,
  loading: () => <div className="flex h-[250px] w-full items-center justify-center bg-gray-100 rounded-lg">Loading map...</div>,
});

export function ReportDetailDialog({ report, open, onOpenChange, onVerify, onReject }) {
  const [rejectionReason, setRejectionReason] = useState("")
  const [isRejecting, setIsRejecting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isEditingCategory, setIsEditingCategory] = useState(false)

  // Format the report data to match Firebase structure
  const formattedReport = formatReportForDisplay(report)
  const [editedCategory, setEditedCategory] = useState(formattedReport?.category || "")
  const [categoryKeywords, setCategoryKeywords] = useState(report?.keywords || ["Steal", "pickpocket", "snatched"])

  // Early return after all hooks
  if (!report) return null

  const handleVerify = async () => {
    setIsVerifying(true)
    try {
      const success = await updateReportStatus(report.id, "Verified")
      if (success) {
        onVerify?.(report.id)
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Error verifying report:", error)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleReject = async () => {
    setIsRejecting(true)
    try {
      const success = await updateReportStatus(report.id, "Rejected")
      if (success) {
        onReject?.(report.id)
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Error rejecting report:", error)
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full p-0 bg-transparent border-none shadow-none flex items-center justify-center min-h-screen overflow-y-auto">
        <div className="bg-white rounded-2xl p-10 shadow-sm w-[900px] max-w-full max-h-[95vh] overflow-y-auto flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-8">
            {/* Left: Details */}
            <div className="flex-1 min-w-[320px]">
              <h2 className="text-[#F14B51] text-2xl font-bold mb-4">Report Details</h2>
              <div className="text-2xl font-bold text-[#F14B51] mb-2">{formattedReport?.title}</div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-5 h-5 text-[#F14B51]" />
                <span className="font-semibold text-[#F14B51]">{formattedReport?.category}</span>
                <button className="ml-2 px-2 py-0.5 text-xs rounded bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200 flex items-center gap-1" onClick={() => setIsEditingCategory(true)}>
                  <Edit className="w-3 h-3" /> Edit
                </button>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-[#F14B51]" />
                <span>{formattedReport?.location}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-[#F14B51]" />
                <span>{formattedReport?.date}</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-[#F14B51]" />
                <span>{formattedReport?.time}</span>
              </div>
              <div className="mb-2 font-semibold">Description</div>
              <Textarea
                className="w-full border rounded-lg px-4 py-2 focus:outline-none min-h-[80px] mb-4"
                value={formattedReport?.description || "No description provided"}
                readOnly
              />
              <div className="font-bold text-[#F14B51] mb-2 mt-6">Media Attachments</div>
              <div className="flex gap-6 mb-2">
                <div className="flex flex-col items-center border rounded-xl p-6 bg-[#FFF3F2] w-44">
                  <ImageIcon className="w-12 h-12 text-[#F14B51] mb-2" />
                  <span className="font-medium text-base text-[#F14B51]">Photo</span>
                </div>
                <div className="flex flex-col items-center border rounded-xl p-6 bg-[#FFF3F2] w-44">
                  <ImageIcon className="w-12 h-12 text-[#F14B51] mb-2" />
                  <span className="font-medium text-base text-[#F14B51]">Video</span>
                </div>
              </div>
              <div className="text-xs text-gray-400">Click on the image to view full size</div>
              
              {/* Only show verify/reject buttons if report is not already verified */}
              {report?.Status !== "Verified" && (
                <div className="flex gap-4 mt-8">
                  <button 
                    className="border border-[#F14B51] text-[#F14B51] px-8 py-2 rounded-md flex items-center gap-2 btn-reject disabled:opacity-50" 
                    onClick={handleReject}
                    disabled={isRejecting}
                  >
                    <XCircle className="w-5 h-5" /> {isRejecting ? "Rejecting..." : "Reject"}
                  </button>
                  <button 
                    className="bg-green-500 text-white px-8 py-2 rounded-md flex items-center gap-2 btn-verify disabled:opacity-50" 
                    onClick={handleVerify}
                    disabled={isVerifying}
                  >
                    <CheckCircle className="w-5 h-5" /> {isVerifying ? "Verifying..." : "Verify"}
                  </button>
                </div>
              )}
            </div>
            {/* Right: Map */}
            <div className="flex-1 min-w-[320px] flex flex-col items-center">
              <div className="font-bold text-[#F14B51] text-xl mb-2">Incident Location</div>
              <div className="w-[350px] h-[250px] bg-[#F8E3DE] rounded-lg flex items-center justify-center overflow-hidden mb-2">
                {report?.Latitude && report?.Longitude ? (
                  <MapWithNoSSR
                    center={[report.Latitude, report.Longitude]}
                    zoom={16}
                    showPins={true}
                    showHotspots={false}
                    showControls={false}
                    preloadedIncidents={[report]}
                  />
                ) : (
                  <div className="text-gray-500 text-center">
                    <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No location data available</p>
                  </div>
                )}
              </div>
              <div className="w-full text-right text-gray-500 text-sm mt-2">
                Submitted by: <span className="font-semibold text-black">{formattedReport?.submittedBy}</span>
              </div>
            </div>
          </div>
          <button className="self-end border border-gray-400 text-black px-6 py-2 rounded-md" onClick={() => onOpenChange(false)}>Close</button>
        </div>
      </DialogContent>
      <EditCategoryDialog
        open={isEditingCategory}
        onOpenChange={setIsEditingCategory}
        category={{ name: formattedReport?.category, keywords: report?.keywords }}
        onSave={({ name, keywords }) => {
          setIsEditingCategory(false)
          // Optionally update the category in parent state here
        }}
      />
    </Dialog>
  )
}
