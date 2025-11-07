"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useReports } from "@/contexts/ReportsContext"
import { getHotspotStats } from "@/lib/hotspotUtils"

/**
 * HotspotDebugPanel Component
 * Testing and debugging tool for hotspot functionality
 * Shows detailed information about hotspot calculation
 * 
 * Only use in development/testing environments
 */
export default function HotspotDebugPanel({ barangay = null }) {
  const { reports, calculateHotspots, isLoading } = useReports()
  const [testResults, setTestResults] = useState(null)
  const [isTestRunning, setIsTestRunning] = useState(false)

  const runHotspotTest = (daysWindow = 30) => {
    setIsTestRunning(true)
    console.log('🧪 Running hotspot test...', { barangay, daysWindow })
    
    try {
      const startTime = performance.now()
      
      // Calculate hotspots
      const hotspots = calculateHotspots(barangay, daysWindow)
      
      const endTime = performance.now()
      const executionTime = (endTime - startTime).toFixed(2)
      
      // Get stats
      const stats = getHotspotStats(hotspots)
      
      // Filter reports for analysis
      const dateThreshold = new Date()
      dateThreshold.setDate(dateThreshold.getDate() - daysWindow)
      
      const verifiedReports = reports.filter(r => {
        if (r.Status !== "Verified") return false
        if (!r.Latitude || !r.Longitude || r.Latitude === 0 || r.Longitude === 0) return false
        if (r.isSensitive === true) return false
        
        let reportDate = null
        if (r.DateTime) {
          if (typeof r.DateTime === 'string') {
            reportDate = new Date(r.DateTime)
          } else if (r.DateTime.seconds) {
            reportDate = new Date(r.DateTime.seconds * 1000)
          } else if (r.DateTime.toDate) {
            reportDate = r.DateTime.toDate()
          }
        }
        
        if (!reportDate || isNaN(reportDate.getTime())) return false
        if (reportDate < dateThreshold) return false
        if (barangay && r.Barangay !== barangay) return false
        
        return true
      })
      
      const sensitiveReports = reports.filter(r => r.isSensitive === true).length
      const invalidCoordinates = reports.filter(r => 
        !r.Latitude || !r.Longitude || r.Latitude === 0 || r.Longitude === 0
      ).length
      
      setTestResults({
        hotspots,
        stats,
        executionTime,
        totalReports: reports.length,
        verifiedReports: verifiedReports.length,
        sensitiveReports,
        invalidCoordinates,
        daysWindow,
        barangay: barangay || 'All',
        timestamp: new Date().toLocaleString()
      })
      
      console.log('✅ Hotspot test completed:', {
        hotspotsFound: hotspots.length,
        executionTime: `${executionTime}ms`,
        stats
      })
    } catch (error) {
      console.error('❌ Hotspot test failed:', error)
      setTestResults({
        error: error.message
      })
    } finally {
      setIsTestRunning(false)
    }
  }

  const clearResults = () => {
    setTestResults(null)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🧪 Hotspot Debug Panel</CardTitle>
          <CardDescription>Loading reports data...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">🧪 Hotspot Debug Panel</CardTitle>
        <CardDescription>
          Test and debug hotspot calculation algorithm
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Controls */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Run Tests</p>
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              onClick={() => runHotspotTest(7)}
              disabled={isTestRunning}
            >
              7 Days
            </Button>
            <Button 
              size="sm" 
              onClick={() => runHotspotTest(14)}
              disabled={isTestRunning}
            >
              14 Days
            </Button>
            <Button 
              size="sm" 
              onClick={() => runHotspotTest(30)}
              disabled={isTestRunning}
              variant="default"
            >
              30 Days (Default)
            </Button>
            <Button 
              size="sm" 
              onClick={() => runHotspotTest(60)}
              disabled={isTestRunning}
            >
              60 Days
            </Button>
          </div>
          {testResults && (
            <Button 
              size="sm" 
              onClick={clearResults}
              variant="outline"
            >
              Clear Results
            </Button>
          )}
        </div>

        {/* Current Context */}
        <div className="bg-gray-50 p-3 rounded-lg space-y-1">
          <p className="text-xs font-medium text-gray-700">Current Context</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-600">Barangay:</span>
              <span className="font-medium ml-2">{barangay || 'All'}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Reports:</span>
              <span className="font-medium ml-2">{reports.length}</span>
            </div>
          </div>
        </div>

        {/* Test Results */}
        {testResults && !testResults.error && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Test Results</p>
              <Badge variant="outline">{testResults.timestamp}</Badge>
            </div>

            {/* Performance */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs font-medium text-blue-900 mb-1">⚡ Performance</p>
              <p className="text-2xl font-bold text-blue-700">{testResults.executionTime}ms</p>
              <p className="text-xs text-blue-600">Execution time</p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 p-3 rounded-lg">
                <p className="text-xs text-emerald-600 mb-1">Hotspots Found</p>
                <p className="text-2xl font-bold text-emerald-700">{testResults.stats.total}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-xs text-purple-600 mb-1">Total Incidents</p>
                <p className="text-2xl font-bold text-purple-700">{testResults.stats.totalIncidents}</p>
              </div>
            </div>

            {/* Risk Breakdown */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">Risk Breakdown</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-red-50 rounded">
                  <p className="text-xl font-bold text-red-600">{testResults.stats.high}</p>
                  <p className="text-[10px] text-red-600">High</p>
                </div>
                <div className="text-center p-2 bg-amber-50 rounded">
                  <p className="text-xl font-bold text-amber-600">{testResults.stats.medium}</p>
                  <p className="text-[10px] text-amber-600">Medium</p>
                </div>
                <div className="text-center p-2 bg-emerald-50 rounded">
                  <p className="text-xl font-bold text-emerald-600">{testResults.stats.low}</p>
                  <p className="text-[10px] text-emerald-600">Low</p>
                </div>
              </div>
            </div>

            {/* Data Quality */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">Data Quality</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Reports:</span>
                  <span className="font-medium">{testResults.totalReports}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Verified in {testResults.daysWindow} days:</span>
                  <span className="font-medium text-emerald-600">{testResults.verifiedReports}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sensitive (excluded):</span>
                  <span className="font-medium text-amber-600">{testResults.sensitiveReports}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Invalid coordinates:</span>
                  <span className="font-medium text-red-600">{testResults.invalidCoordinates}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg incidents/hotspot:</span>
                  <span className="font-medium">{testResults.stats.averageIncidentsPerHotspot}</span>
                </div>
              </div>
            </div>

            {/* Top Hotspots */}
            {testResults.hotspots.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">Top 5 Hotspots</p>
                <div className="space-y-1">
                  {testResults.hotspots.slice(0, 5).map((hotspot, index) => (
                    <div key={hotspot.id} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                      <span className="text-gray-600">#{index + 1}</span>
                      <Badge 
                        variant={
                          hotspot.riskLevel === 'high' ? 'destructive' :
                          hotspot.riskLevel === 'medium' ? 'warning' : 'success'
                        }
                        className={
                          hotspot.riskLevel === 'high' ? 'bg-red-600' :
                          hotspot.riskLevel === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                        }
                      >
                        {hotspot.riskLevel.toUpperCase()}
                      </Badge>
                      <span className="font-medium">{hotspot.incidentCount} incidents</span>
                      <span className="text-gray-500">{hotspot.radius}m</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Console Log */}
            <div className="bg-gray-900 p-3 rounded-lg">
              <p className="text-xs font-mono text-emerald-400 mb-2">// Console Output</p>
              <pre className="text-[10px] font-mono text-gray-300 overflow-x-auto">
{`🔥 Hotspots: ${testResults.stats.total}
📊 Incidents: ${testResults.stats.totalIncidents}
⚡ Time: ${testResults.executionTime}ms
🎯 Barangay: ${testResults.barangay}
📅 Window: ${testResults.daysWindow} days

Risk: ${testResults.stats.high}H/${testResults.stats.medium}M/${testResults.stats.low}L`}
              </pre>
            </div>
          </div>
        )}

        {/* Error Display */}
        {testResults && testResults.error && (
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-red-900 mb-1">❌ Test Failed</p>
            <p className="text-xs text-red-700">{testResults.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
