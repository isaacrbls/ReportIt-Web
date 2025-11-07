"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getHotspotStats, getMostDangerousHotspot, filterHotspotsByRiskLevel } from "@/lib/hotspotUtils"

/**
 * HotspotStats Component
 * Displays comprehensive statistics about crime hotspots
 * 
 * @param {Object} props
 * @param {Array} props.hotspots - Array of hotspot objects
 * @param {string} props.barangay - Current barangay filter (optional)
 * @param {boolean} props.isLoading - Loading state
 */
export default function HotspotStats({ hotspots = [], barangay = null, isLoading = false }) {
  const stats = useMemo(() => getHotspotStats(hotspots), [hotspots])
  const mostDangerous = useMemo(() => getMostDangerousHotspot(hotspots), [hotspots])
  const highRiskHotspots = useMemo(() => filterHotspotsByRiskLevel(hotspots, 'high'), [hotspots])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hotspot Analysis</CardTitle>
          <CardDescription>Loading hotspot data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (stats.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hotspot Analysis</CardTitle>
          <CardDescription>
            {barangay ? `No hotspots found in ${barangay}` : 'No hotspots found'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-sm">No high-risk areas detected in the last 30 days</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">🔥 Hotspot Analysis</CardTitle>
        <CardDescription>
          {barangay ? `Crime hotspots in ${barangay}` : 'All crime hotspots'} (Last 30 days)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Total Hotspots</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Total Incidents</p>
            <p className="text-2xl font-bold">{stats.totalIncidents}</p>
          </div>
        </div>

        {/* Risk Level Breakdown */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Risk Level Distribution</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="bg-red-600">High Risk</Badge>
                <span className="text-sm text-gray-600">{stats.high} areas</span>
              </div>
              <span className="text-sm font-medium">{stats.high > 0 ? `${((stats.high / stats.total) * 100).toFixed(0)}%` : '0%'}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="warning" className="bg-amber-500">Medium Risk</Badge>
                <span className="text-sm text-gray-600">{stats.medium} areas</span>
              </div>
              <span className="text-sm font-medium">{stats.medium > 0 ? `${((stats.medium / stats.total) * 100).toFixed(0)}%` : '0%'}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="success" className="bg-emerald-500">Low Risk</Badge>
                <span className="text-sm text-gray-600">{stats.low} areas</span>
              </div>
              <span className="text-sm font-medium">{stats.low > 0 ? `${((stats.low / stats.total) * 100).toFixed(0)}%` : '0%'}</span>
            </div>
          </div>
        </div>

        {/* Most Dangerous Hotspot */}
        {mostDangerous && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-gray-700 mb-2">Most Dangerous Area</p>
            <div className="bg-red-50 p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Location:</span>
                <span className="text-sm font-medium">
                  {mostDangerous.lat.toFixed(4)}, {mostDangerous.lng.toFixed(4)}
                </span>
              </div>
              {mostDangerous.barangay && mostDangerous.barangay !== 'Unknown' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Barangay:</span>
                  <span className="text-sm font-medium">{mostDangerous.barangay}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Incidents:</span>
                <span className="text-sm font-bold text-red-600">{mostDangerous.incidentCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Risk Level:</span>
                <Badge variant="destructive" className="bg-red-600">
                  {mostDangerous.riskLevel.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* High Risk Areas Count */}
        {highRiskHotspots.length > 0 && (
          <div className="pt-4 border-t">
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-yellow-800">
                ⚠️ {highRiskHotspots.length} high-risk {highRiskHotspots.length === 1 ? 'area' : 'areas'} detected
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                These areas have 5 or more verified incidents in the last 30 days
              </p>
            </div>
          </div>
        )}

        {/* Average Incidents */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Average incidents per hotspot:</span>
            <span className="text-sm font-semibold">{stats.averageIncidentsPerHotspot}</span>
          </div>
        </div>

        {/* Info Footer */}
        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500">
            📍 Hotspots use ~111m grid clustering • ⏰ 30-day rolling window • ✓ Verified reports only
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
