import React from 'react';
import { ReportsProvider } from '@/contexts/ReportsContext';
import HybridReportsProvider from '@/contexts/HybridReportsContext';

export default function HybridContextProvider({ children }) {
  return (
    <ReportsProvider>
      <HybridReportsProvider>
        {children}
      </HybridReportsProvider>
    </ReportsProvider>
  );
}