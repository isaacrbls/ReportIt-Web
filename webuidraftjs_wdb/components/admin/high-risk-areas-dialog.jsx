"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MapPin } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";

export const HighRiskAreasDialog = ({ open, onOpenChange }) => {
  const [highRiskBarangays, setHighRiskBarangays] = useState([]);

  useEffect(() => {
    if (!open) return;

    const fetchHighRisk = async () => {
      const querySnapshot = await getDocs(collection(db, "reports"));
      const barangayCounts = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const barangay =
          data.barangay || data.Barangay || data.location || "Unknown";
        if (!barangayCounts[barangay]) barangayCounts[barangay] = 0;
        barangayCounts[barangay]++;
      });

      const sorted = Object.entries(barangayCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      setHighRiskBarangays(sorted);
    };

    fetchHighRisk();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-8 pt-8 pb-2">
            <div className="flex items-center gap-3">
              <MapPin className="text-red-600 w-8 h-8" />
              <div>
                <div className="text-3xl font-bold leading-tight">High Risk Areas</div>
                <div className="text-gray-400 text-base mt-1">
                  Areas identified as high risk based on incident analysis
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-8 py-8">
            {/* Left: Map + markers */}
            <div className="bg-[#f7ede3] rounded-xl border border-gray-200 relative overflow-hidden min-h-[420px]">
              <div className="relative w-full h-[340px]">
                <img
                  src="/placeholder.jpg"
                  alt="Map"
                  className="w-full h-full object-cover rounded-t-xl"
                />
                <div className="absolute top-4 left-6 text-2xl font-bold text-black drop-shadow-sm">
                  High Risk Overview
                </div>

                {highRiskBarangays.map((loc, idx) => (
                  <div
                    key={loc.name}
                    className="absolute flex items-center gap-2"
                    style={{
                      top: `${18 + idx * 15}%`,
                      left: `${22 + (idx % 2) * 16}%`,
                    }}
                  >
                    <span className="w-7 h-7 bg-white border-4 border-[#b6c7d6] rounded-full flex items-center justify-center shadow-md">
                      <MapPin className="w-4 h-4 text-[#6b8ba4]" />
                    </span>
                    <span className="bg-white/80 px-2 py-0.5 rounded text-sm font-medium text-[#3a4a5a] shadow-sm">
                      {loc.name} <span className="text-xs text-gray-400">({loc.count})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Criteria and Legend */}
            <div className="bg-white rounded-xl p-6 flex flex-col shadow-sm border border-gray-100">
              <div className="font-bold text-2xl mb-4">Risk Assessment Criteria</div>
              <ul className="text-gray-400 text-lg mb-8 list-disc ml-6">
                <li>Incident frequency</li>
                <li>Incident severity index</li>
                <li>Proximity to incident hotspots</li>
              </ul>
              <div className="font-bold text-2xl mb-4">Risk Level Thresholds</div>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <span className="inline-block w-5 h-5 rounded-full bg-red-600"></span>
                  <span className="text-lg">High: &gt;75 Risk Score</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="inline-block w-5 h-5 rounded-full bg-orange-500"></span>
                  <span className="text-lg">Medium: 40–75 Risk Score</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="inline-block w-5 h-5 rounded-full bg-green-500"></span>
                  <span className="text-lg">Low: &lt;40 Risk Score</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
