# Barangay Filtering Fix

## Issue
The admin dashboard was showing 0 reports for `adminmojon@gmail.com` even though reports exist in Firestore with `Barangay: "Mojon"`.

## Root Causes

### 1. **Async Loading Issue**
- User's barangay was being loaded asynchronously from Firebase Realtime Database
- Stats were calculated before the barangay finished loading
- Initial state: `userBarangay = ""` (empty string)
- This caused filtering to return 0 results initially

### 2. **Case Sensitivity Mismatch**
- **Realtime Database**: Stores barangay as `"mojon"` (lowercase)
- **Firestore Reports**: Stores Barangay as `"Mojon"` (capitalized first letter)
- Comparison was case-sensitive: `"mojon" !== "Mojon"` → No matches!

## Solutions Applied

### 1. **Reactive Stats Calculation**
File: `app/admin/page.jsx`

```javascript
// Use useMemo to recalculate when userBarangay changes
const filteredReports = React.useMemo(() => {
  if (!userBarangay) return []; // Guard against empty barangay
  return getReportsByBarangay(userBarangay);
}, [userBarangay, reports, getReportsByBarangay]);

const pendingReports = React.useMemo(() => {
  if (!userBarangay) return 0;
  return getPendingReports(userBarangay).length;
}, [userBarangay, reports, getPendingReports]);
```

**Benefits:**
- Stats automatically recalculate when `userBarangay` loads
- Returns empty/0 while barangay is loading
- Updates to correct values once barangay is loaded

### 2. **Case-Insensitive Comparison**
File: `contexts/ReportsContext.jsx`

```javascript
const getReportsByBarangay = (barangay) => {
  if (!barangay || barangay === 'All') return reports;
  
  // Case-insensitive comparison
  const barangayLower = barangay.toLowerCase();
  const filtered = reports.filter(r => {
    if (!r.Barangay) return false;
    return r.Barangay.toLowerCase() === barangayLower;
  });
  
  return filtered;
};
```

**Benefits:**
- Works with any case variation: "mojon", "Mojon", "MOJON"
- Handles both Realtime DB format and Firestore format

### 3. **Barangay Normalization**
File: `lib/userDataUtils.js`

```javascript
// Normalize barangay to match Firestore format
if (barangay && typeof barangay === 'string') {
  barangay = barangay.charAt(0).toUpperCase() + barangay.slice(1).toLowerCase();
}
// "mojon" → "Mojon"
```

**Benefits:**
- Converts Realtime DB format to Firestore format
- Consistent capitalization throughout the app
- Better for display purposes

### 4. **Enhanced Logging**
Added comprehensive logging to debug issues:

```javascript
// In ReportsProvider
console.log('📍 Reports by Barangay:', barangayCounts);

// In getReportsByBarangay
console.log(`📍 Filtering for "${barangay}" - Found ${filtered.length} reports`);

// In getUserBarangayFromDB
console.log(`✅ Found barangay: "${barangay}" (normalized from "${originalValue}")`);
```

## Data Flow

1. **User Logs In**: `adminmojon@gmail.com`
2. **Load User Data**: 
   - Fetch from Realtime DB: `{ email: "adminmojon@gmail.com", barangay: "mojon", role: "admin" }`
   - Normalize: `"mojon"` → `"Mojon"`
   - Cache result
3. **Update State**: `setUserBarangay("Mojon")`
4. **Trigger Recalculation**: `useMemo` hooks detect change
5. **Filter Reports**: 
   - Compare: `"Mojon".toLowerCase() === "mojon".toLowerCase()` → ✅ Match!
   - Return matching reports
6. **Display Stats**: Dashboard shows correct counts

## Testing

Open browser console and look for these logs:

```
🔄 ReportsProvider: Setting up Firebase listener
📊 ReportsProvider: Fetched reports: X
📍 Reports by Barangay: { Mojon: 5, Bulihan: 3, ... }
🔍 getUserBarangayFromDB: Looking up barangay for: adminmojon@gmail.com
✅ Found barangay: "Mojon" (normalized from "mojon")
🔢 Calculating filteredReports - userBarangay: Mojon total reports: X
📍 getReportsByBarangay: Filtering for "Mojon" - Found Y reports
✅ Filtered reports for Mojon: Y
```

## Database Structure

### Realtime Database (`/users/{uid}`)
```json
{
  "email": "adminmojon@gmail.com",
  "role": "admin",
  "barangay": "mojon",  // ← lowercase
  "firstName": "Admin",
  "lastName": "Mojon"
}
```

### Firestore (`/reports/{reportId}`)
```json
{
  "Barangay": "Mojon",  // ← Capitalized
  "SubmittedByEmail": "emmilisaac@gmail.com",
  "IncidentType": "Assault/Harassment",
  "Status": "Verified",
  "DateTime": "2025-10-10T07:36:45.573Z"
}
```

## Key Takeaways

1. ✅ **Always use `useMemo`/`useEffect`** for values that depend on async data
2. ✅ **Case-insensitive comparisons** prevent data mismatch issues
3. ✅ **Normalize data** when loading from database for consistency
4. ✅ **Add logging** to debug cross-database issues
5. ✅ **Guard conditions** prevent errors during loading states
