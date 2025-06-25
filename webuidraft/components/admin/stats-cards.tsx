"use client"

import { useState } from "react"
import { BarChart3, FileText, MapPin, ShieldAlert } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsDetailDialog } from "./stats-detail-dialog"

export function StatsCards() {
  const [selectedStat, setSelectedStat] = useState<"reports" | "pending" | "high-risk" | "ml-accuracy" | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleCardClick = (stat: "reports" | "pending" | "high-risk" | "ml-accuracy") => {
    setSelectedStat(stat)
    setIsDialogOpen(true)
  }

  return (
    <>
      <Card
        className="cursor-pointer transition-all hover:border-red-200 hover:shadow-md"
        onClick={() => handleCardClick("reports")}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          <FileText className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1,284</div>
          <p className="text-xs text-muted-foreground">+24% from last month</p>
        </CardContent>
      </Card>
      <Card
        className="cursor-pointer transition-all hover:border-red-200 hover:shadow-md"
        onClick={() => handleCardClick("pending")}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
          <ShieldAlert className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">32</div>
          <p className="text-xs text-muted-foreground">-8% from last week</p>
        </CardContent>
      </Card>
      <Card
        className="cursor-pointer transition-all hover:border-red-200 hover:shadow-md"
        onClick={() => handleCardClick("high-risk")}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">High Risk Areas</CardTitle>
          <MapPin className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">2</div>
          <p className="text-xs text-muted-foreground">Bulihan, Mojon</p>
        </CardContent>
      </Card>
      <Card
        className="cursor-pointer transition-all hover:border-red-200 hover:shadow-md"
        onClick={() => handleCardClick("ml-accuracy")}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ML Prediction Accuracy</CardTitle>
          <BarChart3 className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">83%</div>
          <p className="text-xs text-muted-foreground">+5% from last quarter</p>
        </CardContent>
      </Card>

      {/* Stats Detail Dialog */}
      <StatsDetailDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} type={selectedStat} />
    </>
  )
}
