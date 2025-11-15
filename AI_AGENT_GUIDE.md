# 🤖 AI Agent Integration Guide

## How to Connect Your AI Agent to VibeCode

Your AI agent needs to **read and write files to Firestore**. StackBlitz will automatically pick up changes and update the preview.

## 🔄 The Flow

```
User sends prompt → Firestore (prompts collection)
                           ↓
                    AI Agent watches
                           ↓
                    Reads current files from Firestore
                           ↓
                    Calls OpenAI/Claude API
                           ↓
                    Writes updated files to Firestore
                           ↓
                    StackBlitz auto-updates
                           ↓
                    User sees changes!
```

## 💻 Quick Implementation (Frontend Agent)

Create `src/services/aiAgent.ts`:

```typescript
import { collection, addDoc, updateDoc, doc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';

export class AIAgent {
  sessionId: string;
  apiKey: string;
  
  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY; // or VITE_ANTHROPIC_API_KEY
  }

  // Read all current files from Firestore
  async getCurrentFiles() {
    const filesRef = collection(db, 'sessions', this.sessionId, 'files');
    const snapshot = await getDocs(filesRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  // Process a user prompt
  async processPrompt(promptId: string, promptContent: string) {
    try {
      // 1. Mark prompt as processing
      await this.updatePromptStatus(promptId, 'processing');

      // 2. Get current files
      const files = await this.getCurrentFiles();
      
      // 3. Build context for AI
      const filesContext = files.map(f => 
        `File: ${f.path}\n\`\`\`${f.language}\n${f.content}\n\`\`\``
      ).join('\n\n');

      // 4. Call AI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a React code generation assistant. You have access to the following files:

${filesContext}

Generate complete, working React TypeScript code. Return ONLY valid JSON in this exact format:
{
  "files": [
    {"path": "src/App.tsx", "content": "complete file content here", "language": "typescript"},
    {"path": "src/App.css", "content": "complete file content here", "language": "css"}
  ],
  "message": "Brief explanation of changes made"
}

IMPORTANT: Return ONLY the JSON, no markdown formatting, no extra text.`
            },
            {
              role: 'user',
              content: promptContent
            }
          ],
          temperature: 0.7
        })
      });

      const data = await response.json();
      const aiResponse = JSON.parse(data.choices[0].message.content);

      // 5. Update files in Firestore
      for (const file of aiResponse.files) {
        await this.updateOrCreateFile(file.path, file.content, file.language);
      }

      // 6. Add message to chat
      await this.addMessage('assistant', aiResponse.message);

      // 7. Mark prompt as completed
      await this.updatePromptStatus(promptId, 'completed');

      return aiResponse;
    } catch (error) {
      console.error('AI Agent error:', error);
      await this.updatePromptStatus(promptId, 'error');
      throw error;
    }
  }

  async updateOrCreateFile(path: string, content: string, language: string) {
    const filesRef = collection(db, 'sessions', this.sessionId, 'files');
    const q = query(filesRef, where('path', '==', path));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // Update existing file
      const fileDoc = snapshot.docs[0];
      await updateDoc(doc(db, 'sessions', this.sessionId, 'files', fileDoc.id), {
        content,
        updatedAt: Timestamp.now()
      });
    } else {
      // Create new file
      await addDoc(filesRef, {
        path,
        name: path.split('/').pop(),
        type: 'file',
        content,
        language,
        updatedAt: Timestamp.now()
      });
    }
  }

  async addMessage(role: 'user' | 'assistant', content: string) {
    const messagesRef = collection(db, 'sessions', this.sessionId, 'messages');
    await addDoc(messagesRef, {
      role,
      content,
      createdAt: Timestamp.now()
    });
  }

  async updatePromptStatus(promptId: string, status: 'pending' | 'processing' | 'completed' | 'error') {
    const promptRef = doc(db, 'sessions', this.sessionId, 'prompts', promptId);
    await updateDoc(promptRef, {
      status,
      ...(status === 'completed' ? { completedAt: Timestamp.now() } : {})
    });
  }
}
```

## 🔗 Hook It Up to FloatingInput

Update `src/components/FloatingInput.tsx`:

```typescript
import { AIAgent } from '@/services/aiAgent';
import { useFirestorePrompts } from '@/hooks/useFirestorePrompts';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

const FloatingInput = ({ currentFeature, onClearFeature }) => {
  const { id: sessionId } = useParams();
  const { addPrompt, prompts } = useFirestorePrompts(sessionId);
  const [isProcessing, setIsProcessing] = useState(false);

  // Watch for new prompts and process them
  useEffect(() => {
    if (!sessionId) return;
    
    const pendingPrompt = prompts.find(p => p.status === 'pending');
    
    if (pendingPrompt && !isProcessing) {
      setIsProcessing(true);
      
      const agent = new AIAgent(sessionId);
      agent.processPrompt(pendingPrompt.id, pendingPrompt.content)
        .then(() => {
          console.log('Prompt processed successfully');
          setIsProcessing(false);
        })
        .catch(err => {
          console.error('Agent error:', err);
          setIsProcessing(false);
        });
    }
  }, [prompts, sessionId, isProcessing]);

  const handleSend = async () => {
    if (message.trim()) {
      await addPrompt(message, 'user-' + Date.now());
      setMessage("");
    }
  };

  // ... rest of component
};
```

## 🔑 Add API Key to .env.local

```bash
# Add this to your .env.local
VITE_OPENAI_API_KEY=sk-...
# OR
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

## 🧪 Test It

1. Start your app: `npm run dev`
2. Create a session
3. In FloatingInput, type: "Add a blue button that says Click Me"
4. Press Enter
5. Watch the magic:
   - Prompt appears in QueueView with "processing" status
   - AI generates code
   - Files update in Firestore
   - StackBlitz preview auto-refreshes
   - Button appears!

## 🎯 Example Prompts to Test

- "Change the background to a sunset gradient"
- "Add a counter button that increments on click"
- "Create a todo list component"
- "Add a form with name and email inputs"
- "Make the heading bounce when you click it"

## 📊 Monitor in Real-Time

Open **2 browser tabs** to the same session URL. When one tab sends a prompt:
- Both tabs see the prompt appear in QueueView
- Both tabs see files update
- Both tabs see preview update

That's real-time collaboration! 🎉

## 🚀 Advanced: Backend Agent (Optional)

If you want to run the agent on a backend:

1. Use Firebase Admin SDK
2. Deploy as Supabase Edge Function or Vercel Function
3. Watch Firestore for new prompts
4. Process and update files
5. No CORS issues, more secure API keys

But for a 2-hour hackathon, the frontend approach above is MUCH faster!

