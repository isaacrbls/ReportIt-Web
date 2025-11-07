# 🔥 Hotspot Implementation - ReportIt Web

## Overview
This implementation brings the ReportIt Mobile hotspot algorithm to the web application. Hotspots are dynamic heat zones that visualize high-incident areas within a 30-day time window, helping users identify dangerous or high-risk locations.

## 📁 Files Created/Modified

### New Files
1. **`lib/hotspotUtils.js`** - Core hotspot utilities
   - Grid-based clustering algorithm
   - Risk level calculation
   - Radius calculation
   - Report filtering/validation
   - Statistics and formatting helpers

2. **`components/admin/hotspot-stats.jsx`** - Statistics component
   - Overall hotspot metrics
   - Risk level breakdown
   - Most dangerous area display
   - High-risk area warnings

3. **`components/admin/hotspot-legend.jsx`** - Legend components
   - Map overlay legend
   - Inline legend for cards/panels
   - Color-coded risk levels

4. **`components/admin/hotspot-debug-panel.jsx`** - Testing tool
   - Run hotspot calculations with different parameters
   - Performance metrics
   - Data quality analysis
   - Top hotspots display

### Modified Files
1. **`contexts/ReportsContext.jsx`**
   - Added `calculateHotspots()` method with time filtering
   - Implements 30-day window
   - Filters sensitive reports
   - Validates coordinates
   - Uses caching for performance

2. **`components/admin/map-component.jsx`**
   - Enhanced `renderHotspots()` with better styling
   - Improved popup content
   - Risk-based visual warnings
   - Uses utility functions for consistency

## 🎯 Key Features

### 1. Smart Filtering
```javascript
// Reports must meet ALL criteria:
✓ Status = "Verified"
✓ Within last 30 days (configurable)
✓ Valid coordinates (not 0,0)
✓ Not marked as sensitive
✓ Optional: specific barangay
```

### 2. Grid-Based Clustering
```javascript
// 0.001 degrees ≈ 111 meters
GRID_SIZE: 0.001
HOTSPOT_THRESHOLD: 2  // Minimum incidents
```

### 3. Risk Level Classification
| Incidents | Risk Level | Color | Hex Code |
|-----------|------------|-------|----------|
| 5+        | HIGH       | Red   | #DC2626  |
| 3-4       | MEDIUM     | Amber | #F59E0B  |
| 2         | LOW        | Green | #10B981  |

### 4. Dynamic Radius
```javascript
// radius = sqrt(count) * 60, clamped 50-150m
2 incidents  → ~85m radius
3 incidents  → ~104m radius
5 incidents  → ~134m radius
10+ incidents → 150m (max)
```

## 🚀 Usage

### Basic Usage (Context)
```javascript
import { useReports } from '@/contexts/ReportsContext'

function MyComponent() {
  const { calculateHotspots } = useReports()
  
  // All barangays, 30 days
  const hotspots = calculateHotspots()
  
  // Specific barangay, 30 days
  const hotspots = calculateHotspots('Mojon')
  
  // Custom time window
  const hotspots = calculateHotspots('Mojon', 14) // 14 days
}
```

### Display Statistics
```javascript
import HotspotStats from '@/components/admin/hotspot-stats'

<HotspotStats 
  hotspots={hotspots}
  barangay="Mojon"
  isLoading={false}
/>
```

### Show Legend
```javascript
import HotspotLegend, { InlineHotspotLegend } from '@/components/admin/hotspot-legend'

// Map overlay
<HotspotLegend position="bottom-left" showDetails={true} />

// In a card/panel
<InlineHotspotLegend />
```

### Debug/Testing
```javascript
import HotspotDebugPanel from '@/components/admin/hotspot-debug-panel'

// Development only
<HotspotDebugPanel barangay="Mojon" />
```

### Map Component
```javascript
import MapComponent from '@/components/admin/map-component'

<MapComponent
  barangay="Mojon"
  hotspots={hotspots}
  showHotspots={true}
  // ... other props
/>
```

## 🔧 Configuration

Edit `lib/hotspotUtils.js` to customize:

```javascript
export const HOTSPOT_CONFIG = {
  GRID_SIZE: 0.001,           // ~111 meters
  HOTSPOT_THRESHOLD: 2,       // Min incidents
  DEFAULT_DAYS_WINDOW: 30,    // Time window
  MIN_RADIUS: 50,             // Min circle size
  MAX_RADIUS: 150,            // Max circle size
  RADIUS_SCALE_FACTOR: 60,    // Scale factor
  HIGH_RISK_THRESHOLD: 5,     // High risk count
  MEDIUM_RISK_THRESHOLD: 3,   // Medium risk count
  // ... colors and styling
}
```

## 📊 Data Structure

### Hotspot Object
```javascript
{
  id: "14.675_120.985",      // Grid key
  lat: 14.6755,              // Center latitude
  lng: 120.9855,             // Center longitude
  incidentCount: 7,          // Number of incidents
  riskLevel: "high",         // 'low' | 'medium' | 'high'
  incidents: [...],          // Array of report objects
  radius: 134,               // Circle radius in meters
  barangay: "Mojon"          // Barangay name
}
```

### Statistics Object
```javascript
{
  total: 15,                    // Total hotspots
  high: 3,                      // High-risk count
  medium: 5,                    // Medium-risk count
  low: 7,                       // Low-risk count
  totalIncidents: 89,           // Sum of all incidents
  averageIncidentsPerHotspot: "5.9"
}
```

## 🧪 Testing

### Manual Testing
```javascript
// In browser console:
const hotspots = calculateHotspots(null, 30)
console.log('Hotspots:', hotspots.length)
console.log('Risk breakdown:', {
  high: hotspots.filter(h => h.riskLevel === 'high').length,
  medium: hotspots.filter(h => h.riskLevel === 'medium').length,
  low: hotspots.filter(h => h.riskLevel === 'low').length
})
```

### Test Scenarios
1. **No Hotspots**: Only 1 verified report
2. **Low Risk**: 2 incidents at same location
3. **Medium Risk**: 3-4 incidents clustered
4. **High Risk**: 5+ incidents in tight cluster
5. **Multiple Hotspots**: Reports across barangays
6. **Time Filtering**: Reports older than 30 days excluded
7. **Sensitive Reports**: Excluded from calculation
8. **Invalid Coordinates**: Reports with (0,0) excluded

### Using Debug Panel
1. Add `<HotspotDebugPanel />` to any admin page
2. Click time window buttons (7/14/30/60 days)
3. View performance metrics and statistics
4. Check data quality section for issues
5. Inspect top hotspots

## 🎨 Visual Design

### Map Rendering Order (Z-Index)
1. Base Layer: OpenStreetMap tiles
2. **Hotspot Circles**: Semi-transparent overlays
3. Report Markers: Incident pins
4. User Location: Blue pulse marker

### Colors (Tailwind)
- **High**: `red-600` (#DC2626)
- **Medium**: `amber-500` (#F59E0B)
- **Low**: `emerald-500` (#10B981)

### Opacity & Styling
- Fill opacity: `0.2` (20%)
- Border weight: `3`
- Border opacity: `0.8` (80%)

## 🔄 Performance

### Caching Strategy
```javascript
// Cache key format:
`${barangay}_${daysWindow}_${totalReports}_${verifiedCount}`

// Cache size: Max 10 entries (LRU)
// Cache cleared on: Manual refresh
```

### Optimization Tips
1. **Use caching**: Don't recalculate unnecessarily
2. **Filter early**: Database queries > client filtering
3. **Lazy loading**: Only calculate when needed
4. **Debounce**: Prevent rapid recalculations

### Expected Performance
- **Small dataset** (< 100 reports): < 5ms
- **Medium dataset** (100-1000 reports): 5-50ms
- **Large dataset** (1000+ reports): 50-200ms

## ⚠️ Important Considerations

### Database Efficiency
Current implementation fetches ALL reports and filters client-side. For production with 10,000+ reports, consider:

```javascript
// Future: Server-side filtering
const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

const q = query(
  collection(db, 'reports'),
  where('Status', '==', 'Verified'),
  where('DateTime', '>=', thirtyDaysAgo),
  where('isSensitive', '==', false)
)
```

### Privacy & Security
- ✅ Sensitive reports excluded
- ✅ No user-identifying info shown
- ✅ Barangay names are public
- ✅ Exact locations generalized to grid

### Geographic Accuracy
- Grid size: ~111m at equator
- At Philippines (14°N): ~108m
- Error margin: ±50 meters
- Good for city-level analysis

## 🚀 Future Enhancements

### 1. Category-Specific Hotspots
```javascript
calculateHotspots(barangay, 30, { 
  category: 'Crime' | 'Fire' | 'Flood' 
})
```

### 2. Time-Based Filtering UI
```javascript
<select onChange={(e) => setDaysWindow(e.target.value)}>
  <option value={7}>Last 7 days</option>
  <option value={14}>Last 14 days</option>
  <option value={30}>Last 30 days</option>
  <option value={60}>Last 60 days</option>
</select>
```

### 3. Real-Time Updates
```javascript
useEffect(() => {
  const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
    const hasNewVerified = snapshot.docChanges().some(
      change => change.type === 'added' && 
               change.doc.data().Status === 'Verified'
    )
    if (hasNewVerified) {
      refreshHotspots()
    }
  })
  return unsubscribe
}, [])
```

### 4. Heatmap Layer
```javascript
import 'leaflet.heat'

L.heatLayer(points, {
  radius: 25,
  blur: 15,
  maxZoom: 17,
  gradient: {
    0.0: '#10B981',
    0.5: '#F59E0B', 
    1.0: '#DC2626'
  }
}).addTo(map)
```

### 5. Export/Report Generation
```javascript
import { exportHotspotsToCSV, generateHotspotReport } from '@/lib/hotspotUtils'

// CSV export
exportHotspotsToCSV(hotspots, 'hotspots-2025-11-07.csv')

// PDF report
generateHotspotReport(hotspots, { 
  barangay: 'Mojon',
  dateRange: '2025-10-08 to 2025-11-07'
})
```

## 📚 Related Files Reference

### Core Implementation
- `lib/hotspotUtils.js` - Algorithm & utilities
- `contexts/ReportsContext.jsx` - Data fetching & calculation

### UI Components
- `components/admin/hotspot-stats.jsx` - Statistics display
- `components/admin/hotspot-legend.jsx` - Map legends
- `components/admin/hotspot-debug-panel.jsx` - Testing tool
- `components/admin/map-component.jsx` - Map rendering

### Example Usage
- `app/admin/analytics/page.jsx` - Analytics dashboard
- `components/admin/crime-map.jsx` - Crime map component
- `components/admin/stats-cards.jsx` - Stats cards

## 🔍 Debugging

### Console Logs
```
🔥 Calculating hotspots... { targetBarangay, daysWindow, totalReports }
📅 Date threshold: [date]
📊 Found X verified reports within Y days
🔥 Found X hotspots: { high: X, medium: X, low: X }
🎯 Hotspot X: Y incidents, Zm radius, [risk] at [lat, lng]
```

### Common Issues

**Issue**: No hotspots appearing
- ✅ Check: >= 2 verified reports in last 30 days?
- ✅ Check: Valid coordinates (not 0,0)?
- ✅ Check: Reports not marked sensitive?

**Issue**: Wrong colors
- ✅ Check: `HOTSPOT_CONFIG.COLORS` values
- ✅ Check: Risk level thresholds (5, 3, 2)

**Issue**: Circles too large/small
- ✅ Adjust: `RADIUS_SCALE_FACTOR` (default: 60)
- ✅ Adjust: `MIN_RADIUS` / `MAX_RADIUS`

**Issue**: Poor performance
- ✅ Check: How many total reports?
- ✅ Solution: Implement server-side filtering
- ✅ Solution: Add pagination

## ✅ Summary

### What's Implemented
✅ Grid-based spatial clustering (~111m)
✅ 30-day time window filtering
✅ Sensitive report exclusion
✅ Coordinate validation
✅ Risk level classification (high/medium/low)
✅ Dynamic radius calculation
✅ Caching for performance
✅ Statistics component
✅ Legend components
✅ Debug/testing panel
✅ Enhanced map popups
✅ Comprehensive documentation

### Key Algorithm Features
- **Filter**: Verified, non-sensitive, valid coords, within 30 days
- **Cluster**: Grid cells of 0.001° (~111m)
- **Threshold**: Minimum 2 incidents per hotspot
- **Classify**: 5+ high, 3-4 medium, 2 low
- **Visualize**: Color-coded circles with dynamic radius

### Best Practices
1. Always use cached results when possible
2. Clear cache on manual refresh
3. Validate date formats properly
4. Handle Firestore timestamps correctly
5. Use utility functions for consistency
6. Test with debug panel before deployment
7. Monitor performance with large datasets

---

**Implementation Date**: November 7, 2025  
**Based On**: ReportIt Mobile Hotspot Algorithm  
**Version**: 1.0.0
