# Pre-Deployment Checklist for ReportIt Admin

## ✅ reCAPTCHA Setup (CRITICAL)

### Current Status: ⚠️ Using Test Keys (NOT PRODUCTION READY)

**What you're seeing:**
- Red warning: "This reCAPTCHA is for testing purposes only"
- CAPTCHA always passes (no bot protection)

### Before Deploying to Production:

#### Step 1: Get Real reCAPTCHA Keys
1. Go to: https://www.google.com/recaptcha/admin
2. Sign in with Google account
3. Click **"+"** to create a new site
4. Fill in the form:
   ```
   Label: ReportIt Admin
   reCAPTCHA type: reCAPTCHA v2
   └─ Select: "I'm not a robot" Checkbox
   
   Domains:
   - localhost
   - 127.0.0.1
   - your-production-domain.com (e.g., reportit-admin.vercel.app)
   ```
5. Click **Submit**
6. **Copy both keys**:
   - Site Key (starts with 6L...)
   - Secret Key (starts with 6L...)

#### Step 2: Add Keys to Your Deployment Platform

**For Vercel:**
1. Go to your project dashboard
2. Settings → Environment Variables
3. Add:
   - `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` = your site key
   - `RECAPTCHA_SECRET_KEY` = your secret key
4. Redeploy

**For Netlify:**
1. Site settings → Build & deploy → Environment
2. Add the same variables
3. Trigger a new deploy

**For other platforms:**
- Add environment variables in your platform's settings
- Make sure to add both keys

#### Step 3: Verify
After deployment:
1. Visit your forgot password page
2. The red warning should be **GONE**
3. Complete the CAPTCHA
4. Should work normally without warnings

## 🚀 Deployment Options

### Option A: Deploy Now (Works but not secure)
- ✅ CAPTCHA will display
- ✅ Form will work
- ⚠️ Red warning visible to users
- ❌ No real bot protection
- ❌ Not professional looking

**When to use:** Quick testing/demo only

### Option B: Get Real Keys First (RECOMMENDED)
- ✅ No warnings
- ✅ Real bot protection
- ✅ Professional appearance
- ✅ Production ready

**When to use:** For actual deployment

## 📋 Complete Deployment Checklist

### Before Deploying:
- [ ] Get real reCAPTCHA keys from Google
- [ ] Add production domain to reCAPTCHA admin
- [ ] Add environment variables to deployment platform
- [ ] Test locally with `.env.local` file
- [ ] Commit and push code changes
- [ ] Deploy to production
- [ ] Test reCAPTCHA on live site
- [ ] Verify no red warning appears
- [ ] Test that form validation works

### After Deploying:
- [ ] Test password reset flow
- [ ] Verify email is sent
- [ ] Check CAPTCHA works correctly
- [ ] No console errors
- [ ] Mobile responsive test

## ⚠️ Common Issues

### Issue: "Invalid domain for site key"
**Solution:** Make sure your production domain is added in reCAPTCHA admin

### Issue: CAPTCHA not showing
**Solution:** Check that NEXT_PUBLIC_RECAPTCHA_SITE_KEY is set in environment variables

### Issue: Still seeing red warning
**Solution:** You're still using test keys. Get real keys and update environment variables

## 🔒 Security Notes

- ✅ **DO**: Add `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` to environment variables
- ✅ **DO**: Add `RECAPTCHA_SECRET_KEY` to environment variables (keep secret!)
- ✅ **DO**: Add `.env.local` to `.gitignore`
- ❌ **DON'T**: Commit secret keys to git
- ❌ **DON'T**: Share secret keys publicly
- ❌ **DON'T**: Use test keys in production

## 📞 Need Help?

If you encounter issues:
1. Check that domains match in reCAPTCHA admin
2. Verify environment variables are set correctly
3. Clear browser cache and try again
4. Check browser console for errors
5. Verify deployment platform redeployed with new env vars

## Quick Answer to "Will it work when deployed?"

**Short answer:** 
- ✅ YES, it will work functionally
- ⚠️ BUT users will see a red warning
- ❌ NO real bot protection

**Recommended:**
Get real reCAPTCHA keys (takes 2 minutes) before deploying for a professional, secure deployment.
