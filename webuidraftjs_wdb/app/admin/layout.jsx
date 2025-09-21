"use client";

import { ReportsProvider } from "@/contexts/ReportsContext";

export default function AdminLayout({ children }) {
  return (
    <ReportsProvider>
      {children}
    </ReportsProvider>
  );
}