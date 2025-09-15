"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase";
import { useCurrentUser } from "@/hooks/use-current-user";
import dynamic from "next/dynamic";
import { MapPin, Zap, Layers, Eye, EyeOff } from "lucide-react";
import { getMapCoordinatesForUser, getUserBarangay } from "@/lib/userMapping";

// Dynamically import components to avoid SSR issues
const CrimeMap = dynamic(() => import("./crime-map").then(mod => ({ default: mod.CrimeMap })), {
  ssr: false,
  loading: () => <div className="flex h-[500px] w-full items-center justify-center bg-gray-100">Loading map...</div>,
});

const HeatmapComponent = dynamic(() => import("./heatmap-component"), {
  ssr: false,
  loading: () => <div className="flex h-[500px] w-full items-center justify-center bg-gray-100">Loading heatmap...</div>,
});

export function EnhancedCrimeMap() {
  const [reports, setReports] = useState([]);
  const [viewMode, setViewMode] = useState("hybrid"); // "incidents", "heatmap", "hybrid"
  const [showPins, setShowPins] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const { user, isLoading: isUserLoading } = useCurrentUser();

  // Use centralized user mapping
  const userEmail = user?.email || "";
  const barangay = getUserBarangay(userEmail) || 'All';

  // Fetch reports from Firebase
  useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("DateTime", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      console.log("📊 Enhanced Crime Map - Fetched reports:", reportsData.length);
      setReports(reportsData);
    });
    return () => unsubscribe();
  }, []);

  // Filter reports based on user's barangay
  const filteredReports = barangay === 'All' ? reports : 
                         reports.filter(r => r.Barangay === barangay);

  // Update view toggles based on view mode
  useEffect(() => {
    switch (viewMode) {
      case "incidents":
        setShowPins(true);
        setShowHotspots(true);
        setShowHeatmap(false);
        break;
      case "heatmap":
        setShowPins(false);
        setShowHotspots(false);
        setShowHeatmap(true);
        break;
      case "hybrid":
        setShowPins(true);
        setShowHotspots(false); // Disable hotspots in hybrid to avoid overlap
        setShowHeatmap(true);
        break;
    }
  }, [viewMode]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-600" />
                Enhanced Crime Mapping
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {barangay === 'All' ? 'All barangays' : `${barangay} barangay`} • {filteredReports.length} total reports
              </p>
            </div>
            
            {/* View Mode Selector */}
            <Tabs value={viewMode} onValueChange={setViewMode} className="w-auto">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="incidents" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Incidents
                </TabsTrigger>
                <TabsTrigger value="heatmap" className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Heatmap
                </TabsTrigger>
                <TabsTrigger value="hybrid" className="flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  Hybrid
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Layer Controls - only show in hybrid mode */}
          {viewMode === "hybrid" && (
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h4 className="text-sm font-medium">Layer Controls:</h4>
                <ToggleGroup type="multiple" value={[
                  ...(showPins ? ["pins"] : []),
                  ...(showHeatmap ? ["heatmap"] : [])
                ]}>
                  <ToggleGroupItem 
                    value="pins" 
                    onClick={() => setShowPins(!showPins)}
                    className="flex items-center gap-1 text-xs"
                  >
                    {showPins ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    Incident Pins
                  </ToggleGroupItem>
                  <ToggleGroupItem 
                    value="heatmap" 
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    className="flex items-center gap-1 text-xs"
                  >
                    {showHeatmap ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    Intensity Circles
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Toggle layers on/off • Hover circles for details
              </div>
            </div>
          )}

          {/* Map Container */}
          <div className="relative">
            {viewMode === "heatmap" ? (
              // Pure heatmap view
              <HeatmapComponent
                reports={filteredReports}
                barangay={barangay === 'All' ? null : barangay}
                className="h-[600px] w-full"
              />
            ) : (
              // Incidents or hybrid view
              <div className="relative">
                <CrimeMap
                  barangay={barangay === 'All' ? null : barangay}
                  showPins={showPins}
                  showHotspots={showHotspots}
                  showControls={false} // Disable controls for cleaner view
                  className="h-[600px] w-full"
                />
                
                {/* Overlay heatmap in hybrid mode */}
                {viewMode === "hybrid" && showHeatmap && (
                  <div className="absolute inset-0 pointer-events-none">
                    <HeatmapComponent
                      reports={filteredReports}
                      barangay={barangay === 'All' ? null : barangay}
                      className="h-full w-full"
                      showLegend={false} // Hide legend to avoid duplication
                      minOpacity={0.1} // Lower opacity for overlay
                      maxOpacity={0.5}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium">Low Intensity</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Few incidents, lower risk areas
              </p>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm font-medium">Medium Intensity</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Moderate incident frequency
              </p>
            </div>
            
            <div className="bg-red-50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm font-medium">High Intensity</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Frequent incidents, requires attention
              </p>
            </div>
          </div>

          {/* Statistics */}
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>
              Showing {filteredReports.filter(r => r.Status === "Verified").length} verified incidents
              {viewMode === "heatmap" && " grouped into density clusters"}
              {viewMode === "hybrid" && " with both individual markers and density visualization"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
