import type { Metadata } from "next"
import CategoriesPageClient from "./CategoriesPageClient"

export const metadata: Metadata = {
  title: "Categories Management - ReportIt Admin",
  description: "Manage crime categories and keywords for machine learning categorization",
}

export default function CategoriesPage() {
  return <CategoriesPageClient />
}
