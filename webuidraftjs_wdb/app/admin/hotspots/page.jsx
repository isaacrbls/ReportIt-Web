"use client"

import { useState, useEffect } from "react"
import { useReports } from "@/contexts/ReportsContext"
import { useCurrentUser } from "@/hooks/use-current-user"
import dynamic from 'next/dynamic'
import HotspotStats from "@/components/admin/hotspot-stats"
import HotspotLegend, { InlineHotspotLegend } from "@/components/admin/hotspot-legend"
import HotspotDebugPanel from "@/components/admin/hotspot-debug-panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

// Load MapComponent dynamically to avoid server-side Leaflet import
const MapComponent = dynamic(() => import('@/components/admin/map-component'), { ssr: false })

// Disable static generation for this page since it requires client-side APIs
export const dynamicParams = true
export const revalidate = 0

/**
 * Hotspot Demo Page
 * Demonstrates the complete hotspot functionality
 * 
 * Features:
 * - Interactive map with hotspots
 * - Statistics dashboard
 * - Time window selection
 * - Barangay filtering
 * - Debug panel (optional)
 */
export default function HotspotDemoPage() {
  const { user } = useCurrentUser()
  const { calculateHotspots, isLoading: reportsLoading } = useReports()
  
  const [selectedBarangay, setSelectedBarangay] = useState(user?.Barangay || null)
  const [daysWindow, setDaysWindow] = useState(30)
  const [hotspots, setHotspots] = useState([])
  const [showHotspots, setShowHotspots] = useState(true)
  const [showDebug, setShowDebug] = useState(false)

  // List of barangays in Bulacan (expand as needed)
  const barangays = [
    "Mojon",
    "Loma de Gato",
    "Bagumbayan",
    "Tikay",
    "Poblacion",
    "Sta. Ines",
    "San Jose",
    // Add more barangays...
  ]

  // Calculate hotspots when parameters change
  useEffect(() => {
    if (!reportsLoading) {
      console.log('📊 Recalculating hotspots...', { selectedBarangay, daysWindow })
      const calculated = calculateHotspots(selectedBarangay, daysWindow)
      setHotspots(calculated)
    }
  }, [selectedBarangay, daysWindow, reportsLoading, calculateHotspots])

  const handleBarangayChange = (value) => {
    setSelectedBarangay(value === 'all' ? null : value)
  }

  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered')
    const calculated = calculateHotspots(selectedBarangay, daysWindow)
    setHotspots(calculated)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">🔥 Hotspot Analysis Dashboard</h1>
        <p className="text-gray-600">
          Visualize high-incident areas based on verified reports
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Controls</CardTitle>
          <CardDescription>Customize hotspot display and filtering</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Barangay Selection */}
            <div className="space-y-2">
              <Label>Barangay Filter</Label>
              <Select value={selectedBarangay || 'all'} onValueChange={handleBarangayChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select barangay" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Barangays</SelectItem>
                  {barangays.map(barangay => (
                    <SelectItem key={barangay} value={barangay}>
                      {barangay}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time Window Selection */}
            <div className="space-y-2">
              <Label>Time Window</Label>
              <Select value={daysWindow.toString()} onValueChange={(v) => setDaysWindow(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="60">Last 60 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Label>Actions</Label>
              <Button onClick={handleRefresh} className="w-full">
                🔄 Refresh Hotspots
              </Button>
            </div>
          </div>

          {/* Display Options */}
          <div className="flex items-center space-x-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Switch 
                id="show-hotspots" 
                checked={showHotspots}
                onCheckedChange={setShowHotspots}
              />
              <Label htmlFor="show-hotspots">Show Hotspots on Map</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="show-debug" 
                checked={showDebug}
                onCheckedChange={setShowDebug}
              />
              <Label htmlFor="show-debug">Show Debug Panel</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map (Left - 2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Interactive Hotspot Map</CardTitle>
              <CardDescription>
                Click on circles to view hotspot details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-[600px] rounded-lg overflow-hidden border">
                <MapComponent
                  barangay={selectedBarangay}
                  hotspots={showHotspots ? hotspots : []}
                  showHotspots={showHotspots}
                  zoom={selectedBarangay ? 15 : 12}
                />
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <InlineHotspotLegend />
        </div>

        {/* Statistics (Right - 1 column) */}
        <div className="space-y-4">
          <HotspotStats 
            hotspots={hotspots}
            barangay={selectedBarangay}
            isLoading={reportsLoading}
          />

          {/* Debug Panel (Optional) */}
          {showDebug && (
            <HotspotDebugPanel barangay={selectedBarangay} />
          )}
        </div>
      </div>

      {/* Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ℹ️ About Hotspots</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>
            <strong>What are hotspots?</strong> Hotspots are geographic areas with high incident density, 
            calculated using grid-based spatial clustering (~111m grid cells).
          </p>
          <p>
            <strong>How are they calculated?</strong> The algorithm filters verified, non-sensitive reports 
            within the selected time window, groups them into grid cells, and classifies risk levels based on 
            incident count.
          </p>
          <p>
            <strong>Risk Levels:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong className="text-red-600">High (5+ incidents):</strong> Exercise extreme caution in these areas</li>
            <li><strong className="text-amber-600">Medium (3-4 incidents):</strong> Be aware of increased risk</li>
            <li><strong className="text-emerald-600">Low (2 incidents):</strong> Minor elevated risk compared to surrounding areas</li>
          </ul>
          <p>
            <strong>Minimum Threshold:</strong> At least 2 verified incidents are required to qualify as a hotspot.
          </p>
          <p>
            <strong>Privacy:</strong> Sensitive reports are excluded from hotspot calculations to protect privacy.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
