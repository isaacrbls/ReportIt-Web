"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

const data = [
  {
    name: "Random Forest",
    accuracy: 87,
  },
  {
    name: "LSTM",
    accuracy: 82,
  },
  {
    name: "SVM",
    accuracy: 79,
  },
]

export function PredictionAccuracyChart() {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis domain={[0, 100]} />
          <Bar
            dataKey="accuracy"
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
            label={{ position: "top", formatter: (value) => `${value}%` }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
