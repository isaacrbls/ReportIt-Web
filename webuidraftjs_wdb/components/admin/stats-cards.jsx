"use client"

import { useState, useEffect } from "react"
import { BarChart3, FileText, MapPin, ShieldAlert } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsDetailDialog } from "./stats-detail-dialog"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/firebase"
import { useReports } from "@/contexts/ReportsContext"

export function StatsCards({ userBarangay }) {
  const [selectedStat, setSelectedStat] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [highRiskAreas, setHighRiskAreas] = useState({ count: 0, areas: [] })
  const { reports, calculateBarangayHotspots, isLoading } = useReports()

  useEffect(() => {
    const calculateHighRiskAreas = () => {
      if (isLoading || !reports.length) {
        setHighRiskAreas({ count: 0, areas: ["Loading..."] });
        return;
      }

      try {
        console.log("🔍 Debug - userBarangay passed:", userBarangay);
        
        // If userBarangay is provided, only calculate for that barangay (matching the map filter)
        if (userBarangay) {
          const hotspots = calculateBarangayHotspots(userBarangay);
          
          console.log(`🔥 Filtered Barangay ${userBarangay}:`, {
            totalHotspots: hotspots.length,
            hotspotDetails: hotspots.map(h => ({
              count: h.incidentCount,
              riskLevel: h.riskLevel,
              location: `[${h.lat.toFixed(4)}, ${h.lng.toFixed(4)}]`
            }))
          });
          
          // Count ALL hotspots (2+ incidents) - these are what show as red circles on map
          const allHotspots = hotspots.filter(hotspot => hotspot.incidentCount >= 2);
          
          console.log("🔥 High Risk Areas (Red Circles) Count for userBarangay:", {
            userBarangay,
            totalHotspots: allHotspots.length,
            method: "Counting hotspots (2+ incidents) for user's barangay only",
            reportsCount: reports.filter(r => r.Barangay === userBarangay).length
          });

          setHighRiskAreas({
            count: allHotspots.length,
            areas: allHotspots.length > 0 ? 
              [`${allHotspots.length} red circle${allHotspots.length !== 1 ? 's' : ''} in ${userBarangay}`] : 
              [`No hotspots found in ${userBarangay}`]
          });
        } else {
          // Original logic for all barangays if no userBarangay filter
          const barangays = [...new Set(reports.map(r => r.Barangay).filter(Boolean))];
          let totalHotspots = 0;
          const hotspotAreas = [];

          console.log("🔍 Debug - Available barangays:", barangays);

          barangays.forEach(barangay => {
            const hotspots = calculateBarangayHotspots(barangay);
            const allHotspots = hotspots.filter(hotspot => hotspot.incidentCount >= 2);
            
            if (allHotspots.length > 0) {
              totalHotspots += allHotspots.length;
              hotspotAreas.push(`${barangay}: ${allHotspots.length} hotspot${allHotspots.length > 1 ? 's' : ''}`);
            }
          });

          setHighRiskAreas({
            count: totalHotspots,
            areas: totalHotspots > 0 ? 
              [`${totalHotspots} red circle${totalHotspots !== 1 ? 's' : ''} on map`] : 
              ["No hotspots found"]
          });
        }
      } catch (error) {
        console.error("Error calculating high-risk areas:", error);
        setHighRiskAreas({ count: 0, areas: [] });
      }
    };

    calculateHighRiskAreas();
  }, [reports, isLoading, calculateBarangayHotspots, userBarangay]);

  const handleCardClick = (stat) => {
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
          <div className="text-2xl font-bold">{highRiskAreas.count}</div>
          <p className="text-xs text-muted-foreground">
            {highRiskAreas.areas.length > 0 ? highRiskAreas.areas.join(", ") : "No high-risk areas"}
          </p>
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
          <div className="text-2xl font-bold">87%</div>
          <p className="text-xs text-muted-foreground">Random Forest Model</p>
        </CardContent>
      </Card>
      <StatsDetailDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        type={selectedStat}
      />
    </>
  )
}
