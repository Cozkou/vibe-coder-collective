import WorkspaceSidebar from "@/components/WorkspaceSidebar";
import SandboxPreview from "@/components/SandboxPreview";
import ChatBot from "@/components/ChatBot";
import { Button } from "@/components/ui/button";
import { Home, Focus, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

const Workspace = () => {
  const navigate = useNavigate();
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");

  const handleOpenPreview = () => {
    window.open(window.location.origin, "_blank");
  };

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/")}
              className="h-8 w-8"
            >
              <Home className="w-4 h-4" />
            </Button>
            <h1 className="text-lg font-mono font-bold text-retro-amber">
              VibeCode
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={isFocusMode ? "default" : "ghost"}
              size="sm"
              onClick={() => setIsFocusMode(!isFocusMode)}
              className="h-8 gap-2 font-mono text-xs"
            >
              <Focus className="w-3 h-3" />
              Adaptive Focus Mode
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <Bell className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main workspace */}
      <div className="h-[calc(100vh-57px)] overflow-hidden flex relative">
        {/* Dimming overlay for focus mode */}
        {isFocusMode && (
          <div className="absolute inset-0 bg-background/80 z-10 pointer-events-none" />
        )}
        
        {/* Left Sidebar - hidden in focus mode */}
        {!isFocusMode && <WorkspaceSidebar />}

        <ResizablePanelGroup direction="horizontal" className={`flex-1 ${isFocusMode ? 'relative z-20' : ''}`}>
          {/* Center - Sandbox Preview */}
          <ResizablePanel defaultSize={70} minSize={30}>
            <SandboxPreview viewMode={viewMode} onViewModeChange={setViewMode} />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Right - Chatbot */}
          <ResizablePanel defaultSize={30} minSize={15} maxSize={40}>
            <ChatBot />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default Workspace;
