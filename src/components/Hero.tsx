import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Paperclip, Mic, ArrowRight, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import TeamSetupModal from "./TeamSetupModal";
import homerImage from "@/assets/homer.png";
import { doc, setDoc, collection, addDoc, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';

const Hero = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [prompt, setPrompt] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleCreateSession = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Generate a UUID for anonymous user and session
      const anonymousId = crypto.randomUUID();
      const newSessionId = crypto.randomUUID();
      
      // Create session in Firestore
      const sessionRef = doc(db, 'sessions', newSessionId);
      await setDoc(sessionRef, {
        createdBy: anonymousId,
        initialPrompt: prompt,
        teamSize: 1,
        createdAt: Timestamp.now(),
        projectSpec: '',
        features: [],
        currentFeature: null
      });

      // Seed minimal starter files (loading state)
      console.log('Seeding minimal starter files for session:', newSessionId);
      await seedMinimalFiles(newSessionId);
      console.log('Starter files seeded!');

      // Add initial prompt to prompts collection for AI agent to process
      console.log('Adding initial prompt to queue for AI generation');
      const promptsRef = collection(db, 'sessions', newSessionId, 'prompts');
      await addDoc(promptsRef, {
        content: `Create a React application based on this description: ${prompt}`,
        status: 'pending',
        userId: anonymousId,
        createdAt: Timestamp.now(),
        completedAt: null
      });
      console.log('Initial prompt added - AI agent will generate the code!');

      setSessionId(newSessionId);
      setModalOpen(true);
      
      toast({
        title: "Session created!",
        description: "AI is generating your code...",
      });
    } catch (error) {
      console.error("Error creating session:", error);
      toast({
        title: "Failed to create session",
        description: "Please check your Firebase configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!joinCode.trim()) {
      toast({
        title: "Please enter a session code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Check if session exists in Firestore
      const sessionRef = doc(db, 'sessions', joinCode.trim());
      const sessionSnap = await getDoc(sessionRef);

      if (!sessionSnap.exists()) {
        toast({
          title: "Session not found",
          description: "Please check the session code and try again",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Session exists, navigate directly
      toast({
        title: "Joining session...",
        description: "Loading workspace...",
      });
      
      navigate(`/workspace/${joinCode.trim()}`);
    } catch (error) {
      console.error("Error joining session:", error);
      toast({
        title: "Failed to join session",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const seedMinimalFiles = async (sessionId: string) => {
    try {
      console.log('Creating minimal starter files for session:', sessionId);
      const filesRef = collection(db, 'sessions', sessionId, 'files');
      
      // Just create a minimal loading state - AI will generate the real code
      const minimalFiles = [
      {
        path: 'src/App.tsx',
        name: 'App.tsx',
        type: 'file',
        language: 'typescript',
        content: `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <div className="loading">
        <h1>🤖 AI is generating your code...</h1>
        <p>Please wait while we create your application</p>
        <div className="spinner"></div>
      </div>
    </div>
  );
}

export default App;`,
        updatedAt: Timestamp.now()
      },
      {
        path: 'src/App.css',
        name: 'App.css',
        type: 'file',
        language: 'css',
        content: `.App {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0a;
  font-family: 'Courier New', monospace;
}

.loading {
  text-align: center;
  background: #1a1a1a;
  padding: 3rem;
  border-radius: 8px;
  border: 2px solid #FFD700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
  max-width: 500px;
}

.loading h1 {
  color: #FFD700;
  margin-bottom: 1rem;
  font-family: 'Courier New', monospace;
  font-size: 1.5rem;
}

.loading p {
  color: #888;
  margin-bottom: 2rem;
  font-size: 0.9rem;
}

.spinner {
  border: 4px solid #333;
  border-top: 4px solid #FFD700;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`,
        updatedAt: Timestamp.now()
      },
      {
        path: 'src/index.tsx',
        name: 'index.tsx',
        type: 'file',
        language: 'typescript',
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
        updatedAt: Timestamp.now()
      },
      {
        path: 'src/index.css',
        name: 'index.css',
        type: 'file',
        language: 'css',
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

* {
  box-sizing: border-box;
}`,
        updatedAt: Timestamp.now()
      },
      {
        path: 'package.json',
        name: 'package.json',
        type: 'file',
        language: 'json',
        content: `{
  "name": "ai-generated-app",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}`,
        updatedAt: Timestamp.now()
      },
      {
        path: 'tailwind.config.js',
        name: 'tailwind.config.js',
        type: 'file',
        language: 'javascript',
        content: `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
        updatedAt: Timestamp.now()
      },
      {
        path: 'postcss.config.js',
        name: 'postcss.config.js',
        type: 'file',
        language: 'javascript',
        content: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
        updatedAt: Timestamp.now()
      },
      {
        path: 'public/index.html',
        name: 'index.html',
        type: 'file',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>HomerIDE - AI Generated App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
        updatedAt: Timestamp.now()
      }
    ];

      for (const file of minimalFiles) {
        console.log('Adding file:', file.path);
        await addDoc(filesRef, file);
      }
      console.log('Minimal files added - AI will generate real code!');
    } catch (error) {
      console.error('Error seeding minimal files:', error);
      throw error;
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    if (sessionId) {
      console.log('Navigating to workspace with session ID:', sessionId);
      navigate(`/workspace/${sessionId}`);
    }
  };

  return (
    <div className="relative h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Grid Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle, hsl(45 100% 55%) 2px, transparent 2px),
            linear-gradient(to right, hsl(45 100% 55% / 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(45 100% 55% / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          backgroundPosition: '0 0'
        }}
      />
      
      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4 mb-4 -mt-12">
            <h1 className="text-5xl md:text-6xl font-mono font-bold text-retro-amber">
              HomerIDE
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-mono">
              Collaborative Vibe Coding - Made Possible
            </p>
          </div>

          {/* Centered Layout with Image and Form */}
          <div className="relative flex items-center justify-center">
            {/* Homer Image - Background */}
            <div className="absolute -top-8">
              <img 
                src={homerImage} 
                alt="Homer Simpson" 
                className="w-96 object-contain scale-x-[-1] opacity-60"
              />
            </div>

            {/* Prompt Input - Foreground */}
            <Card className="relative z-10 p-6 bg-card/95 backdrop-blur-sm border-border w-full max-w-2xl mt-64">
              {/* Mode Toggle */}
              <div className="flex gap-2 mb-4 border-b border-border pb-2">
                <Button
                  variant={mode === "create" ? "default" : "ghost"}
                  size="sm"
                  className={mode === "create" ? "bg-retro-amber text-background hover:bg-retro-amber/90 font-mono" : "font-mono"}
                  onClick={() => setMode("create")}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Create New
                </Button>
                <Button
                  variant={mode === "join" ? "default" : "ghost"}
                  size="sm"
                  className={mode === "join" ? "bg-retro-amber text-background hover:bg-retro-amber/90 font-mono" : "font-mono"}
                  onClick={() => setMode("join")}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Join Existing
                </Button>
              </div>

              {/* Create Mode */}
              {mode === "create" && (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateSession();
                  }}
                  className="space-y-4"
                >
                  <Textarea
                    placeholder="Describe what you want to build..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      // Prevent Enter from submitting, allow Shift+Enter for new line
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleCreateSession();
                      }
                    }}
                    className="min-h-[80px] bg-background border-border resize-none font-mono text-sm"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-foreground"
                      >
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-foreground"
                      >
                        <Mic className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-retro-amber text-background hover:bg-retro-amber/90 font-mono h-9 px-4 gap-2"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating..." : "Start Building"}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              )}

              {/* Join Mode */}
              {mode === "join" && (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleJoinSession();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-mono text-muted-foreground">
                      Enter Session Code
                    </label>
                    <Input
                      placeholder="e.g., 6ee61acf-a17b-453b-8fc0-5913309d3aed"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      onKeyDown={(e) => {
                        // Submit on Enter
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleJoinSession();
                        }
                      }}
                      className="bg-background border-border font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground font-mono">
                      Get the session code from your teammate or the "Copy Session Code" button
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-retro-amber text-background hover:bg-retro-amber/90 font-mono h-9 px-4 gap-2"
                      disabled={isLoading}
                    >
                      {isLoading ? "Joining..." : "Join Session"}
                      <Users className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-0 left-0 right-0 pb-8 text-center">
        <p className="text-sm text-muted-foreground font-mono">
          WLDN x Builder's Brew | HomerIDE 2025 <span className="text-base">©</span>
        </p>
      </div>

      {sessionId && (
        <TeamSetupModal
          open={modalOpen}
          onClose={handleModalClose}
          sessionId={sessionId}
        />
      )}
    </div>
  );
};

export default Hero;