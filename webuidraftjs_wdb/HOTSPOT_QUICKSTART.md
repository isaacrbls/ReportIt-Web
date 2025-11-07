# 🚀 Hotspot Quick Start Guide

## What Was Implemented

The complete ReportIt Mobile hotspot algorithm has been implemented for the web application, including:

✅ **Core Algorithm**
- Grid-based spatial clustering (~111m)
- 30-day time window filtering
- Sensitive report exclusion
- Coordinate validation
- Risk level classification
- Dynamic radius calculation

✅ **UI Components**
- Interactive map with hotspot circles
- Statistics dashboard
- Map legends
- Debug/testing panel
- Demo page with full controls

✅ **Developer Tools**
- Utility functions library
- Comprehensive documentation
- Testing components
- Performance monitoring

## 🎯 Quick Usage

### 1. Basic Hotspot Calculation
```javascript
import { useReports } from '@/contexts/ReportsContext'

function MyComponent() {
  const { calculateHotspots } = useReports()
  
  // Calculate hotspots (all barangays, 30 days)
  const hotspots = calculateHotspots()
  
  console.log('Found', hotspots.length, 'hotspots')
}
```

### 2. Display on Map
```javascript
import MapComponent from '@/components/admin/map-component'

<MapComponent
  hotspots={hotspots}
  showHotspots={true}
  barangay="Mojon"
/>
```

### 3. Show Statistics
```javascript
import HotspotStats from '@/components/admin/hotspot-stats'

<HotspotStats hotspots={hotspots} barangay="Mojon" />
```

### 4. Add Legend
```javascript
import { InlineHotspotLegend } from '@/components/admin/hotspot-legend'

<InlineHotspotLegend />
```

## 📍 Try It Now

### Option 1: Demo Page
Navigate to `/admin/hotspots` to see the complete demo with:
- Interactive map
- Statistics dashboard
- Time window controls
- Barangay filtering
- Debug panel

### Option 2: Existing Pages
Hotspots are already integrated into:
- Analytics page (`/admin/analytics`)
- Crime map component
- Stats cards

## 🧪 Testing

### Quick Test in Browser Console
```javascript
// Get the context
const { calculateHotspots } = window.__REPORTS_CONTEXT__

// Calculate hotspots
const hotspots = calculateHotspots(null, 30)

// View results
console.table(hotspots)
```

### Using Debug Panel
1. Go to `/admin/hotspots`
2. Enable "Show Debug Panel"
3. Click time window buttons (7/14/30/60 days)
4. View detailed metrics and performance data

## 🎨 Customization

### Change Colors
Edit `lib/hotspotUtils.js`:
```javascript
export const HOTSPOT_CONFIG = {
  COLORS: {
    high: '#DC2626',    // Change to your preferred red
    medium: '#F59E0B',  // Change to your preferred amber
    low: '#10B981',     // Change to your preferred green
  }
}
```

### Adjust Thresholds
```javascript
export const HOTSPOT_CONFIG = {
  HOTSPOT_THRESHOLD: 2,       // Min incidents (change to 3 for stricter)
  HIGH_RISK_THRESHOLD: 5,     // High risk (change to 7 for stricter)
  MEDIUM_RISK_THRESHOLD: 3,   // Medium risk
}
```

### Change Time Window
```javascript
// In your component
const hotspots = calculateHotspots('Mojon', 14) // 14 days instead of 30
```

## 📊 Understanding Results

### Hotspot Object Structure
```javascript
{
  id: "14.675_120.985",      // Unique grid key
  lat: 14.6755,              // Center coordinates
  lng: 120.9855,
  incidentCount: 7,          // Number of incidents
  riskLevel: "high",         // 'low' | 'medium' | 'high'
  incidents: [...],          // Full report objects
  radius: 134,               // Circle size in meters
  barangay: "Mojon"         // Barangay name
}
```

### Risk Level Meanings
- **HIGH (Red)**: 5+ incidents - High-crime area, exercise extreme caution
- **MEDIUM (Amber)**: 3-4 incidents - Elevated risk, be aware
- **LOW (Green)**: 2 incidents - Minor elevated risk

## 🐛 Troubleshooting

### No Hotspots Appearing?
Check:
1. Are there verified reports in the last 30 days?
2. Do reports have valid coordinates (not 0,0)?
3. Are reports marked as sensitive? (they're excluded)
4. Open debug panel to see detailed filtering info

### Performance Issues?
- Clear cache: Use refresh button
- Reduce time window: Use 7 or 14 days instead of 30
- Check total report count in debug panel
- Consider server-side filtering for 1000+ reports

### Wrong Colors/Sizes?
- Check `HOTSPOT_CONFIG` in `lib/hotspotUtils.js`
- Verify incident counts in debug panel
- Test with known data

## 📝 Next Steps

### For Developers
1. Read `HOTSPOT_IMPLEMENTATION.md` for detailed docs
2. Test with real data using debug panel
3. Customize colors/thresholds as needed
4. Integrate into your existing pages

### For Admins
1. Visit `/admin/hotspots` demo page
2. Test different time windows
3. Filter by barangay
4. Share insights with team

### Future Enhancements
- [ ] Category-specific hotspots (Crime vs Fire vs Flood)
- [ ] Real-time updates via Firestore subscriptions
- [ ] Heatmap layer option
- [ ] Export to CSV/PDF
- [ ] Historical comparison (e.g., this month vs last month)
- [ ] Email alerts for new high-risk areas

## 📚 Documentation

- **Full Implementation Guide**: `HOTSPOT_IMPLEMENTATION.md`
- **Utility Functions**: `lib/hotspotUtils.js`
- **Context API**: `contexts/ReportsContext.jsx`
- **Components**: `components/admin/hotspot-*.jsx`

## 🆘 Support

If you encounter issues:
1. Check browser console for error messages
2. Use debug panel to analyze data quality
3. Verify Firestore data structure matches expectations
4. Review `HOTSPOT_IMPLEMENTATION.md` for detailed explanations

## ✅ Checklist

Before deploying to production:

- [ ] Test with real data
- [ ] Verify performance with full dataset
- [ ] Customize colors to match brand
- [ ] Adjust thresholds as needed
- [ ] Remove debug panel from production builds
- [ ] Add hotspot pages to navigation
- [ ] Train users on interpretation
- [ ] Document any customizations
- [ ] Set up monitoring/logging

---

**Ready to use!** 🎉

Start at `/admin/hotspots` or integrate into your existing dashboards.
