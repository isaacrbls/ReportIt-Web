"use client"

import { useState } from "react"
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

interface ReportDetailDialogProps {
  report: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerify?: (id: string) => void
  onReject?: (id: string, reason: string) => void
}

export function ReportDetailDialog({ report, open, onOpenChange, onVerify, onReject }: ReportDetailDialogProps) {
  const [rejectionReason, setRejectionReason] = useState("")
  const [isRejecting, setIsRejecting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isEditingCategory, setIsEditingCategory] = useState(false)
  const [editedCategory, setEditedCategory] = useState(report?.category || "")
  const [categoryKeywords, setCategoryKeywords] = useState(report?.keywords || ["Steal", "pickpocket", "snatched"])

  if (!report) return null

  const handleVerify = async () => {
    setIsVerifying(true)
    try {
      // In a real app, you would make an API call here
      await new Promise((resolve) => setTimeout(resolve, 1000))
      onVerify?.(report.id)
      onOpenChange(false)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) return

    setIsRejecting(true)
    try {
      // In a real app, you would make an API call here
      await new Promise((resolve) => setTimeout(resolve, 1000))
      onReject?.(report.id, rejectionReason)
      onOpenChange(false)
    } finally {
      setIsRejecting(false)
      setRejectionReason("")
    }
  }

  const handleStartRejection = () => {
    setIsRejecting(true)
  }

  const handleCancelRejection = () => {
    setIsRejecting(false)
    setRejectionReason("")
  }

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "verified":
        return "success"
      case "rejected":
        return "destructive"
      default:
        return "outline"
    }
  }

  // Get risk badge color
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "High":
        return "bg-red-100 text-red-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Report Details</DialogTitle>
            <Badge variant={getStatusVariant(report.status)} className="px-3 py-1">
              {report.status?.charAt(0).toUpperCase() + report.status?.slice(1)}
            </Badge>
          </div>
          <DialogDescription>
            ID: {report.id} • Submitted on {report.timestamp}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4 md:grid-cols-2">
          {/* Left column */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">{report.title}</h3>
              <div className="mt-2 flex flex-wrap gap-2 items-center">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Edit className="h-3 w-3 text-red-500 cursor-pointer" onClick={() => setIsEditingCategory(true)} />
                  <span className="ml-2">{editedCategory}</span>
                </Badge>
                <div
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRiskColor(report.risk || "Medium")}`}
                >
                  {report.risk || "Medium"} Risk
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{report.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{report.timestamp?.split(" - ")[0]}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{report.timestamp?.split(" - ")[1]}</span>
              </div>
            </div>

            <div>
              <h4 className="mb-1 font-medium">Description</h4>
              <div className="rounded-md border p-3 text-sm">{report.description}</div>
            </div>

            {report.rejectionReason && (
              <div>
                <h4 className="mb-1 font-medium text-red-600">Rejection Reason</h4>
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm">{report.rejectionReason}</div>
              </div>
            )}

            {report.hasMedia && (
              <div>
                <h4 className="mb-2 font-medium">Media Attachments</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex aspect-video items-center justify-center rounded-md border bg-gray-50">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Click on images to view full size</p>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 font-medium">Incident Location</h4>
              <div className="aspect-video rounded-md border bg-gray-100">
                <div className="flex h-full flex-col items-center justify-center">
                  <MapPin className="h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Map location</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-medium">Report Metadata</h4>
              <div className="space-y-2 rounded-md border p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Submitted by:</span>
                  <span>Anonymous User</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Device:</span>
                  <span>Mobile App</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IP Address:</span>
                  <span>192.168.1.xxx</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Report Version:</span>
                  <span>1.0</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-medium">Activity Log</h4>
              <div className="space-y-2 rounded-md border p-3">
                <div className="space-y-1 border-b pb-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Report Submitted</span>
                    <span className="text-xs text-muted-foreground">{report.timestamp}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">User submitted report via mobile app</p>
                </div>
                {report.status === "verified" && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-green-600">Report Verified</span>
                      <span className="text-xs text-muted-foreground">May 16, 2023 - 10:45 AM</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Verified by Admin (John Doe)</p>
                  </div>
                )}
                {report.status === "rejected" && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-red-600">Report Rejected</span>
                      <span className="text-xs text-muted-foreground">May 16, 2023 - 11:30 AM</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Rejected by Admin (Jane Smith)</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rejection form */}
        {isRejecting && report.status === "pending" && (
          <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-3">
            <h4 className="mb-2 font-medium text-red-800">Reject Report</h4>
            <div className="space-y-2">
              <Label htmlFor="rejectionReason" className="text-sm text-red-800">
                Reason for rejection
              </Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this report..."
                className="h-20 resize-none"
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          {report.status === "pending" && !isRejecting && (
            <div className="flex w-full gap-2 sm:w-auto">
              <Button
                variant="outline"
                className="flex-1 border-red-600 text-red-600 hover:bg-red-50 sm:flex-none"
                onClick={handleStartRejection}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 sm:flex-none"
                onClick={handleVerify}
                disabled={isVerifying}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {isVerifying ? "Verifying..." : "Verify Report"}
              </Button>
            </div>
          )}

          {isRejecting && (
            <div className="flex w-full gap-2 sm:w-auto">
              <Button variant="outline" className="flex-1 sm:flex-none" onClick={handleCancelRejection}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 sm:flex-none"
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
              >
                Confirm Rejection
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className={report.status === "pending" && !isRejecting ? "hidden sm:flex" : ""}
          >
            Close
          </Button>
        </DialogFooter>

        <EditCategoryDialog
          open={isEditingCategory}
          onOpenChange={setIsEditingCategory}
          category={{ name: editedCategory, keywords: categoryKeywords }}
          onSave={({ name, keywords }) => {
            setEditedCategory(name)
            setCategoryKeywords(keywords)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
