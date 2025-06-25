"use client"

import { BarChart3, FileText, MapPin, ShieldAlert } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

interface StatsDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "reports" | "pending" | "high-risk" | "ml-accuracy" | null
}

export function StatsDetailDialog({ open, onOpenChange, type }: StatsDetailDialogProps) {
  if (!type) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {type === "reports" && (
              <>
                <FileText className="h-5 w-5 text-red-600" />
                Total Reports
              </>
            )}
            {type === "pending" && (
              <>
                <ShieldAlert className="h-5 w-5 text-red-600" />
                Pending Verification
              </>
            )}
            {type === "high-risk" && (
              <>
                <MapPin className="h-5 w-5 text-red-600" />
                High Risk Areas
              </>
            )}
            {type === "ml-accuracy" && (
              <>
                <BarChart3 className="h-5 w-5 text-red-600" />
                ML Prediction Accuracy
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {type === "reports" && "Detailed breakdown of all crime reports in the system"}
            {type === "pending" && "Reports awaiting verification by administrators"}
            {type === "high-risk" && "Areas identified as high risk based on crime frequency and ML analysis"}
            {type === "ml-accuracy" && "Performance metrics for machine learning prediction models"}
          </DialogDescription>
        </DialogHeader>

        {/* Total Reports Detail */}
        {type === "reports" && (
          <div className="space-y-6 py-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-muted-foreground">By Status</div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Verified</Badge>
                        <span>842</span>
                      </div>
                      <span className="text-sm text-muted-foreground">65.6%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Pending</Badge>
                        <span>32</span>
                      </div>
                      <span className="text-sm text-muted-foreground">2.5%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Rejected</Badge>
                        <span>410</span>
                      </div>
                      <span className="text-sm text-muted-foreground">31.9%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-muted-foreground">By Category</div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Theft</Badge>
                        <span>578</span>
                      </div>
                      <span className="text-sm text-muted-foreground">45%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Robbery</Badge>
                        <span>257</span>
                      </div>
                      <span className="text-sm text-muted-foreground">20%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Vehicle Theft</Badge>
                        <span>193</span>
                      </div>
                      <span className="text-sm text-muted-foreground">15%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Assault</Badge>
                        <span>128</span>
                      </div>
                      <span className="text-sm text-muted-foreground">10%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Burglary</Badge>
                        <span>128</span>
                      </div>
                      <span className="text-sm text-muted-foreground">10%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-muted-foreground">By Location</div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Bulihan</span>
                      <span className="text-sm text-muted-foreground">321 (25%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Mojon</span>
                      <span className="text-sm text-muted-foreground">257 (20%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Dakila</span>
                      <span className="text-sm text-muted-foreground">193 (15%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Look 1st</span>
                      <span className="text-sm text-muted-foreground">193 (15%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Longos</span>
                      <span className="text-sm text-muted-foreground">167 (13%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Pinagbakahan</span>
                      <span className="text-sm text-muted-foreground">153 (12%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="mb-4 text-sm font-medium">Monthly Report Trends</div>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { month: "Jan", reports: 98 },
                        { month: "Feb", reports: 112 },
                        { month: "Mar", reports: 125 },
                        { month: "Apr", reports: 143 },
                        { month: "May", reports: 165 },
                        { month: "Jun", reports: 182 },
                        { month: "Jul", reports: 195 },
                        { month: "Aug", reports: 178 },
                        { month: "Sep", reports: 154 },
                        { month: "Oct", reports: 132 },
                        { month: "Nov", reports: 110 },
                        { month: "Dec", reports: 89 },
                      ]}
                    >
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Line
                        type="monotone"
                        dataKey="reports"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ fill: "#ef4444", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>
                    <strong>Key Insights:</strong> Report submissions peak during summer months (May-August) with a
                    significant drop during winter. This seasonal pattern has been consistent over the past 3 years.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Link href="/admin/reports">
                <Button className="bg-red-600 hover:bg-red-700">View All Reports</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Pending Verification Detail */}
        {type === "pending" && (
          <div className="space-y-6 py-4">
            <Card>
              <CardContent className="p-4">
                <div className="mb-4 text-sm font-medium">Pending Reports by Category</div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { category: "Theft", count: 14 },
                        { category: "Robbery", count: 8 },
                        { category: "Vehicle Theft", count: 5 },
                        { category: "Assault", count: 3 },
                        { category: "Burglary", count: 2 },
                      ]}
                    >
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="text-sm font-medium">Recent Pending Reports</div>
              {[
                {
                  id: "REP-001",
                  title: "Smartphone theft at market",
                  location: "Bulihan",
                  timestamp: "May 15, 2023 - 2:30 PM",
                  category: "Theft",
                },
                {
                  id: "REP-003",
                  title: "Motorcycle theft",
                  location: "Dakila",
                  timestamp: "May 14, 2023 - 9:15 AM",
                  category: "Vehicle Theft",
                },
                {
                  id: "REP-007",
                  title: "Wallet stolen at bus terminal",
                  location: "Mojon",
                  timestamp: "May 13, 2023 - 5:45 PM",
                  category: "Theft",
                },
                {
                  id: "REP-009",
                  title: "Store shoplifting incident",
                  location: "Look 1st",
                  timestamp: "May 12, 2023 - 3:20 PM",
                  category: "Theft",
                },
                {
                  id: "REP-012",
                  title: "Attempted break-in",
                  location: "Longos",
                  timestamp: "May 11, 2023 - 11:10 PM",
                  category: "Burglary",
                },
              ].map((report) => (
                <Card key={report.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{report.id}</span>
                        <Badge variant="secondary">{report.category}</Badge>
                      </div>
                      <div className="mt-1 font-medium">{report.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {report.location} • {report.timestamp}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="border-red-600 text-red-600 hover:bg-red-50">
                        View
                      </Button>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700">
                        Verify
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                <strong>Average verification time:</strong> 8.5 hours
              </div>
              <Link href="/admin/reports?tab=pending">
                <Button className="bg-red-600 hover:bg-red-700">View All Pending</Button>
              </Link>
            </div>
          </div>
        )}

        {/* High Risk Areas Detail */}
        {type === "high-risk" && (
          <div className="space-y-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="md:col-span-2">
                <CardContent className="p-4">
                  <div className="mb-4 text-sm font-medium">High Risk Areas Overview</div>
                  <div className="rounded-lg border bg-gray-50 p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="h-[200px] rounded-lg bg-gray-200">
                          <div className="flex h-full flex-col items-center justify-center">
                            <MapPin className="h-8 w-8 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-500">Map visualization</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium">Risk Assessment Criteria</h3>
                          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                            <li>Crime frequency (incidents per 1000 residents)</li>
                            <li>Crime severity index</li>
                            <li>Proximity to crime hotspots</li>
                            <li>Time-based patterns (day/night incidents)</li>
                            <li>Environmental factors (lighting, surveillance)</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-medium">Risk Level Thresholds</h3>
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full bg-red-600"></div>
                              <span className="text-sm">High: &gt;75 risk score</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                              <span className="text-sm">Medium: 40-75 risk score</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full bg-green-500"></div>
                              <span className="text-sm">Low: &lt;40 risk score</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {[
                {
                  name: "Bulihan",
                  risk: "High",
                  score: 78,
                  incidents: 24,
                  factors: [
                    "High population density",
                    "Limited police presence",
                    "History of theft incidents",
                    "Poor lighting in certain zones",
                  ],
                  trend: "Increasing",
                },
                {
                  name: "Mojon",
                  risk: "High",
                  score: 81,
                  incidents: 19,
                  factors: [
                    "Proximity to commercial areas",
                    "Poor lighting in certain zones",
                    "Recent spike in robbery cases",
                    "Limited surveillance cameras",
                  ],
                  trend: "Stable",
                },
              ].map((area) => (
                <Card key={area.name}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">{area.name}</h3>
                      <div
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          area.risk === "High"
                            ? "bg-red-100 text-red-800"
                            : area.risk === "Medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {area.risk} Risk
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Risk Score</span>
                        <span className="font-medium">{area.score}/100</span>
                      </div>
                      <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                        <div
                          className={`h-2 rounded-full ${
                            area.risk === "High"
                              ? "bg-red-600"
                              : area.risk === "Medium"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{ width: `${area.score}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <h4 className="text-sm font-medium">Contributing Factors:</h4>
                      <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">
                        {area.factors.map((factor, index) => (
                          <li key={index}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-2 flex items-center">
                      <span className="text-sm font-medium">Trend:</span>
                      <span
                        className={`ml-2 text-sm ${
                          area.trend === "Increasing"
                            ? "text-red-600"
                            : area.trend === "Decreasing"
                              ? "text-green-600"
                              : "text-yellow-600"
                        }`}
                      >
                        {area.trend}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center">
                      <span className="text-sm font-medium">Incidents:</span>
                      <span className="ml-2 text-sm">{area.incidents} in the last 30 days</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end">
              <Link href="/admin/map">
                <Button className="bg-red-600 hover:bg-red-700">View Crime Map</Button>
              </Link>
            </div>
          </div>
        )}

        {/* ML Prediction Accuracy Detail */}
        {type === "ml-accuracy" && (
          <div className="space-y-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="md:col-span-2">
                <CardContent className="p-4">
                  <div className="mb-4 text-sm font-medium">Model Performance Overview</div>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { model: "Random Forest", accuracy: 87, precision: 84, recall: 82 },
                          { model: "LSTM", accuracy: 82, precision: 79, recall: 85 },
                          { model: "SVM", accuracy: 79, precision: 81, recall: 77 },
                        ]}
                      >
                        <XAxis dataKey="model" />
                        <YAxis domain={[0, 100]} />
                        <Bar name="Accuracy" dataKey="accuracy" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        <Bar name="Precision" dataKey="precision" fill="#f87171" radius={[4, 4, 0, 0]} />
                        <Bar name="Recall" dataKey="recall" fill="#fca5a5" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="mb-4 text-sm font-medium">Model Metrics</div>
                  <div className="space-y-4">
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <div className="text-sm font-medium">Accuracy</div>
                        <div className="text-sm text-muted-foreground">83%</div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div className="h-2 w-[83%] rounded-full bg-red-600" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <div className="text-sm font-medium">Precision</div>
                        <div className="text-sm text-muted-foreground">81%</div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div className="h-2 w-[81%] rounded-full bg-red-600" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <div className="text-sm font-medium">Recall</div>
                        <div className="text-sm text-muted-foreground">79%</div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div className="h-2 w-[79%] rounded-full bg-red-600" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <div className="text-sm font-medium">F1 Score</div>
                        <div className="text-sm text-muted-foreground">80%</div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div className="h-2 w-[80%] rounded-full bg-red-600" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="mb-4 text-sm font-medium">Prediction Accuracy by Crime Type</div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Theft</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-gray-200">
                          <div className="h-2 w-[88%] rounded-full bg-red-600" />
                        </div>
                        <span className="text-sm">88%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Robbery</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-gray-200">
                          <div className="h-2 w-[85%] rounded-full bg-red-600" />
                        </div>
                        <span className="text-sm">85%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Vehicle Theft</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-gray-200">
                          <div className="h-2 w-[82%] rounded-full bg-red-600" />
                        </div>
                        <span className="text-sm">82%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Assault</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-gray-200">
                          <div className="h-2 w-[79%] rounded-full bg-red-600" />
                        </div>
                        <span className="text-sm">79%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Burglary</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-gray-200">
                          <div className="h-2 w-[81%] rounded-full bg-red-600" />
                        </div>
                        <span className="text-sm">81%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="mb-4 text-sm font-medium">Model Improvement Over Time</div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { month: "Jan", accuracy: 72 },
                        { month: "Feb", accuracy: 74 },
                        { month: "Mar", accuracy: 75 },
                        { month: "Apr", accuracy: 78 },
                        { month: "May", accuracy: 80 },
                        { month: "Jun", accuracy: 83 },
                      ]}
                    >
                      <XAxis dataKey="month" />
                      <YAxis domain={[70, 90]} />
                      <Line
                        type="monotone"
                        dataKey="accuracy"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ fill: "#ef4444", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>
                    <strong>Key Improvements:</strong> Model accuracy has increased by 11% over the past 6 months due to
                    additional training data and algorithm refinements.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Link href="/admin/analytics">
                <Button className="bg-red-600 hover:bg-red-700">View Analytics</Button>
              </Link>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
