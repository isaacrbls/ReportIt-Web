"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { useCurrentUser } from "@/hooks/use-current-user";

export function CrimeDistributionChart({ timePeriod = "all" }) {
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

  const incidentColors = {
    "Theft": "#7f1d1d",
    "Robbery": "#991b1b",
    "Vehicle Theft": "#b91c1c",
    "Assault": "#dc2626",
    "Burglary": "#ef4444",
    "Vandalism": "#f87171",
    "Fraud": "#fca5a5",
    "Breaking and Entering": "#fecaca",
    "Harassment": "#fee2e2",
    "Other": "#fef2f2"
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
          }
        ];
        
        console.log("CrimeChart - Using mock data for testing");
        reportsData.push(...mockReports);
      }

      console.log("CrimeChart - Fetched reports:", reportsData.length);
      
      if (reportsData.length > 0) {
        console.log("CrimeChart - Sample report structure:", {
          id: reportsData[0].id,
          DateTime: reportsData[0].DateTime,
          IncidentType: reportsData[0].IncidentType,
          Barangay: reportsData[0].Barangay,
          keys: Object.keys(reportsData[0])
        });
      }
      
      setReports(reportsData);

      const userEmail = user?.email;
      const barangay = userBarangayMap[userEmail] || 'Unknown';
      console.log("CrimeChart - User email:", userEmail, "Barangay:", barangay);

      let filteredReports = barangay === 'All' ? reportsData : 
                           reportsData.filter(r => r.Barangay === barangay);
      
      filteredReports = filterReportsByTimePeriod(filteredReports, timePeriod);
      
      console.log("CrimeChart - Time period:", timePeriod);
      console.log("CrimeChart - Reports before time filter:", barangay === 'All' ? reportsData.length : reportsData.filter(r => r.Barangay === barangay).length);
      console.log("CrimeChart - Reports after time filter:", filteredReports.length);
      
      if (filteredReports.length > 0) {
        const sampleReport = filteredReports[0];
        console.log("CrimeChart - Sample report DateTime:", sampleReport.DateTime);
        if (sampleReport.DateTime?.seconds) {
          console.log("CrimeChart - Sample report parsed date:", new Date(sampleReport.DateTime.seconds * 1000));
        }
      }

      if (filteredReports.length > 0) {
        const incidentCounts = {};
        
        filteredReports.forEach(report => {
          const incidentType = report.IncidentType || 'Other';
          incidentCounts[incidentType] = (incidentCounts[incidentType] || 0) + 1;
        });

        const sortedIncidents = Object.entries(incidentCounts).sort((a, b) => b[1] - a[1]);
        
        const redShades = [
          "#dc2626",
          "#ef4444",
          "#f87171",
          "#fca5a5",
          "#fecaca",
          "#fee2e2",
          "#fef2f2",
          "#7f1d1d",
          "#991b1d",
          "#b91c1c"
        ];

        const total = filteredReports.length;
        const chartData = sortedIncidents.map(([type, count], index) => ({
          name: type,
          value: Math.round((count / total) * 100),
          count: count,
          color: redShades[index % redShades.length]
        }));

        console.log("CrimeChart - Chart data:", chartData);
        setChartData(chartData);
      } else {
        setChartData([]);
      }
    });

    return () => unsubscribe();
  }, [user, timePeriod]);
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.count} incidents ({data.value}% of total)
          </p>
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
          <p className="text-lg font-medium">No incident data available for {periodText}</p>
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
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
