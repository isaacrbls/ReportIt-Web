"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, MapPin, X, RefreshCw } from "lucide-react";
import dynamic from "next/dynamic";
import { useReports } from "@/contexts/ReportsContext";
import { reverseGeocode } from "@/lib/mapUtils";

const MapWithNoSSR = dynamic(() => import("./map-component"), {
  ssr: false,
  loading: () => <div className="flex h-[500px] w-full items-center justify-center bg-gray-100">Loading map...</div>,
});

export function CrimeMap({ barangay, showPins = true, showHotspots = true, showControls = true, center, zoom }) {
  const [addingIncident, setAddingIncident] = useState(false);
  const [newIncidentLocation, setNewIncidentLocation] = useState(null);
  const [newIncidentAddress, setNewIncidentAddress] = useState("");
  const [loadingNewAddress, setLoadingNewAddress] = useState(false);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [hotspots, setHotspots] = useState([]);
  const [isReloading, setIsReloading] = useState(false);
  const { reports, calculateBarangayHotspots, isLoading } = useReports();
  const [newIncident, setNewIncident] = useState({
    title: "",
    description: "",
    category: "Theft",
    risk: "Medium",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().split(" ")[0].substring(0, 5),
  });

  useEffect(() => {
    
    if (isLoading) {
      console.log("🔄 CrimeMap: Skipping hotspot calculation while loading");
      return;
    }

    if (showHotspots && barangay && reports.length > 0) {
      const calculatedHotspots = calculateBarangayHotspots(barangay);
      setHotspots(calculatedHotspots);
      console.log("🔥 CrimeMap hotspots calculated for", barangay, ":", calculatedHotspots);
    } else if (!isLoading) {
      
      setHotspots([]);
      console.log("🔥 CrimeMap hotspots cleared - no data or conditions not met");
    }
  }, [reports, barangay, showHotspots, calculateBarangayHotspots, isLoading]);

  // Fetch street name for new incident location
  useEffect(() => {
    if (newIncidentLocation) {
      const fetchAddress = async () => {
        setLoadingNewAddress(true);
        try {
          const address = await reverseGeocode(newIncidentLocation[0], newIncidentLocation[1]);
          setNewIncidentAddress(address);
        } catch (error) {
          console.error('Failed to fetch address for new incident:', error);
          setNewIncidentAddress(`${newIncidentLocation[0].toFixed(4)}, ${newIncidentLocation[1].toFixed(4)}`);
        } finally {
          setLoadingNewAddress(false);
        }
      };
      fetchAddress();
    } else {
      setNewIncidentAddress("");
    }
  }, [newIncidentLocation]);



  const handleAddIncident = () => {
    setAddingIncident(true);
  };

  const handleCancelAddIncident = () => {
    setAddingIncident(false);
    setNewIncidentLocation(null);
    setNewIncidentAddress("");
    setShowIncidentForm(false);
  };

  const handleMapClick = (latlng) => {
    if (addingIncident) {
      setNewIncidentLocation(latlng);
      setShowIncidentForm(true);
      setAddingIncident(false);
    }
  };

  const handleReloadData = async () => {
    setIsReloading(true);
    console.log("🔄 Refreshing page data like F5...");
    
    try {
      // Force a complete page refresh like pressing F5
      // This will reload all Firebase data and reset all states
      window.location.reload();
    } catch (error) {
      console.error("❌ Error refreshing page:", error);
      setIsReloading(false);
    }
  };

  const handleMarkerClick = (incident) => {
    // This will be handled by the map component's popup, not a separate modal
    // The popup is already configured in the map-component.jsx
    console.log("Pin clicked:", incident);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewIncident({ ...newIncident, [name]: value });
  };

  const handleSelectChange = (name, value) => {
    setNewIncident({ ...newIncident, [name]: value });
  };

  const handleSubmitIncident = (e) => {
    e.preventDefault();

    if (!newIncidentLocation) return;

    const newIncidentData = {
      id: Date.now(),
      location: newIncidentLocation,
      title: newIncident.title,
      description: newIncident.description,
      category: newIncident.category,
      risk: newIncident.risk,
      date: new Date(newIncident.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      time: newIncident.time,
      isUserCreated: true,
    };

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("addIncident", {
          detail: newIncidentData,
        })
      );
    }

    setNewIncidentLocation(null);
    setNewIncidentAddress("");
    setShowIncidentForm(false);
    setNewIncident({
      title: "",
      description: "",
      category: "Theft",
      risk: "Medium",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().split(" ")[0].substring(0, 5),
    });

    // The new incident will show up on the map with a popup when clicked
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="relative h-[500px] w-full">
      {}
      {showControls && addingIncident && (
        <div className="absolute left-0 right-0 top-0 z-[1000] bg-red-600 py-2 text-center text-sm font-medium text-white">
          Click on the map to place an incident marker
          <button
            onClick={handleCancelAddIncident}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-1 hover:bg-white/30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <MapWithNoSSR
        onMapClick={showControls ? handleMapClick : undefined}
        onMarkerClick={showPins ? handleMarkerClick : undefined}
        addingIncident={showControls ? addingIncident : false}
        newIncidentLocation={showPins ? newIncidentLocation : null}
        newIncidentRisk={showPins ? newIncident.risk : null}
        barangay={barangay}
        center={center}
        zoom={zoom}
        hotspots={showHotspots ? hotspots : []}
        showPopups={true}
      />

      {}
      {showControls && !addingIncident && !showIncidentForm && (
        <Button
          className="absolute bottom-4 left-4 z-[1] flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50"
          onClick={handleReloadData}
          disabled={isReloading || isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isReloading ? 'animate-spin' : ''}`} />
          {isReloading ? 'Refreshing...' : 'Refresh'}
        </Button>
      )}

      {}
      {showControls && showIncidentForm && newIncidentLocation && (
        <Card className="absolute bottom-4 left-4 z-[1] w-80 bg-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Add New Incident</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitIncident} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="title">Incident Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={newIncident.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Smartphone theft"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="category">Category</Label>
                <Select value={newIncident.category} onValueChange={(value) => handleSelectChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Theft">Theft</SelectItem>
                    <SelectItem value="Robbery">Robbery</SelectItem>
                    <SelectItem value="Vehicle Theft">Vehicle Theft</SelectItem>
                    <SelectItem value="Assault">Assault</SelectItem>
                    <SelectItem value="Burglary">Burglary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="risk">Risk Level</Label>
                <Select value={newIncident.risk} onValueChange={(value) => handleSelectChange("risk", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={newIncident.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    name="time"
                    type="time"
                    value={newIncident.time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={newIncident.description}
                  onChange={handleInputChange}
                  placeholder="Describe the incident..."
                  rows={3}
                  required
                />
              </div>

              <div className="flex items-center text-xs text-muted-foreground">
                <AlertCircle className="mr-1 h-3 w-3" />
                Location: {loadingNewAddress ? "Fetching address..." : newIncidentAddress || `${newIncidentLocation[0].toFixed(4)}, ${newIncidentLocation[1].toFixed(4)}`}
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleCancelAddIncident}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleSubmitIncident}>
              Save Incident
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Pin clicks now show popups directly on the map */}
    </div>
  );
}
