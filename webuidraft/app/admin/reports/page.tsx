import type { Metadata } from "next"
import ReportsPageClient from "./ReportsPageClient"

export const metadata: Metadata = {
  title: "Reports Management - ReportIt Admin",
  description: "Manage and verify crime reports",
}

export default function ReportsPage() {
  return <ReportsPageClient />
}
