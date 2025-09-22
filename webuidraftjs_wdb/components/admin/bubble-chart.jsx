"use client";

import { useEffect, useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer } from "recharts";

const initialData = [
  { x: 10, y: 30, z: 200, name: "Bulihan", category: "Theft", risk: "High" },
  { x: 40, y: 50, z: 150, name: "Dakila", category: "Robbery", risk: "Medium" },
  { x: 70, y: 20, z: 100, name: "Longos", category: "Assault", risk: "Low" },
  { x: 30, y: 70, z: 180, name: "Look 1st", category: "Theft", risk: "Medium" },
  { x: 60, y: 80, z: 220, name: "Mojon", category: "Robbery", risk: "High" },
  { x: 90, y: 40, z: 120, name: "Pinagbakahan", category: "Assault", risk: "Low" },
];

export function BubbleChart() {
  const [data, setData] = useState(initialData);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(
        data.map((item) => ({
          ...item,
          z: item.z + Math.floor(Math.random() * 20) - 10,
        }))
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [data]);

  const getRiskColor = (risk) => {
    switch (risk) {
      case "High":
        return "#ef4444"; 
      case "Medium":
        return "#eab308"; 
      case "Low":
        return "#22c55e"; 
      default:
        return "#8884d8";
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">Category: {data.category}</p>
          <p className="text-sm text-muted-foreground">Incidents: {data.z}</p>
          <div
            className={`mt-1 rounded-full px-2 py-0.5 text-center text-xs font-medium ${
              data.risk === "High"
                ? "bg-red-100 text-red-800"
                : data.risk === "Medium"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {data.risk} Risk
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          }}
        >
          <XAxis
            type="number"
            dataKey="x"
            name="location"
            axisLine={false}
            tickLine={false}
            tick={false}
            domain={[0, 100]}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="time"
            axisLine={false}
            tickLine={false}
            tick={false}
            domain={[0, 100]}
          />
          <ZAxis type="number" dataKey="z" range={[50, 400]} />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Scatter
            data={data}
            shape="circle"
            fillOpacity={0.6}
            strokeWidth={1}
            fill={(entry) => getRiskColor(entry.risk)}
            stroke={(entry) => getRiskColor(entry.risk)}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
