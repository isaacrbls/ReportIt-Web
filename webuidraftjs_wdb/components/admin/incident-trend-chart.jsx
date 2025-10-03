"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { useCurrentUser } from "@/hooks/use-current-user";

export function IncidentTrendChart({ timePeriod = "all", sortBy = "count", sortOrder = "desc" }) {
  const [chartData, setChartData] = useState([]);
  const [reports, setReports] = useState([]);
  const { user } = useCurrentUser();

  const userBarangayMap = {
    "testpinagbakahan@example.com": "Pinagbakahan",
    "testbulihan@example.com": "Bulihan",
    "testtiaong@example.com": "Tiaong",
    "testdakila@example.com": "Dakila",
    "testmojon@example.com": "Mojon",
    "testlook@example.com": "Look 1st",
    "testlongos@example.com": "Longos",
    'test@example.com': 'All'
  };

  const filterReportsByTimePeriod = (reports, period) => {
    if (period === "all") return reports;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    return reports.filter(report => {
      if (!report.DateTime) return false;
      
      let reportDate;
      if (report.DateTime.toDate) {
        reportDate = report.DateTime.toDate();
      } else if (report.DateTime.seconds) {
        reportDate = new Date(report.DateTime.seconds * 1000);
      } else {
        reportDate = new Date(report.DateTime);
      }
      
      if (isNaN(reportDate.getTime())) return false;
      
      if (period === "monthly") {
        return reportDate.getFullYear() === currentYear && 
               reportDate.getMonth() === currentMonth;
      } else if (period === "yearly") {
        return reportDate.getFullYear() === currentYear;
      }
      
      return true;
    });
  };

  const generateTimeSeriesData = (filteredReports, period) => {
    if (filteredReports.length === 0) return [];

    const now = new Date();
    const timeGroups = {};
    
    // Initialize time periods based on selected period
    if (period === "monthly") {
      // Generate data for each day of the current month
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(now.getFullYear(), now.getMonth(), i);
        const key = date.toISOString().split('T')[0];
        timeGroups[key] = { date: key, count: 0, incidents: {} };
      }
    } else if (period === "yearly") {
      // Generate data for each month of the current year
      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), i, 1);
        const key = `${now.getFullYear()}-${String(i + 1).padStart(2, '0')}`;
        timeGroups[key] = { 
          date: key, 
          count: 0, 
          incidents: {},
          label: date.toLocaleString('default', { month: 'short' })
        };
      }
    } else {
      // For "all" time, group by month for the last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        timeGroups[key] = { 
          date: key, 
          count: 0, 
          incidents: {},
          label: date.toLocaleString('default', { month: 'short', year: '2-digit' })
        };
      }
    }

    // Populate with actual data
    filteredReports.forEach(report => {
      let reportDate;
      if (report.DateTime.toDate) {
        reportDate = report.DateTime.toDate();
      } else if (report.DateTime.seconds) {
        reportDate = new Date(report.DateTime.seconds * 1000);
      } else {
        reportDate = new Date(report.DateTime);
      }

      let key;
      if (period === "monthly") {
        key = reportDate.toISOString().split('T')[0];
      } else {
        key = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}`;
      }

      if (timeGroups[key]) {
        timeGroups[key].count++;
        const incidentType = report.IncidentType || 'Other';
        timeGroups[key].incidents[incidentType] = (timeGroups[key].incidents[incidentType] || 0) + 1;
      }
    });

    return Object.values(timeGroups).sort((a, b) => a.date.localeCompare(b.date));
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "reports"), (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (reportsData.length === 0) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        const mockReports = [
          {
            id: "mock1",
            IncidentType: "Theft",
            Barangay: "All",
            DateTime: { seconds: Math.floor(new Date(currentYear, currentMonth, 15).getTime() / 1000) }
          },
          {
            id: "mock2", 
            IncidentType: "Robbery",
            Barangay: "All",
            DateTime: { seconds: Math.floor(new Date(currentYear, currentMonth, 10).getTime() / 1000) }
          },
          {
            id: "mock3",
            IncidentType: "Assault", 
            Barangay: "All",
            DateTime: { seconds: Math.floor(new Date(currentYear, currentMonth - 1, 5).getTime() / 1000) }
          },
          {
            id: "mock4",
            IncidentType: "Vandalism",
            Barangay: "All", 
            DateTime: { seconds: Math.floor(new Date(currentYear - 1, 5, 10).getTime() / 1000) }
          },
          {
            id: "mock5",
            IncidentType: "Theft",
            Barangay: "All",
            DateTime: { seconds: Math.floor(new Date(currentYear, currentMonth - 2, 20).getTime() / 1000) }
          },
          {
            id: "mock6", 
            IncidentType: "Burglary",
            Barangay: "All",
            DateTime: { seconds: Math.floor(new Date(currentYear, currentMonth - 3, 12).getTime() / 1000) }
          }
        ];
        
        console.log("TrendChart - Using mock data for testing");
        reportsData.push(...mockReports);
      }

      console.log("TrendChart - Fetched reports:", reportsData.length);
      setReports(reportsData);

      const userEmail = user?.email;
      const barangay = userBarangayMap[userEmail] || 'Unknown';
      console.log("TrendChart - User email:", userEmail, "Barangay:", barangay);

      let filteredReports = barangay === 'All' ? reportsData : 
                           reportsData.filter(r => r.Barangay === barangay);
      
      filteredReports = filterReportsByTimePeriod(filteredReports, timePeriod);
      
      console.log("TrendChart - Time period:", timePeriod);
      console.log("TrendChart - Filtered reports:", filteredReports.length);

      const timeSeriesData = generateTimeSeriesData(filteredReports, timePeriod);
      console.log("TrendChart - Time series data:", timeSeriesData);
      setChartData(timeSeriesData);
    });

    return () => unsubscribe();
  }, [user, timePeriod]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-3 shadow-sm">
          <p className="font-medium mb-1">
            {timePeriod === "monthly" 
              ? new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : data.label || label
            }
          </p>
          <p className="text-sm text-muted-foreground">
            {data.count} incident{data.count !== 1 ? 's' : ''}
          </p>
          {Object.entries(data.incidents).length > 0 && (
            <div className="mt-1 text-xs text-gray-600">
              {Object.entries(data.incidents).map(([type, count]) => (
                <div key={type}>{type}: {count}</div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    const periodText = timePeriod === "monthly" ? "this month" : 
                      timePeriod === "yearly" ? "this year" : "all time";
    
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">No trend data available for {periodText}</p>
          <p className="text-sm">Chart will update when reports are available</p>
          {timePeriod !== "all" && (
            <p className="text-xs mt-2 text-blue-600">
              Try selecting "All Time" to see all available data
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis 
            dataKey={timePeriod === "monthly" ? "date" : "label"}
            stroke="#64748b"
            fontSize={12}
            tickFormatter={(value) => {
              if (timePeriod === "monthly") {
                return new Date(value).getDate().toString();
              }
              return value;
            }}
          />
          <YAxis 
            stroke="#64748b"
            fontSize={12}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="#dc2626" 
            strokeWidth={3}
            dot={{ fill: "#dc2626", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "#dc2626", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}