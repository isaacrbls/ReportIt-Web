"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { useCurrentUser } from "@/hooks/use-current-user";

export function CrimeDistributionChart() {
  const [chartData, setChartData] = useState([]);
  const [reports, setReports] = useState([]);
  const user = useCurrentUser();

  // User-barangay mapping (same as other components)
  const userBarangayMap = {
    "testpinagbakahan@example.com": "Pinagbakahan",
    "testbulihan@example.com": "Bulihan",
    "testtiaong@example.com": "Tiaong",
    "testdakila@example.com": "Dakila",
    "testmojon@example.com": "Mojon",
    "testlook@example.com": "Look 1st",
    "testlongos@example.com": "Longos",
    // Add admin fallback to see all data
    'test@example.com': 'All'
  };

  // Color scheme for different incident types - light to dark based on severity/frequency
  const incidentColors = {
    "Theft": "#7f1d1d",           // Darkest red (most common/severe)
    "Robbery": "#991b1b",         // Very dark red
    "Vehicle Theft": "#b91c1c",   // Dark red
    "Assault": "#dc2626",         // Medium dark red
    "Burglary": "#ef4444",        // Main red
    "Vandalism": "#f87171",       // Light red
    "Fraud": "#fca5a5",           // Lighter red
    "Breaking and Entering": "#fecaca", // Very light red
    "Harassment": "#fee2e2",      // Extremely light red
    "Other": "#fef2f2"            // Lightest red for unknown/rare types
  };
  // Fetch reports and calculate distribution
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "reports"), (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log("CrimeChart - Fetched reports:", reportsData.length);
      setReports(reportsData);

      // Get user's barangay
      const userEmail = user?.email;
      const barangay = userBarangayMap[userEmail] || 'Unknown';
      console.log("CrimeChart - User email:", userEmail, "Barangay:", barangay);

      // Filter reports by barangay (unless admin viewing all)
      const filteredReports = barangay === 'All' ? reportsData : 
                             reportsData.filter(r => r.Barangay === barangay);
      
      console.log("CrimeChart - Filtered reports for", barangay + ":", filteredReports.length);

      // Calculate incident type distribution
      if (filteredReports.length > 0) {
        const incidentCounts = {};
        
        filteredReports.forEach(report => {
          const incidentType = report.IncidentType || 'Other';
          incidentCounts[incidentType] = (incidentCounts[incidentType] || 0) + 1;
        });

        // Sort incident types by count to assign colors dynamically
        const sortedIncidents = Object.entries(incidentCounts).sort((a, b) => b[1] - a[1]);
        
        // Dynamic color assignment - matches the provided screenshot
        const redShades = [
          "#dc2626",  // Dark red (for highest frequency like Theft 45%)
          "#ef4444",  // Medium red (for second highest like Robbery 20%)
          "#f87171",  // Light red (for third like Vehicle Theft 15%)
          "#fca5a5",  // Very light red (for lower frequency like Burglary 10%)
          "#fecaca",  // Lightest red (for lowest frequency like Assault 10%)
          "#fee2e2",  // Extremely light red
          "#fef2f2",  // Almost white red
          "#7f1d1d",  // Backup darker red
          "#991b1d",  // Backup very dark red
          "#b91c1c"   // Backup dark red
        ];

        // Convert to chart data with percentages and dynamic colors
        const total = filteredReports.length;
        const chartData = sortedIncidents.map(([type, count], index) => ({
          name: type,
          value: Math.round((count / total) * 100),
          count: count,
          color: redShades[index % redShades.length] // Assign color based on frequency rank
        }));

        console.log("CrimeChart - Chart data:", chartData);
        setChartData(chartData);
      } else {
        setChartData([]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Custom tooltip
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

  // Show message if no data
  if (chartData.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">No incident data available</p>
          <p className="text-sm">Chart will update when reports are available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[400px]"> {/* Increased height for a larger pie chart */}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={120} // Increased from 80 to 120 for a bigger pie
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
