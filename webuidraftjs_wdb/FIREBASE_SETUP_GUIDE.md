# Firebase Configuration Fix Guide

## 🔴 Error: Firebase: Error (auth/invalid-api-key)

This error occurs because Firebase can't authenticate with the provided API key.

## 📋 Your Current Setup

You have **two** Firebase configuration files:
1. ✅ `firebase.js` (root) - Has hardcoded keys (WORKING)
2. ⚠️ `lib/firebase.js` - Uses environment variables (NOT SET - causing error)

## 🔧 Quick Fix Options

### Option 1: Use Environment Variables (RECOMMENDED for Production)

#### Step 1: Get Your Firebase Configuration

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com
   - Sign in with your Google account

2. **Select Your Project**
   - Click on your project: **"admin-76567"**
   
3. **Get Your Config Keys**
   - Click the **gear icon** ⚙️ (Settings) next to "Project Overview"
   - Select **"Project settings"**
   - Scroll down to **"Your apps"** section
   - If you see a web app, click on it
   - If not, click **"Add app"** → Select **Web (</> icon)**
   - Give it a nickname (e.g., "ReportIt Admin")
   - Click **"Register app"**

4. **Copy the Firebase Config**
   You'll see something like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123",
     measurementId: "G-ABC123" // Optional
   };
   ```

#### Step 2: Create `.env.local` File

Create a file named `.env.local` in your project root:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

#### Step 3: Update `lib/firebase.js`

Update the file to include all necessary services:

```javascript
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);
```

#### Step 4: Restart Your Dev Server

```bash
# Stop your current server (Ctrl+C)
# Then restart:
npm run dev
# or
pnpm dev
```

### Option 2: Delete Duplicate File (QUICK FIX)

If you want a quick fix for development:

1. **Delete or rename** `lib/firebase.js`
2. **Update imports** to use `firebase.js` instead

This will use the hardcoded configuration that's already working.

## 🔍 Where to Find Each Firebase Key

| Key | Where to Find It |
|-----|------------------|
| **apiKey** | Project Settings → Your apps → Config |
| **authDomain** | Project Settings → Your apps → Config |
| **databaseURL** | Realtime Database → Data tab → URL at top |
| **projectId** | Project Settings → General → Project ID |
| **storageBucket** | Storage → Copy the URL without gs:// |
| **messagingSenderId** | Project Settings → Cloud Messaging |
| **appId** | Project Settings → Your apps → App ID |

## 📸 Visual Guide to Get Firebase Keys

### Step-by-Step Screenshots Path:

1. **Firebase Console** → https://console.firebase.google.com
2. **Click your project** → "admin-76567"
3. **Click gear icon** ⚙️ → "Project settings"
4. **Scroll to "Your apps"** section
5. **Click on your web app** (or add one if none exists)
6. **Copy all the config values**

### Alternative: Using Firebase CLI

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# List your projects
firebase projects:list

# Get project info
firebase apps:sdkconfig web
```

## 🚀 For Deployment (Vercel/Netlify)

Add these environment variables in your deployment platform:

**Vercel:**
1. Project Settings → Environment Variables
2. Add all `NEXT_PUBLIC_FIREBASE_*` variables
3. Redeploy

**Netlify:**
1. Site settings → Build & deploy → Environment
2. Add all variables
3. Trigger new deploy

## ✅ Verification Checklist

After setting up:
- [ ] Created `.env.local` file
- [ ] Copied all Firebase keys to `.env.local`
- [ ] Restarted dev server
- [ ] No more "invalid-api-key" error
- [ ] Can login/authenticate
- [ ] Firebase services working

## 🔒 Security Best Practices

✅ **DO:**
- Use environment variables for all keys
- Add `.env.local` to `.gitignore` (already done ✓)
- Use different Firebase projects for dev/prod
- Enable App Check in production

❌ **DON'T:**
- Commit API keys to git
- Share keys publicly
- Use production keys in development
- Hardcode keys in code files

## 🆘 Troubleshooting

### Error: "Firebase: Error (auth/invalid-api-key)"
**Cause:** Wrong API key or not set
**Fix:** Double-check API key in Firebase Console matches `.env.local`

### Error: Environment variables undefined
**Cause:** Forgot to restart server
**Fix:** Stop server (Ctrl+C) and run `npm run dev` again

### Error: "Firebase app named '[DEFAULT]' already exists"
**Cause:** Firebase initialized multiple times
**Fix:** Already handled with `!getApps().length` check

## 📞 Quick Support

If still having issues:
1. Check Firebase Console → Project Settings
2. Verify your Firebase project is active
3. Check Firebase billing (some features require Blaze plan)
4. Verify API key restrictions in Google Cloud Console

---

## TL;DR - Fastest Fix

1. Go to: https://console.firebase.google.com
2. Select project → Settings ⚙️ → Project settings
3. Scroll to "Your apps" → Copy config
4. Create `.env.local` with those values
5. Restart dev server
6. Done! ✅
