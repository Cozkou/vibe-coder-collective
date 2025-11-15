# 🔥 Firebase + StackBlitz Setup Guide

## ✅ What's Already Done

The code is fully implemented and ready! You just need to configure Firebase.

## 📋 What You Need to Do

### 1. Create a Firebase Project (5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it "vibe-code-app" (or whatever you want)
4. Disable Google Analytics (not needed for hackathon)
5. Click "Create project"

### 2. Enable Firestore Database (2 minutes)

1. In Firebase Console, click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose **"Start in test mode"** (for hackathon - allows open read/write)
4. Select a location (choose closest to you)
5. Click "Enable"

### 3. Get Your Firebase Config (1 minute)

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps"
4. Click the **web icon** `</>`
5. Register app with nickname "vibe-code-web"
6. Copy the `firebaseConfig` values

### 4. Create `.env.local` File

Create a file at `/vibe-coder-collective/.env.local` with your Firebase config:

```bash
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 5. Update Firestore Security Rules (1 minute)

For the hackathon, we're using **open rules** (test mode). This is already set if you chose "test mode" above.

If you need to manually set it:

1. Go to Firestore Database
2. Click "Rules" tab
3. Paste this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

4. Click "Publish"

**⚠️ WARNING:** These rules allow anyone to read/write. Only use for development/hackathon!

### 6. Start Your App

```bash
cd vibe-coder-collective
npm run dev
```

## 🎉 How to Test

1. Open `http://localhost:5173`
2. Enter a prompt: "Create a todo app"
3. Click "Start Building"
4. Set team size and click "Start Collaborating"
5. You should see:
   - StackBlitz preview loads with "Welcome to VibeCode!"
   - Files appear in Firestore
   - Left sidebar shows the Document and Queue views

## 🔍 Verify It's Working

### Check Browser Console
You should see:
```
Initializing StackBlitz with files: [...]
StackBlitz VM ready
```

### Check Firestore
1. Go to Firebase Console > Firestore Database
2. You should see:
   - `sessions/{sessionId}` document
   - `sessions/{sessionId}/files` subcollection with 5 files

### Check StackBlitz
The preview should show a gradient background with "Welcome to VibeCode!"

## 🐛 Troubleshooting

### "Firebase: No Firebase App '[DEFAULT]' has been created"
- You forgot to create `.env.local` file
- Or the environment variables are incorrect

### "Missing or insufficient permissions"
- Your Firestore rules are too restrictive
- Set rules to test mode (see step 5)

### StackBlitz doesn't load
- Check browser console for errors
- Make sure files were created in Firestore
- Try refreshing the page

### "Waiting for files from Firestore..."
- Files weren't seeded properly
- Check Firebase Console to see if files collection exists
- Try creating a new session

## 📁 What Data is Stored

```
Firestore Structure:
sessions/
  {sessionId}/
    - createdBy: string
    - initialPrompt: string
    - teamSize: number
    - createdAt: timestamp
    
    files/ (subcollection)
      {fileId}/
        - path: "src/App.tsx"
        - name: "App.tsx"
        - type: "file"
        - content: "..." (the actual code)
        - language: "typescript"
        - updatedAt: timestamp
```

## 🚀 Next Steps

Now you can:
1. Build the AI agent that reads/writes to Firestore
2. Add more components to update the code
3. Test real-time collaboration by opening multiple browser tabs

All tabs will see the same StackBlitz preview because they're all reading from the same Firestore session!

