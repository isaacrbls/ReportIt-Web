# Quick Setup Instructions

## 🚀 Fix the Firebase Error in 30 Seconds

### Option 1: Copy the Example File (FASTEST)

In PowerShell, run:
```powershell
Copy-Item .env.local.example .env.local
```

Then restart your dev server:
```powershell
npm run dev
```

### Option 2: Manual Setup

1. **Create `.env.local` file** in the root of your project

2. **Copy this content** into `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAOz81U2qnC2MEq-P1yMbUiQW8qAPTh9OU
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=admin-76567.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://admin-76567-default-rtdb.asia-southeast1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=admin-76567
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=admin-76567.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=189749622351
NEXT_PUBLIC_FIREBASE_APP_ID=1:619048161769:web:b187fce60ba1e109bdfb78
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
```

3. **Restart your dev server**

4. **Done!** ✅

## ✅ Verification

After setup, you should:
- ✅ No more "invalid-api-key" error
- ✅ Can access forgot password page
- ✅ Firebase authentication works
- ✅ reCAPTCHA works (with test warning)

## 🔍 Where I Got These Keys

These Firebase keys are from your existing `firebase.js` file. They're already working in your project when using `firebase.js`.

The issue was that `lib/firebase.js` was trying to use environment variables that weren't set.

## 📋 Next Steps

### For Development:
- [x] Create `.env.local` (you're doing this now)
- [x] Restart dev server
- [x] Test authentication

### For Production:
- [ ] Get fresh Firebase keys from console (recommended)
- [ ] Get real reCAPTCHA keys
- [ ] Add all environment variables to deployment platform
- [ ] Deploy

## 🆘 Still Getting Errors?

### Error: "Cannot find module '.env.local'"
**Fix:** Make sure `.env.local` is in the ROOT of your project (same folder as `package.json`)

### Error: Still getting "invalid-api-key"
**Fix:** 
1. Stop your dev server (Ctrl+C)
2. Clear Next.js cache: Delete `.next` folder
3. Restart: `npm run dev`

### Error: Variables showing as undefined
**Fix:** Environment variables must start with `NEXT_PUBLIC_` to be accessible in the browser

## 📂 File Structure Check

Your project root should look like:
```
webuidraftjs_wdb/
├── .env.local ← CREATE THIS
├── .env.local.example ← Created by me
├── .env.template ← Template reference
├── firebase.js ← Existing config (works)
├── lib/
│   └── firebase.js ← Needs env vars
├── package.json
└── ...
```

## ⚡ PowerShell Commands

```powershell
# Navigate to your project
cd "C:\Users\JM Salonga\FILES_JM\admincaps\ReportIt-Web\webuidraftjs_wdb"

# Copy example to actual env file
Copy-Item .env.local.example .env.local

# Verify file was created
Get-Item .env.local

# Restart dev server
npm run dev
```

---

**That's it!** Your Firebase error should be fixed! 🎉
