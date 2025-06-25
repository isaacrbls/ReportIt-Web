"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

// Sample data for crime distribution
const data = [
	{ name: "Theft", value: 45, color: "#ef4444" }, // Red
	{ name: "Robbery", value: 20, color: "#f87171" }, // Lighter red
	{ name: "Vehicle Theft", value: 15, color: "#fca5a5" }, // Even lighter red
	{ name: "Assault", value: 10, color: "#fee2e2" }, // Very light red
	{ name: "Burglary", value: 10, color: "#fecaca" }, // Light red
]

export function CrimeDistributionChart() {
	// Custom tooltip
	const CustomTooltip = ({ active, payload }: any) => {
		if (active && payload && payload.length) {
			return (
				<div className="rounded-lg border bg-background p-2 shadow-sm">
					<p className="font-medium">{payload[0].name}</p>
					<p className="text-sm text-muted-foreground">
						{payload[0].value}% of total crimes
					</p>
				</div>
			)
		}
		return null
	}

	return (
		<div className="h-[400px]"> {/* Increased height for a larger pie chart */}
			<ResponsiveContainer width="100%" height="100%">
				<PieChart>
					<Pie
						data={data}
						cx="50%"
						cy="50%"
						labelLine={false}
						outerRadius={120} // Increased from 80 to 120 for a bigger pie
						fill="#8884d8"
						dataKey="value"
						label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
					>
						{data.map((entry, index) => (
							<Cell key={`cell-${index}`} fill={entry.color} />
						))}
					</Pie>
					<Tooltip content={<CustomTooltip />} />
				</PieChart>
			</ResponsiveContainer>
		</div>
	)
}
