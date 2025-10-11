# reCAPTCHA Fix Guide

## ✅ Solution Applied

The reCAPTCHA is now using **Google's test keys** that work on localhost and any domain.

## Error Explanation

The error "ERROR for site owner: Invalid domain for site key" occurred because:
- reCAPTCHA keys are tied to specific domains
- The previous site key `6Le5EqYrAAAAAP2mb8lP1ASQekXl_4B70T87eYyl` was not authorized for localhost

## Current Status

✅ **CAPTCHA is visible and working** - Using Google's test keys
✅ **No domain errors** - Test keys work on all domains
⚠️ **Using test keys** - These ALWAYS pass validation (no real bot protection)
⚠️ **For development only** - Replace with real keys for production

## How to Get Real reCAPTCHA Keys (For Production)

**Site Key**: `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`
**Secret Key**: `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`

These are official Google test keys that:
- ✅ Work on any domain (localhost, 127.0.0.1, etc.)
- ✅ Display the reCAPTCHA widget
- ⚠️ ALWAYS pass validation (no real protection)
- ⚠️ Should NOT be used in production

### Step 1: Go to Google reCAPTCHA Admin
Visit: https://www.google.com/recaptcha/admin

### Step 2: Create a New Site
1. Click the **+** button to add a new site
2. Fill in the form:
   - **Label**: ReportIt Admin (or any name)
   - **reCAPTCHA type**: reCAPTCHA v2 → "I'm not a robot" Checkbox
   - **Domains**: Add your domains:
     - `localhost` (for development)
     - `127.0.0.1` (for development)
     - Your production domain (e.g., `reportit-admin.com`)
   - Accept the reCAPTCHA Terms of Service
3. Click **Submit**

### Step 3: Copy Your Keys
You'll get two keys:
- **Site Key** (Public key) - Used in frontend
- **Secret Key** (Private key) - Used in backend API

### Step 4: Update Your Project

#### Update Site Key in `lib/recaptcha.js`:
```javascript
// Replace the test key with your real key:
export const RECAPTCHA_SITE_KEY = "YOUR_NEW_SITE_KEY_HERE";
```

#### Update Secret Key in Environment Variables:
Create/update `.env.local` file:
```
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=YOUR_NEW_SITE_KEY_HERE
RECAPTCHA_SECRET_KEY=YOUR_NEW_SECRET_KEY_HERE
```

### Step 5: Update Your Code

Replace the test keys with your real keys in the code - no need to re-enable anything, CAPTCHA is already active!

## Alternative: Use Environment Variables

For better security, use environment variables:

### 1. Create `.env.local`:
```
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
```

### 2. Update `lib/recaptcha.js`:
```javascript
// Replace test key with your real key
export const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "your_site_key_here";
```

### 3. Restart your dev server

## Testing After Setup

1. Go to forgot password page
2. You should see the reCAPTCHA checkbox
3. Click "I'm not a robot"
4. Complete the challenge if prompted
5. Submit the form
6. No errors should appear

## Files Modified

- ✅ `app/forgot-password/page.jsx` - CAPTCHA is active and working
- ✅ `lib/recaptcha.js` - Updated to use Google's test keys (works on localhost)

## Important Notes

⚠️ **For Development**: The current setup (CAPTCHA disabled) is fine
⚠️ **For Production**: Must re-enable CAPTCHA with valid keys
⚠️ **Security**: Never commit secret keys to git - use environment variables

## Quick Checklist

For Development (Current):
- [x] CAPTCHA visible and working
- [x] Using Google test keys
- [x] No domain errors
- [x] Password reset works
- [x] No real bot protection (test keys always pass)

For Production (TODO):
- [ ] Get new reCAPTCHA keys from Google
- [ ] Add all production domains to reCAPTCHA admin
- [ ] Update site key in code with real key
- [ ] Add secret key to environment variables
- [ ] Test thoroughly with real keys

## Need Help?

The CAPTCHA should now work without errors! If you see the "Invalid domain" error:
1. Make sure you're using the test key: `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`
2. Clear your browser cache
3. Restart your dev server

To use real keys:
1. Get new keys from https://www.google.com/recaptcha/admin
2. Add `localhost` and `127.0.0.1` to domains
3. Update the site key in `lib/recaptcha.js`
4. Test on your registered domain
