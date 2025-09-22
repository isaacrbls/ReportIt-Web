"use client"

import { BarChart3, FileText, MapPin, ShieldAlert } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

export function StatsDetailDialog({ open, onOpenChange, type }) {
  if (!type) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {type === "reports" && (
              <>
                <FileText className="h-5 w-5 text-red-600" />
                Total Reports
              </>
            )}
            {type === "pending" && (
              <>
                <ShieldAlert className="h-5 w-5 text-red-600" />
                Pending Verification
              </>
            )}
            {type === "high-risk" && (
              <>
                <MapPin className="h-5 w-5 text-red-600" />
                High Risk Areas
              </>
            )}
            {type === "ml-accuracy" && (
              <>
                <BarChart3 className="h-5 w-5 text-red-600" />
                ML Prediction Accuracy
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {type === "reports" && "Detailed breakdown of all crime reports in the system"}
            {type === "pending" && "Reports awaiting verification by administrators"}
            {type === "high-risk" && "Areas identified as high risk based on crime frequency and ML analysis"}
            {type === "ml-accuracy" && "Performance metrics for machine learning prediction models"}
          </DialogDescription>
        </DialogHeader>
        {}
      </DialogContent>
    </Dialog>
  )
}
