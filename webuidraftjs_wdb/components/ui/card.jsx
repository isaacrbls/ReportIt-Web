import * as React from "react"

import { cn } from "@/lib/utils"

export function Card({ children, ...props }) {
  return <div className="bg-white rounded-lg shadow p-4" {...props}>{children}</div>;
}

export function CardHeader({ children, ...props }) {
  return <div className="mb-2 font-semibold text-lg" {...props}>{children}</div>;
}

export function CardContent({ children, ...props }) {
  return <div className="text-gray-700" {...props}>{children}</div>;
}

export function CardTitle({ children, ...props }) {
  return <h2 className="text-xl font-bold mb-2" {...props}>{children}</h2>;
}
