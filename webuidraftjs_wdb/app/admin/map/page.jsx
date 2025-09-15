"use client"

import Link from "next/link"
import { ChevronLeft, Download, Filter, Layers, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CrimeMap } from "@/components/admin/crime-map"
import React from "react"
import { getMapCoordinatesForUser } from "@/lib/userMapping"

export default function Page() {
  const { user, isLoading: isUserLoading } = useCurrentUser()
  
  const userEmail = user?.email || ""
  
  // Use centralized map coordinates - only get coordinates when user is loaded
  const userCoordinates = isUserLoading ? { center: [14.8527, 120.816], zoom: 16 } : getMapCoordinatesForUser(userEmail);
  const mapCenter = userCoordinates.center;
  
  const defaultBarangay = ""
  const defaultZoom = userCoordinates.zoom

  console.log("🗺️ Map page - Current user:", user);
  console.log("📧 Map page - User email:", userEmail);
  console.log("🎯 Map page - Map center:", mapCenter);
  console.log("🔄 Map page - Is user loading:", isUserLoading);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-10 border-b bg-red-600 text-white">
        <div className="flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-white" />
            <h1 className="text-lg font-semibold">ReportIt Admin</h1>
          </div>
          <nav className="ml-auto flex gap-4 sm:gap-6">
            <Link
              href="/admin"
              className="text-sm font-medium text-white/80 underline-offset-4 hover:text-white hover:underline"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/reports"
              className="text-sm font-medium text-white/80 underline-offset-4 hover:text-white hover:underline"
            >
              Reports
            </Link>
            <Link
              href="/admin/analytics"
              className="text-sm font-medium text-white/80 underline-offset-4 hover:text-white hover:underline"
            >
              Analytics
            </Link>
            <Link href="/admin/map" className="text-sm font-medium text-white underline-offset-4 hover:underline">
              Map
            </Link>
            <Link
              href="/admin/settings"
              className="text-sm font-medium text-white/80 underline-offset-4 hover:text-white hover:underline"
            >
              Settings
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <div className="flex items-center">
          <Link href="/admin" className="flex items-center text-sm text-red-600 hover:underline">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Crime Map</h1>
            <p className="text-muted-foreground">Interactive crime mapping and hotspot analysis</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2 border-red-600 text-red-600 hover:bg-red-50">
              <Download className="h-4 w-4" />
              Export Map
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 md:flex-row">
          <div className="flex flex-1 items-center gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Crime Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="theft">Theft</SelectItem>
                <SelectItem value="robbery">Robbery</SelectItem>
                <SelectItem value="vehicle-theft">Vehicle Theft</SelectItem>
                <SelectItem value="assault">Assault</SelectItem>
                <SelectItem value="burglary">Burglary</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="30">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-10 w-10 border-red-600 text-red-600 hover:bg-red-50">
              <Filter className="h-4 w-4" />
              <span className="sr-only">Filter</span>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="heatmap" className="mt-6">
          <TabsList className="bg-red-100">
            <TabsTrigger value="heatmap" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
              Hotspot View
            </TabsTrigger>
            <TabsTrigger value="incidents" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
              Incident View
            </TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
              Analysis
            </TabsTrigger>
          </TabsList>
          <TabsContent value="heatmap" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Crime Hotspots</CardTitle>
                <CardDescription>Visualizing high-risk areas based on crime frequency and ML analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center justify-end gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-600"></div>
                    <span className="text-xs">High Risk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <span className="text-xs">Medium Risk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <span className="text-xs">Low Risk</span>
                  </div>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Layers className="h-4 w-4" />
                    Layers
                  </Button>
                </div>
                {isUserLoading ? (
                  <div className="flex h-[500px] w-full items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                      <p className="text-gray-600">Loading map...</p>
                    </div>
                  </div>
                ) : (
                  <CrimeMap center={mapCenter} barangay={defaultBarangay} zoom={defaultZoom} />
                )}
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>
                    <strong>Instructions:</strong> Click the "Pin Incident" button to add a new incident. Click on
                    hotspots (colored circles) to view area details. Click on markers to view incident details.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="incidents" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Incident Map</CardTitle>
                <CardDescription>Individual crime incidents plotted on the map</CardDescription>
              </CardHeader>
              <CardContent>
                {isUserLoading ? (
                  <div className="flex h-[500px] w-full items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                      <p className="text-gray-600">Loading map...</p>
                    </div>
                  </div>
                ) : (
                  <CrimeMap center={mapCenter} barangay={defaultBarangay} zoom={defaultZoom} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="analysis" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Spatial Analysis</CardTitle>
                <CardDescription>ML-driven analysis of crime patterns and spatial relationships</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    {isUserLoading ? (
                      <div className="flex h-[500px] w-full items-center justify-center bg-gray-100 rounded-lg">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                          <p className="text-gray-600">Loading map...</p>
                        </div>
                      </div>
                    ) : (
                      <CrimeMap center={mapCenter} barangay={defaultBarangay} zoom={defaultZoom} />
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <h3 className="mb-2 text-lg font-medium">Hotspot Analysis</h3>
                      <p className="text-sm text-muted-foreground">
                        Our ML models have identified 6 distinct hotspots across the municipality, with the highest
                        concentration of crime in the Bulihan Market Area and Mojon Shopping District.
                      </p>
                      <div className="mt-4">
                        <h4 className="text-sm font-medium">Top Hotspots:</h4>
                        <ul className="mt-2 space-y-2">
                          <li className="flex items-center justify-between rounded-md bg-gray-50 p-2">
                            <span>Bulihan Market Area</span>
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                              24 incidents
                            </span>
                          </li>
                          <li className="flex items-center justify-between rounded-md bg-gray-50 p-2">
                            <span>Mojon Shopping District</span>
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                              19 incidents
                            </span>
                          </li>
                          <li className="flex items-center justify-between rounded-md bg-gray-50 p-2">
                            <span>Dakila Bus Terminal</span>
                            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                              12 incidents
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <h3 className="mb-2 text-lg font-medium">Pattern Recognition</h3>
                      <p className="text-sm text-muted-foreground">
                        Our spatial analysis has identified these key patterns:
                      </p>
                      <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                        <li>Theft incidents cluster around commercial areas and transportation hubs</li>
                        <li>Vehicle thefts are concentrated in parking areas with limited surveillance</li>
                        <li>Robbery incidents show a linear pattern along major transportation routes</li>
                        <li>Low-risk areas correlate with active community policing programs</li>
                      </ul>
                    </div>
                    <div className="rounded-lg border p-4">
                      <h3 className="mb-2 text-lg font-medium">Recommended Actions</h3>
                      <ul className="list-inside list-disc space-y-1 text-sm">
                        <li>Increase police patrols in Bulihan Market Area during peak hours (5-8 PM)</li>
                        <li>Install additional CCTV cameras in Mojon Shopping District</li>
                        <li>Improve lighting around Dakila Bus Terminal</li>
                        <li>Implement community watch program in Look 1st Commercial Zone</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
