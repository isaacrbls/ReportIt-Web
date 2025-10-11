# Database-Driven Authentication Update

## Overview
The application has been updated to use Firebase Realtime Database for user authentication and authorization instead of hardcoded email mappings. This allows dynamic user management where administrators can be created with any email format (e.g., `adminmojon@gmail.com`) with their barangay and role stored in the database.

## What Changed

### 1. **User Data Utilities** (`lib/userDataUtils.js`)
Added new functions to fetch user data from Firebase Realtime Database:

- `getUserBarangayFromDB(email)` - Retrieves user's barangay from database
- `getUserRoleFromDB(email)` - Retrieves user's role from database
- `getUserProfile(email)` - Retrieves complete user profile (email, role, barangay, name)

All functions include:
- Caching mechanism (5-minute expiry)
- Error handling
- Console logging for debugging

### 2. **User Mapping** (`lib/userMapping.js`)
Updated functions to be database-driven with fallback support:

- `getUserBarangay(email)` - Now async, checks database first, falls back to hardcoded test accounts
- `isUserAdmin(email)` - Now async, checks database role first, falls back to hardcoded admin list
- `getMapCoordinatesForUser(email)` - Now async, uses database-driven barangay lookup

**Legacy Support:** Hardcoded mappings for test accounts (e.g., `testmojon@example.com`) are kept for backward compatibility.

### 3. **Updated Components**

#### Admin Dashboard (`app/admin/page.jsx`)
- Uses `useEffect` to load user barangay and coordinates asynchronously
- Stores barangay and coordinates in state
- Properly handles loading states

#### Analytics Page (`app/admin/analytics/page.jsx`)
- Loads barangay from database on component mount
- Updates state when barangay is fetched

#### Reports Page (`app/admin/reports/ReportsPageClient.jsx`)
- Loads both barangay and admin status from database
- Updates state for both values asynchronously

#### Users Management (`app/admin/users/page.jsx`)
- Loads current user's barangay from database
- Uses `user.barangay` field from loaded user data for filtering
- No longer needs fallback to email-based lookup for displayed users

#### Charts (`components/admin/crime-distribution-chart.jsx`, `incident-trend-chart.jsx`)
- Made snapshot callbacks async to support database lookups
- Stores barangay in component state
- Updates when user data is fetched

#### Enhanced Crime Map (`components/admin/enhanced-crime-map.jsx`)
- Loads barangay asynchronously on mount
- Stores in state for reactive updates

### 4. **Map Utils** (`lib/mapUtils.js`)
- Removed hardcoded `getUserBarangayFromEmail` function
- Imports `getUserBarangay` from `userMapping.js`
- `getMapConfig` is now async to support database lookups

## Database Structure

Users are stored in Firebase Realtime Database at `/users/{uid}` with the following structure:

```json
{
  "email": "adminmojon@gmail.com",
  "role": "admin",
  "barangay": "Mojon",
  "firstName": "Admin",
  "lastName": "Mojon",
  "createdAt": "2025-10-08T11:57:51.0232Z",
  "createdBy": "adminmojon@gmail.com"
}
```

### Key Fields:
- **email**: User's email address (used for authentication)
- **role**: User's role ("admin" or "user")
- **barangay**: The barangay assigned to the user (e.g., "Mojon", "Bulihan", etc.)
- **firstName**: User's first name
- **lastName**: User's last name
- **createdAt**: Timestamp when user was created
- **createdBy**: Email of the admin who created this user

## How It Works

### Authentication Flow:
1. User logs in with Firebase Auth
2. Application fetches user profile from Realtime Database using their email
3. User's barangay and role determine what data they can see and what actions they can perform

### Authorization:
- **Admins**: Users with `role: "admin"` in database
- **Barangay Filtering**: Users only see reports from their assigned barangay
- **Super Admin**: Can potentially see all barangays (if barangay is set to "All")

### Example Use Cases:

#### Creating a New Admin:
```javascript
// In Firebase Realtime Database, create a new user:
{
  "users": {
    "someUniqueUID": {
      "email": "adminmojon@gmail.com",
      "role": "admin",
      "barangay": "Mojon",
      "firstName": "Mojon",
      "lastName": "Administrator",
      "createdAt": "2025-10-11T00:00:00.000Z",
      "createdBy": "superadmin@example.com"
    }
  }
}
```

#### Accessing Reports:
When `adminmojon@gmail.com` logs in:
- System fetches their profile from database
- Finds `barangay: "Mojon"`
- Filters all reports to show only Mojon barangay reports
- Centers map on Mojon coordinates

## Migration Notes

### Test Accounts Still Supported:
The following test accounts still work with hardcoded mappings:
- `testmojon@example.com` → Mojon
- `testbulihan@example.com` → Bulihan
- `testpinagbakahan@example.com` → Pinagbakahan
- `testdakila@example.com` → Dakila
- `testlook@example.com` → Look 1st
- `testlongos@example.com` → Longos
- `testtiaong@example.com` → Tiaong

### Real Admin Example:
As shown in the Firebase screenshot, the user:
- **Email**: `adminmojon@gmail.com`
- **Role**: `admin`
- **Barangay**: `Mojon`

This user will see:
- Only reports from Mojon barangay
- Map centered on Mojon coordinates
- Admin-level permissions and features

## Benefits

1. **Dynamic User Management**: Add new admins without code changes
2. **Flexible Email Formats**: Use any email format (gmail, yahoo, etc.)
3. **Centralized User Data**: All user info in one place (Firebase Realtime Database)
4. **Easy Updates**: Change user barangay or role in database without redeployment
5. **Better Security**: No hardcoded credentials or mappings in code
6. **Scalability**: Easy to add new barangays or modify existing ones

## Caching

All database queries are cached for 5 minutes to improve performance:
- Reduces database reads
- Faster subsequent lookups
- Cache automatically expires and refreshes

To clear cache manually (for testing):
```javascript
import { clearUserDataCache } from '@/lib/userDataUtils';
clearUserDataCache();
```

## Debugging

All functions log to console with emoji prefixes:
- 🔍 Looking up data
- ✅ Successfully found data
- ❌ Errors or not found
- 📋 Using cached data
- 📡 Database connection

Check browser console for detailed logs when troubleshooting user access issues.
