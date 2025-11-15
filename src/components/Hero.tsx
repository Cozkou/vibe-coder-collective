import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Mic, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import TeamSetupModal from "./TeamSetupModal";
import homerImage from "@/assets/homer.png";
import { doc, setDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';

const Hero = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleSubmit = async () => {
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

      // Seed initial React files
      console.log('About to seed files for session:', newSessionId);
      await seedReactFiles(newSessionId);
      console.log('Files seeded successfully!');

      setSessionId(newSessionId);
      setModalOpen(true);
      
      toast({
        title: "Session created!",
        description: "Setting up your workspace...",
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

  const seedReactFiles = async (sessionId: string) => {
    try {
      console.log('Creating files in Firestore for session:', sessionId);
      const filesRef = collection(db, 'sessions', sessionId, 'files');
      
      const initialFiles = [
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
      <header className="App-header">
        <h1>🎨 Welcome to VibeCode!</h1>
        <p>Your AI-powered collaborative coding workspace</p>
        <p className="hint">AI will generate and update code here based on your prompts</p>
      </header>
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
  text-align: center;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.App-header {
  background-color: rgba(255, 255, 255, 0.95);
  padding: 3rem;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 600px;
}

h1 {
  color: #FF6B35;
  margin-bottom: 1rem;
  font-size: 2.5rem;
}

p {
  color: #333;
  font-size: 1.2rem;
  margin: 0.5rem 0;
}

.hint {
  color: #666;
  font-size: 0.9rem;
  font-style: italic;
  margin-top: 1.5rem;
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
        content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
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
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="VibeCode - AI Collaborative Coding" />
    <title>VibeCode App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`,
        updatedAt: Timestamp.now()
      }
    ];

      for (const file of initialFiles) {
        console.log('Adding file:', file.path);
        await addDoc(filesRef, file);
      }
      console.log('All files added successfully!');
    } catch (error) {
      console.error('Error seeding files:', error);
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
              <div className="space-y-4">
                <Textarea
                  placeholder="Describe what you want to build..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[80px] bg-background border-border resize-none font-mono text-sm"
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-foreground"
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-foreground"
                    >
                      <Mic className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    className="bg-retro-amber text-background hover:bg-retro-amber/90 font-mono h-9 px-4 gap-2"
                    onClick={handleSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating..." : "Start Building"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
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