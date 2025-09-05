"use client"

import { useState, useEffect } from "react"
import { BarChart3, FileText, MapPin, ShieldAlert } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsDetailDialog } from "./stats-detail-dialog"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/firebase"

export function StatsCards() {
  const [selectedStat, setSelectedStat] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [highRiskAreas, setHighRiskAreas] = useState({ count: 0, areas: [] })

  // Calculate high-risk areas using the same WCRA algorithm
  useEffect(() => {
    const calculateHighRiskAreas = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "reports"));
        const locationData = {};
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Clean up barangay names and handle variations
          let barangay = data.Barangay || data.barangay || data.Location || data.location;
          if (barangay && typeof barangay === 'string') {
            barangay = barangay.trim();
            if (barangay.toLowerCase().includes('bulihan')) barangay = 'Bulihan';
            else if (barangay.toLowerCase().includes('mojon')) barangay = 'Mojon';
            else if (barangay.toLowerCase().includes('dakila')) barangay = 'Dakila';
            else if (barangay.toLowerCase().includes('pinagbakahan')) barangay = 'Pinagbakahan';
            else if (barangay.toLowerCase().includes('look')) barangay = 'Look 1st';
            else if (barangay.toLowerCase().includes('longos')) barangay = 'Longos';
            else if (barangay.toLowerCase().includes('tiaong')) barangay = 'Tiaong';
            else return; // Skip unknown entries
          } else return;
          
          if (!locationData[barangay]) {
            locationData[barangay] = {
              name: barangay,
              totalIncidents: 0,
              highSeverityIncidents: 0,
              incidentTypes: {}
            };
          }
          
          locationData[barangay].totalIncidents++;
          
          // Calculate severity
          const incidentType = (data.IncidentType || "").toLowerCase();
          if (incidentType.includes("robbery") || incidentType.includes("assault") || 
              incidentType.includes("violence") || incidentType.includes("murder") ||
              incidentType.includes("kidnap") || incidentType.includes("rape")) {
            locationData[barangay].highSeverityIncidents++;
          }
          
          const type = data.IncidentType || "Other";
          locationData[barangay].incidentTypes[type] = (locationData[barangay].incidentTypes[type] || 0) + 1;
        });

        // Apply WCRA algorithm to determine high-risk areas
        const highRiskResults = Object.values(locationData)
          .map(area => {
            const frequencyScore = Math.min(Math.log2(area.totalIncidents + 1) * 8, 35);
            const severityScore = area.highSeverityIncidents * 25;
            const diversityScore = Math.min(Object.keys(area.incidentTypes).length * 4, 20);
            
            area.riskScore = Math.round((frequencyScore + severityScore + diversityScore));
            area.riskScore = Math.min(area.riskScore, 100);
            
            if (area.riskScore >= 70) area.riskLevel = "High";
            else if (area.riskScore >= 40) area.riskLevel = "Medium";
            else area.riskLevel = "Low";
            
            return area;
          })
          .filter(area => area.riskLevel === "High") // Only count HIGH risk areas (70+ score)
          .sort((a, b) => b.riskScore - a.riskScore);

        console.log("🏠 High Risk Areas calculation:", {
          totalAreas: Object.keys(locationData).length,
          highRiskCount: highRiskResults.length,
          highRiskAreas: highRiskResults.map(a => `${a.name} (${a.riskScore})`)
        });

        setHighRiskAreas({
          count: highRiskResults.length,
          areas: highRiskResults.slice(0, 3).map(area => area.name) // Top 3 for display
        });
      } catch (error) {
        console.error("Error calculating high-risk areas:", error);
        setHighRiskAreas({ count: 0, areas: [] });
      }
    };

    calculateHighRiskAreas();
  }, []);

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
