import WorkspaceSidebar from "@/components/WorkspaceSidebar";
import SandboxPreview from "@/components/SandboxPreview";
import ChatBot from "@/components/ChatBot";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Workspace = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cosmic-purple/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cosmic-cyan/10 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-sm bg-background/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/")}
            >
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cosmic-purple to-cosmic-cyan bg-clip-text text-transparent">
              VibeCode
            </h1>
          </div>
        </div>
      </header>

      {/* Main workspace */}
      <div className="relative z-10 h-[calc(100vh-73px)] overflow-hidden">
        <div className="h-full grid grid-cols-[320px_1fr_380px] gap-4 p-4">
          {/* Left Sidebar */}
          <WorkspaceSidebar />
          
          {/* Center - Sandbox Preview */}
          <SandboxPreview />
          
          {/* Right - Chatbot */}
          <ChatBot />
        </div>
      </div>
    </div>
  );
};

export default Workspace;
