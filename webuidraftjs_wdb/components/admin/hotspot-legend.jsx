"use client"

import { HOTSPOT_CONFIG } from "@/lib/hotspotUtils"

/**
 * HotspotLegend Component
 * Displays a legend explaining hotspot colors and risk levels
 * Can be overlaid on maps or displayed separately
 * 
 * @param {Object} props
 * @param {string} props.position - Position on map: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
 * @param {boolean} props.showDetails - Show detailed explanation
 */
export default function HotspotLegend({ position = 'bottom-left', showDetails = false }) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-3 ${positionClasses[position]} z-[1000]`}>
      <div className="space-y-2">
        <div className="flex items-center gap-2 pb-2 border-b">
          <span className="text-xs font-semibold text-gray-700">🔥 Crime Hotspots</span>
        </div>
        
        {/* High Risk */}
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full border-2"
            style={{ 
              backgroundColor: HOTSPOT_CONFIG.COLORS.high,
              opacity: HOTSPOT_CONFIG.OPACITY,
              borderColor: HOTSPOT_CONFIG.COLORS.high
            }}
          ></div>
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-700">High Risk</p>
            {showDetails && (
              <p className="text-[10px] text-gray-500">5+ incidents</p>
            )}
          </div>
        </div>

        {/* Medium Risk */}
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full border-2"
            style={{ 
              backgroundColor: HOTSPOT_CONFIG.COLORS.medium,
              opacity: HOTSPOT_CONFIG.OPACITY,
              borderColor: HOTSPOT_CONFIG.COLORS.medium
            }}
          ></div>
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-700">Medium Risk</p>
            {showDetails && (
              <p className="text-[10px] text-gray-500">3-4 incidents</p>
            )}
          </div>
        </div>

        {/* Low Risk */}
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full border-2"
            style={{ 
              backgroundColor: HOTSPOT_CONFIG.COLORS.low,
              opacity: HOTSPOT_CONFIG.OPACITY,
              borderColor: HOTSPOT_CONFIG.COLORS.low
            }}
          ></div>
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-700">Low Risk</p>
            {showDetails && (
              <p className="text-[10px] text-gray-500">2 incidents</p>
            )}
          </div>
        </div>

        {showDetails && (
          <div className="pt-2 border-t">
            <p className="text-[10px] text-gray-500">
              • Last 30 days<br/>
              • Verified reports only<br/>
              • ~111m grid clustering
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * InlineHotspotLegend Component
 * Non-positioned version for use in cards/panels
 */
export function InlineHotspotLegend() {
  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
      <p className="text-xs font-semibold text-gray-700">Hotspot Risk Levels</p>
      
      <div className="grid grid-cols-3 gap-2">
        {/* High Risk */}
        <div className="text-center">
          <div 
            className="w-8 h-8 rounded-full border-2 mx-auto mb-1"
            style={{ 
              backgroundColor: HOTSPOT_CONFIG.COLORS.high,
              opacity: HOTSPOT_CONFIG.OPACITY,
              borderColor: HOTSPOT_CONFIG.COLORS.high
            }}
          ></div>
          <p className="text-[10px] font-medium text-gray-700">High</p>
          <p className="text-[9px] text-gray-500">5+</p>
        </div>

        {/* Medium Risk */}
        <div className="text-center">
          <div 
            className="w-8 h-8 rounded-full border-2 mx-auto mb-1"
            style={{ 
              backgroundColor: HOTSPOT_CONFIG.COLORS.medium,
              opacity: HOTSPOT_CONFIG.OPACITY,
              borderColor: HOTSPOT_CONFIG.COLORS.medium
            }}
          ></div>
          <p className="text-[10px] font-medium text-gray-700">Medium</p>
          <p className="text-[9px] text-gray-500">3-4</p>
        </div>

        {/* Low Risk */}
        <div className="text-center">
          <div 
            className="w-8 h-8 rounded-full border-2 mx-auto mb-1"
            style={{ 
              backgroundColor: HOTSPOT_CONFIG.COLORS.low,
              opacity: HOTSPOT_CONFIG.OPACITY,
              borderColor: HOTSPOT_CONFIG.COLORS.low
            }}
          ></div>
          <p className="text-[10px] font-medium text-gray-700">Low</p>
          <p className="text-[9px] text-gray-500">2</p>
        </div>
      </div>

      <p className="text-[10px] text-gray-500 text-center pt-2 border-t">
        Based on verified incidents in last 30 days
      </p>
    </div>
  )
}
