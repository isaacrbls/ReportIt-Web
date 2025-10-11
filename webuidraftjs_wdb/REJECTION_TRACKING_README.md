# Rejection Tracking & Auto-Suspension Feature

## Overview
This feature automatically tracks when users have their reports rejected and provides admins with an option to suspend users after 3 rejected reports.

## How It Works

### 1. **Rejection Counter**
- Every time an admin rejects a report, the system increments the `rejectedReportCount` field for that user in the Realtime Database
- The counter is stored per user and persists across sessions
- Counter resets to 0 only when:
  - User is suspended (automatic reset upon suspension)

### 2. **Automatic Detection**
When a report is rejected:
1. System updates report status to "Rejected" in Firestore
2. System finds the user who submitted the report by email
3. System increments the user's `rejectedReportCount` in Realtime Database
4. System checks if count has reached 3

### 3. **Suspension Modal**
When a user reaches 3 rejected reports:
- A modal automatically appears asking the admin:
  - **"Do you want to suspend this user for 2 weeks?"**
- The modal displays:
  - User's email
  - Current rejection count (3)
  - Warning message
- Admin has two options:
  - **"Yes, Suspend User"** - Suspends the user for 2 weeks and resets counter to 0
  - **"No, Don't Suspend"** - Counter stays at 3, no suspension, no reset

### 4. **Suspension Details**
If admin chooses to suspend:
- **Duration**: 2 weeks (14 days)
- **Suspension Reason**: "3 reports rejected - Automatic suspension"
- **Suspended By**: "SYSTEM"
- **Counter Reset**: Automatically set to 0
- **Suspension Count**: Incremented by 1

## Implementation Details

### Files Modified

#### 1. `lib/reportUtils.js`
- Added `incrementUserRejectionCount()` - Increments rejection counter
- Added `getUserRejectionCount()` - Retrieves current rejection count
- Added `resetUserRejectionCount()` - Resets counter to 0
- Modified `updateReportStatus()` - Calls increment function when report is rejected

#### 2. `app/admin/reports/ReportsPageClient.jsx`
- Added state for suspension modal (`showSuspensionModal`, `pendingSuspensionUser`)
- Modified `handleReject()` - Checks rejection count after rejecting a report
- Added `handleSuspendUser()` - Suspends user and resets counter to 0
- Added `handleCancelSuspension()` - Keeps counter at 3, no suspension
- Added suspension confirmation modal UI

#### 3. `components/admin/user-details-dialog.jsx`
- Added display for `rejectedReportCount` in Statistics tab
- Shows "Current Rejection Count" as a purple badge
- Shows "Rejected Reports" count from actual reports

#### 4. `USER_MANAGEMENT_README.md`
- Updated database structure documentation
- Added new features to features summary

## Database Schema

### Users Collection (Realtime Database)
```javascript
{
  users: {
    [userId]: {
      email: string,
      rejectedReportCount: number,  // NEW FIELD - Current rejection count
      suspended: boolean,
      suspensionReason: string,
      suspensionDate: string,
      suspensionEndDate: string,
      suspendedBy: string,
      suspensionCount: number,      // Total times user has been suspended
      updatedAt: string
    }
  }
}
```

## User Interface

### Admin Reports Page
When rejecting a report:
1. Admin clicks reject button
2. Enters rejection reason
3. System processes rejection
4. If count reaches 3, modal appears automatically

### Suspension Modal
```
┌─────────────────────────────────────────────┐
│ User Reached 3 Rejected Reports             │
├─────────────────────────────────────────────┤
│                                             │
│ The user user@example.com has reached      │
│ 3 rejected reports.                         │
│                                             │
│ Do you want to suspend this user for        │
│ 2 weeks?                                    │
│                                             │
│ Note: If you choose "Yes", the counter     │
│ will reset to 0 after suspension. If you   │
│ choose "No", the counter will stay at 3.   │
│                                             │
├─────────────────────────────────────────────┤
│  [No, Don't Suspend]  [Yes, Suspend User]  │
└─────────────────────────────────────────────┘
```

### User Details Dialog
Statistics section now shows:
- Total Reports
- Verified Reports
- Pending Reports
- **Rejected Reports** (total rejected)
- Total Suspensions
- **Current Rejection Count** (current counter value 0-3)

## Workflow Example

### Scenario: User submits 3 false reports

1. **First Rejection**
   - Admin rejects report with reason "Misleading information"
   - User's `rejectedReportCount` = 1
   - No modal appears

2. **Second Rejection**
   - Admin rejects another report with reason "False report"
   - User's `rejectedReportCount` = 2
   - No modal appears

3. **Third Rejection**
   - Admin rejects third report with reason "Spam"
   - User's `rejectedReportCount` = 3
   - **Modal appears** asking to suspend user
   
   **Option A: Admin clicks "Yes, Suspend User"**
   - User is suspended for 2 weeks
   - `rejectedReportCount` reset to 0
   - `suspensionCount` incremented
   - User cannot submit reports during suspension
   
   **Option B: Admin clicks "No, Don't Suspend"**
   - `rejectedReportCount` stays at 3
   - User is NOT suspended
   - Counter will NOT reset
   - If user gets another report rejected, modal will appear again

## Benefits

✅ **Automated Tracking** - No manual counting needed
✅ **Admin Control** - Final decision rests with admin
✅ **Persistent Warning** - Counter stays at 3 if not suspended, serving as a warning
✅ **Transparency** - Counter visible in user details
✅ **Fair System** - Clear threshold (3 rejections)
✅ **Reset on Suspension** - Counter clears only when action is taken

## Testing

### To Test This Feature:
1. Create a test user account
2. Submit 3 reports from that account
3. As admin, reject all 3 reports one by one
4. On the 3rd rejection, modal should appear
5. Test both options:
   - Suspend user
   - Reset counter

### Verification Points:
- ✅ Counter increments after each rejection
- ✅ Modal appears on 3rd rejection
- ✅ Suspension works correctly (2 weeks)
- ✅ Counter resets to 0 after suspension
- ✅ Counter stays at 3 when admin declines suspension
- ✅ User details show correct rejection count
- ✅ Modal appears again if user at count 3 gets another rejection

## Future Enhancements (Optional)

- [ ] Configurable threshold (not hardcoded to 3)
- [ ] Configurable suspension duration
- [ ] Email notification to user when suspended
- [ ] Warning notification at 2 rejections
- [ ] Rejection history log
- [ ] Appeal system for suspended users
- [ ] Different actions for different rejection counts

## Notes

- Counter is stored in **Realtime Database**, not Firestore
- Reports are stored in **Firestore**
- System finds user by matching email address
- Suspension duration is fixed at 2 weeks (14 days)
- Counter resets only when user is suspended
- Counter stays at 3 if admin chooses not to suspend
- This creates a "warning state" where user remains flagged
