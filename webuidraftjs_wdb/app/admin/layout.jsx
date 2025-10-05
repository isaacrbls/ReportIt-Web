"use client";

import { ReportsProvider } from "@/contexts/ReportsContext";
import { HybridReportsProvider } from "@/contexts/HybridReportsContext";

export default function AdminLayout({ children }) {
  return (
    <ReportsProvider>
      <HybridReportsProvider>
        {children}
      </HybridReportsProvider>
    </ReportsProvider>
  );
}