# 👥 Multi-User Collaboration Setup

## How Multiple Users Join & Collaborate

This document explains how multiple people can work together in the same HomerIDE session.

---

## 🎯 How It Works

### **Simple Concept:**
```
User 1 opens: http://localhost:8084/workspace/abc-123
User 2 opens: http://localhost:8084/workspace/abc-123  (SAME URL!)
User 3 opens: http://localhost:8084/workspace/abc-123  (SAME URL!)
                           ↓
            All see each other in real-time!
```

**That's it!** Same session ID = same collaborative workspace.

---

## 📊 Firestore Structure for Multi-User

```javascript
sessions/
  {sessionId}/               // The shared workspace
    - initialPrompt
    - projectSpec
    - features
    
    presence/                // WHO IS ONLINE
      {userId1}/
        - id: "user-123"
        - userName: "Cool Coder"     // Auto-generated
        - color: "#3B82F6"            // Auto-generated
        - joinedAt: timestamp
        - lastSeen: timestamp         // Updated every 5 seconds
        - currentPrompt: "Add button" // What they're working on
      
      {userId2}/
        - id: "user-456"
        - userName: "Swift Builder"
        - color: "#EF4444"
        - ...
    
    prompts/                 // WHAT EVERYONE IS DOING
      {promptId1}/
        - content: "Add login form"
        - userId: "user-123"          // WHO sent it
        - status: "processing"
        - createdAt: timestamp
      
      {promptId2}/
        - content: "Style the header"
        - userId: "user-456"          // Different user!
        - status: "completed"
        - createdAt: timestamp
    
    files/                   // SHARED CODE
      {fileId}/
        - path: "src/App.tsx"
        - content: "..."              // Everyone sees the same code
        - updatedAt: timestamp
        - updatedBy: "user-123"       // WHO last edited
```

---

## 🚀 What Happens When User Joins

### **Step 1: User Opens Session URL**
```
http://localhost:8084/workspace/abc-123
```

### **Step 2: Auto-Generated User Identity**
```typescript
// On first visit, creates:
userId: crypto.randomUUID()          // "user-123-abc..."
userName: "Cool Coder"               // Random fun name
userColor: "#3B82F6"                 // Random color

// Saved in sessionStorage (persists during browser session)
```

### **Step 3: Register Presence in Firestore**
```javascript
sessions/abc-123/presence/user-123 ← Created!
{
  id: "user-123",
  userName: "Cool Coder",
  color: "#3B82F6",
  joinedAt: now,
  lastSeen: now,
  currentPrompt: null
}
```

### **Step 4: Heartbeat (Stays Active)**
```
Every 5 seconds:
  Update lastSeen: now

If lastSeen > 15 seconds ago:
  Consider user offline
  Remove from active users list
```

### **Step 5: User Types Prompt**
```javascript
sessions/abc-123/prompts/{promptId} ← Created!
{
  content: "Add a blue button",
  userId: "user-123",  ← Links to this user!
  status: "pending",
  createdAt: now
}
```

### **Step 6: All Users See It Real-Time**
```
QueueView watches: sessions/abc-123/prompts
  ↓
Detects new prompt
  ↓
Shows avatar of user-123 next to prompt
  ↓
"Cool Coder: Add a blue button"
```

---

## 👁️ What Users See

### **Queue View Header:**
```
┌────────────────────────────────────┐
│ PROMPT QUEUE    👥 3               │
│                                    │
│  [CC] [SB] [BN]  ← User avatars   │
│   ↑    ↑    ↑                      │
│  User1 User2 User3                 │
└────────────────────────────────────┘

Hover over avatar:
  "Cool Coder"
  "Working on: Add blue button"
```

### **Prompt List:**
```
┌────────────────────────────────────┐
│ [CC] Add a blue button     [done]  │
│      5 min ago                     │
│                                    │
│ [SB] Style the header   [processing]│
│      Just now                      │
│                                    │
│ [BN] Fix the navbar        [pending]│
│      2 min ago                     │
└────────────────────────────────────┘

Each prompt shows WHO sent it!
```

---

## 🔄 Real-Time Updates

### **Everyone Sees Everything Instantly:**

```
User 1 types prompt
    ↓
Firestore (real-time)
    ↓
User 2's screen updates (QueueView)
User 3's screen updates (QueueView)
```

```
Agent updates code
    ↓
Firestore (files collection)
    ↓
User 1's StackBlitz reloads
User 2's StackBlitz reloads
User 3's StackBlitz reloads
```

```
User 2 clicks feature
    ↓
Updates their presence.currentPrompt
    ↓
User 1 sees: "Swift Builder is working on: User Authentication"
User 3 sees: "Swift Builder is working on: User Authentication"
```

---

## 💬 How Agents Handle Multiple Users

### **Scenario: 2 Users Send Prompts at Same Time**

```
User 1: "Add login form"     (09:00:00)
User 2: "Add logout button"  (09:00:01)
        ↓
    Firestore
        ↓
Agent sees 2 prompts:
1. promptId1 (status: pending, userId: user1)
2. promptId2 (status: pending, userId: user2)
        ↓
Agent processes ONE AT A TIME:
        ↓
Process prompt1:
  - status → "processing"
  - Generate code
  - Update files
  - status → "completed"
        ↓
Process prompt2:
  - status → "processing"
  - Read UPDATED files (includes changes from prompt1!)
  - Generate MORE code
  - Merge/update files
  - status → "completed"
```

**Key:** Agent always reads the **current state** before generating, so changes are additive!

---

## 🔐 User Identity Persistence

### **Session Storage (Browser-Level)**
```javascript
// User closes tab → Identity lost
// User refreshes → Identity PERSISTS ✓
// User opens new tab → NEW identity

sessionStorage:
  userId: "user-123"
  userName: "Cool Coder"
  userColor: "#3B82F6"
```

### **Why Not Accounts/Login?**
For hackathon speed:
- ✅ No auth flow needed
- ✅ Works immediately
- ✅ Anonymous collaboration
- ✅ No signup friction

For production, you'd add:
- Real user accounts
- Persistent identity across devices
- User avatars/photos
- Session history

---

## 🧪 Testing Multi-User Locally

### **Option 1: Multiple Browser Windows**
```
1. Chrome Window 1 → http://localhost:8084/workspace/test-123
2. Chrome Window 2 → http://localhost:8084/workspace/test-123
3. See both users in QueueView!
```

### **Option 2: Different Browsers**
```
1. Chrome → http://localhost:8084/workspace/test-123
2. Firefox → http://localhost:8084/workspace/test-123
3. Safari → http://localhost:8084/workspace/test-123
```

### **Option 3: Incognito Modes**
```
1. Regular window
2. Incognito window 1
3. Incognito window 2
(Each has separate sessionStorage = different user!)
```

---

## 📱 How to Share Session with Others

### **Option 1: Copy Session ID**
```
User 1 creates session → gets ID: abc-123
User 1 shares with team:
  "Join me: http://localhost:8084/workspace/abc-123"
```

### **Option 2: Copy Code Button** (Already Implemented!)
```
Header shows: [abc-123] [📋]
Click 📋 → Copies "abc-123"
Share code with team
They enter code → Join session
```

### **Option 3: QR Code** (Future Feature)
```
Generate QR code with session URL
Team scans → Instant join
```

---

## 🎨 User Display Features

### **Implemented:**
- ✅ Avatar with random color per user
- ✅ Auto-generated fun usernames
- ✅ User count display
- ✅ Tooltip showing username on hover
- ✅ Shows what each user is working on
- ✅ User avatars next to their prompts
- ✅ Active user detection (heartbeat)

### **Can Add Later:**
- User cursors (see where others are clicking)
- Typing indicators
- User roles (admin, editor, viewer)
- Chat messages
- Emoji reactions to prompts
- User presence in other components

---

## 💾 Firestore Rules for Multi-User

### **Current (Hackathon):**
```javascript
// Allow anyone to read/write
allow read, write: if true;
```

### **Production:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sessions/{sessionId} {
      // Anyone can read session
      allow read: if true;
      
      // Only creator can update session metadata
      allow update: if request.auth.uid == resource.data.createdBy;
      
      match /presence/{userId} {
        // Users can only update their own presence
        allow write: if request.auth.uid == userId;
        allow read: if true;
      }
      
      match /prompts/{promptId} {
        // Anyone in session can add prompts
        allow create: if true;
        // Only agents can update status
        allow update: if request.auth.token.isAgent == true;
        allow read: if true;
      }
      
      match /files/{fileId} {
        // Only agents can modify files
        allow write: if request.auth.token.isAgent == true;
        allow read: if true;
      }
    }
  }
}
```

---

## 🔄 Data Flow Summary

```
┌─────────┐                    ┌──────────────┐                    ┌─────────┐
│ User 1  │ ─────────────────► │   FIRESTORE  │ ◄───────────────── │ User 2  │
│         │                    │              │                    │         │
│ Types   │   Writes prompt    │  presence/   │   Reads prompt    │ Sees it │
│ prompt  │                    │  prompts/    │                    │ appear  │
└─────────┘                    │  files/      │                    └─────────┘
                               └──────┬───────┘
                                      │
                                      ↓
                               ┌──────────────┐
                               │  AI AGENT    │
                               │              │
                               │ Processes    │
                               │ Updates code │
                               └──────┬───────┘
                                      │
                   ┌──────────────────┴──────────────────┐
                   ↓                                     ↓
            ┌─────────┐                           ┌─────────┐
            │ User 1  │                           │ User 2  │
            │         │                           │         │
            │ Preview │                           │ Preview │
            │ Updates │                           │ Updates │
            └─────────┘                           └─────────┘
```

**Everything syncs in real-time!** 🎉

---

## 🎯 Summary

### **For Multi-User to Work:**
1. ✅ **Same session URL** - All users visit same workspace/{sessionId}
2. ✅ **User presence tracking** - Firestore presence/{userId} with heartbeat
3. ✅ **Prompt attribution** - Each prompt stores userId
4. ✅ **Real-time listeners** - UI watches Firestore for changes
5. ✅ **Agent processes sequentially** - One prompt at a time, always reads latest state

### **What Users See:**
- List of active collaborators (avatars with colors)
- Who sent each prompt (avatar next to message)
- What each person is working on (tooltip hover)
- Real-time code updates (StackBlitz auto-reloads)
- Shared prompt queue (everyone sees all prompts)

### **Agent Behavior:**
- Processes prompts in order
- Always reads current state first
- Merges changes naturally (reads latest, generates more)
- Updates Firestore → all users see results

**It's all real-time collaboration through Firestore! 🔥**

