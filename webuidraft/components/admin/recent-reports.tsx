"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from "lucide-react"

// Sample data for recent reports
const recentReportsData = [
  {
    id: "REP-001",
    title: "Smartphone theft at market",
    location: "Bulihan",
    timestamp: "2023-05-15T14:30:00",
    status: "pending",
    hasMedia: true,
  },
  {
    id: "REP-002",
    title: "Wallet snatching incident",
    location: "Mojon",
    timestamp: "2023-05-14T18:45:00",
    status: "verified",
    hasMedia: true,
  },
  {
    id: "REP-003",
    title: "Motorcycle theft",
    location: "Dakila",
    timestamp: "2023-05-14T09:15:00",
    status: "pending",
    hasMedia: false,
  },
  {
    id: "REP-004",
    title: "Store robbery",
    location: "Look 1st",
    timestamp: "2023-05-13T22:10:00",
    status: "rejected",
    hasMedia: true,
  },
  {
    id: "REP-005",
    title: "Phone snatching",
    location: "Longos",
    timestamp: "2023-05-13T16:20:00",
    status: "verified",
    hasMedia: false,
  },
]

export function RecentReports() {
  const [reports, setReports] = useState(recentReportsData)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const handleVerify = (id: string) => {
    setReports(reports.map((report) => (report.id === id ? { ...report, status: "verified" } : report)))
  }

  const handleReject = (id: string) => {
    setReports(reports.map((report) => (report.id === id ? { ...report, status: "rejected" } : report)))
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <div key={report.id} className="flex flex-col space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">{report.title}</div>
            <Badge
              variant={
                report.status === "verified" ? "success" : report.status === "rejected" ? "destructive" : "outline"
              }
            >
              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
            </Badge>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <div>{report.location}</div>
            <div className="mx-2">•</div>
            <div>{formatDate(report.timestamp)}</div>
            {report.hasMedia && (
              <>
                <div className="mx-2">•</div>
                <div>Has media</div>
              </>
            )}
          </div>
          {report.status === "pending" && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 border-green-600 text-green-600 hover:bg-green-50"
                onClick={() => handleVerify(report.id)}
              >
                <CheckCircle className="h-4 w-4" />
                Verify
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 border-red-600 text-red-600 hover:bg-red-50"
                onClick={() => handleReject(report.id)}
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
