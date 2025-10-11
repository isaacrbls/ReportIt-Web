# User Management Implementation

## Overview
A complete user management system has been added to the ReportIt admin panel.

## Features Implemented

### 1. **User Management Page** (`/admin/users`)
- **Location**: `app/admin/users/page.jsx`
- **Features**:
  - Display all registered users in a table format
  - Real-time statistics (Total, Active, Suspended, Admins)
  - Search functionality (by email, name, or user ID)
  - Filter by status (All, Active, Suspended, Administrators)
  - Responsive design with loading states

### 2. **User Details Dialog**
- **Location**: `components/admin/user-details-dialog.jsx`
- **Features**:
  - Three tabs: Overview, Reports, History
  - **Overview Tab**:
    - User account information (ID, name, email, role, status)
    - Join date and suspension details
    - Statistics (reports count, approvals, rejections, suspensions)
  - **Reports Tab**:
    - Last 10 reports submitted by the user
    - Report status, category, and timestamp
  - **History Tab**:
    - Complete suspension history
    - Suspension reasons and durations
    - Active/expired status

### 3. **User Actions Component**
- **Location**: `components/admin/user-actions.jsx`
- **Actions Available**:
  - **Suspend User**: Suspend account for 14 days with reason
  - **Unsuspend User**: Reactivate suspended accounts
  - **Promote to Admin**: Grant administrator privileges
  - **Demote from Admin**: Remove administrator privileges
- **Features**:
  - Confirmation dialogs for all actions
  - Toast notifications for success/error
  - Real-time updates after actions

### 4. **User Management API**
- **Location**: `lib/userManagementAPI.js`
- **Functions**:
  - `getAllUsers()` - Fetch all users
  - `getUserById(userId)` - Get single user details
  - `suspendUser(userId, reason, duration)` - Suspend user account
  - `unsuspendUser(userId)` - Reactivate user account
  - `promoteToAdmin(userId)` - Grant admin role
  - `demoteFromAdmin(userId)` - Remove admin role
  - `getUserStats(userId)` - Get user statistics
  - `getSuspendedUsers()` - Get all suspended users
  - `getAdminUsers()` - Get all admin users
  - `searchUsers(searchTerm)` - Search users by email/name

### 5. **Sidebar Navigation**
- **Updated**: `components/admin/Sidebar.jsx`
- Added "Manage Users" link with Users icon

## Database Structure

### Users Collection (`users`)
```javascript
{
  id: string,
  email: string,
  displayName: string,
  name: string,
  role: "admin" | "user",
  isAdmin: boolean,
  suspended: boolean,
  suspensionReason: string,
  suspensionDate: Timestamp,
  suspensionEndDate: Timestamp,
  suspensionCount: number,
  rejectedReportCount: number,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### User Suspensions Collection (`userSuspensions`)
```javascript
{
  userId: string,
  reason: string,
  suspendedAt: Timestamp,
  suspensionEndDate: Timestamp,
  unsuspendedAt: Timestamp,
  isActive: boolean
}
```

## UI Components Used
- Card, CardContent, CardHeader, CardTitle, CardDescription
- Table, TableBody, TableCell, TableHead, TableHeader, TableRow
- Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
- AlertDialog (for confirmations)
- Input, Button, Badge, Select, Tabs
- Dropdown Menu for actions
- Textarea for suspension reasons
- Skeleton for loading states

## Navigation
- Access via: `/admin/users`
- Sidebar link: "Manage Users"

## Features Summary
✅ View all users with stats
✅ Search and filter users
✅ View detailed user information
✅ Suspend/unsuspend users
✅ Promote/demote administrators
✅ View user reports and history
✅ Track suspension history
✅ Real-time updates
✅ Toast notifications
✅ Responsive design
✅ Loading states
✅ **Automatic rejection tracking** - Tracks when users have 3 rejected reports
✅ **Auto-suspension prompt** - Shows modal asking admin to suspend user after 3 rejections
✅ **Rejection counter reset** - Option to reset counter or proceed with suspension

## Next Steps (Optional Enhancements)
- [ ] Export users to CSV
- [ ] Bulk user actions
- [ ] Email notifications to users
- [ ] More detailed analytics per user
- [ ] User activity logs
- [ ] Custom suspension durations
- [ ] Delete user functionality
