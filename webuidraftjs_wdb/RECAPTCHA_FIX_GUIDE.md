# reCAPTCHA Fix Guide

## ✅ Quick Fix Applied

The reCAPTCHA has been temporarily disabled to allow the forgot password page to work during development.

## Error Explanation

The error "ERROR for site owner: Invalid domain for site key" occurs because:
- reCAPTCHA keys are tied to specific domains
- The current site key `6Le5EqYrAAAAAP2mb8lP1ASQekXl_4B70T87eYyl` is not authorized for your current domain (localhost or your deployment URL)

## Current Status

✅ **Forgot password page now works** - CAPTCHA validation temporarily bypassed
⚠️ **CAPTCHA is hidden** - Not visible on the page
⚠️ **No bot protection** - Should be re-enabled for production

## How to Get New reCAPTCHA Keys (For Production)

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
export const RECAPTCHA_SITE_KEY = "YOUR_NEW_SITE_KEY_HERE";
```

#### Update Secret Key in Environment Variables:
Create/update `.env.local` file:
```
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=YOUR_NEW_SITE_KEY_HERE
RECAPTCHA_SECRET_KEY=YOUR_NEW_SECRET_KEY_HERE
```

### Step 5: Re-enable reCAPTCHA

In `app/forgot-password/page.jsx`, change:
```javascript
// From:
if (false && (
  <div className="flex justify-center">
    <ReCAPTCHA
      ref={recaptchaRef}
      sitekey={RECAPTCHA_SITE_KEY}
      onChange={handleCaptcha}
    />
  </div>
))

// To:
<div className="flex justify-center">
  <ReCAPTCHA
    ref={recaptchaRef}
    sitekey={RECAPTCHA_SITE_KEY}
    onChange={handleCaptcha}
  />
</div>
```

And uncomment the validation:
```javascript
// From:
// if (!captchaToken) {
//   setCaptchaError("Please complete the CAPTCHA.");
//   return;
// }

// To:
if (!captchaToken) {
  setCaptchaError("Please complete the CAPTCHA.");
  return;
}
```

## Alternative: Use Environment Variables

For better security, use environment variables:

### 1. Create `.env.local`:
```
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
```

### 2. Update `lib/recaptcha.js`:
```javascript
export const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6Le5EqYrAAAAAP2mb8lP1ASQekXl_4B70T87eYyl";
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

- ✅ `app/forgot-password/page.jsx` - CAPTCHA temporarily disabled
- 📝 `lib/recaptcha.js` - Contains site key (update this with new key)

## Important Notes

⚠️ **For Development**: The current setup (CAPTCHA disabled) is fine
⚠️ **For Production**: Must re-enable CAPTCHA with valid keys
⚠️ **Security**: Never commit secret keys to git - use environment variables

## Quick Checklist

For Development (Current):
- [x] CAPTCHA disabled
- [x] Password reset works
- [x] No domain errors

For Production (TODO):
- [ ] Get new reCAPTCHA keys from Google
- [ ] Add all domains to reCAPTCHA admin
- [ ] Update site key in code
- [ ] Add secret key to environment variables
- [ ] Re-enable CAPTCHA validation
- [ ] Test thoroughly

## Need Help?

If you need to re-enable CAPTCHA now:
1. Get new keys from https://www.google.com/recaptcha/admin
2. Add `localhost` and `127.0.0.1` to domains
3. Update the site key in `lib/recaptcha.js`
4. Uncomment the CAPTCHA code in `forgot-password/page.jsx`
