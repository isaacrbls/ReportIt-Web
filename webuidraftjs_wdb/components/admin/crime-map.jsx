"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, MapPin, X } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import the map components with no SSR
const MapWithNoSSR = dynamic(() => import("./map-component"), {
  ssr: false,
  loading: () => <div className="flex h-[500px] w-full items-center justify-center bg-gray-100">Loading map...</div>,
});

export function CrimeMap({ barangay, showPins = true, showHotspots = true, showControls = true, center, zoom }) {
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [addingIncident, setAddingIncident] = useState(false);
  const [newIncidentLocation, setNewIncidentLocation] = useState(null);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: "",
    description: "",
    category: "Theft",
    risk: "Medium",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().split(" ")[0].substring(0, 5),
  });

  const handleAddIncident = () => {
    setAddingIncident(true);
  };

  const handleCancelAddIncident = () => {
    setAddingIncident(false);
    setNewIncidentLocation(null);
    setShowIncidentForm(false);
  };

  const handleMapClick = (latlng) => {
    if (addingIncident) {
      setNewIncidentLocation(latlng);
      setShowIncidentForm(true);
      setAddingIncident(false);
    }
  };

  const handleMarkerClick = (incident) => {
    setSelectedIncident(incident);
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

    // Pass the new incident to the map component
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("addIncident", {
          detail: newIncidentData,
        })
      );
    }

    setNewIncidentLocation(null);
    setShowIncidentForm(false);
    setNewIncident({
      title: "",
      description: "",
      category: "Theft",
      risk: "Medium",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().split(" ")[0].substring(0, 5),
    });

    // Show the newly added incident
    setSelectedIncident(newIncidentData);
  };

  // Get risk color
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
      {/* Only show incident controls, pins, and overlays if showPins/hotspots/controls are true */}
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
      />

      {/* Add Incident Button */}
      {showControls && !addingIncident && !showIncidentForm && (
        <Button
          className="absolute bottom-4 left-4 z-[1000] flex items-center gap-2 bg-red-600 hover:bg-red-700"
          onClick={handleAddIncident}
        >
          <MapPin className="h-4 w-4" />
          Pin Incident
        </Button>
      )}

      {/* New Incident Form */}
      {showControls && showIncidentForm && newIncidentLocation && (
        <Card className="absolute bottom-4 left-4 z-[1000] w-80 bg-white shadow-lg">
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
                Location: {newIncidentLocation[0].toFixed(4)}, {newIncidentLocation[1].toFixed(4)}
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

      {/* Selected incident details */}
      {showPins && selectedIncident && !showIncidentForm && (
        <Card className="absolute bottom-4 right-4 z-[1000] w-72 bg-white shadow-lg">
          <CardContent className="p-4">
            <div className="flex justify-between">
              <h3 className="font-medium">{selectedIncident.title}</h3>
              <button onClick={() => setSelectedIncident(null)} className="text-gray-500 hover:text-gray-700">
                ×
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedIncident.date} at {selectedIncident.time}
            </p>
            <div
              className={`mt-1 rounded-full px-2 py-0.5 text-center text-xs font-medium ${getRiskColor(selectedIncident.risk)}`}
            >
              {selectedIncident.category} - {selectedIncident.risk} Risk
            </div>
            <p className="mt-2 text-sm">{selectedIncident.description}</p>
            <div className="mt-2 text-xs">
              <strong>Location:</strong> {selectedIncident.location[0].toFixed(4)}, {selectedIncident.location[1].toFixed(4)}
            </div>
            {selectedIncident.isUserCreated && (
              <div className="mt-2 flex justify-end">
                <button className="text-xs text-red-600 hover:underline">Edit</button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
