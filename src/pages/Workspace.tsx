import WorkspaceSidebar from "@/components/WorkspaceSidebar";
import SandboxPreview from "@/components/SandboxPreview";
import ChatBot from "@/components/ChatBot";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

const Workspace = () => {
  const navigate = useNavigate();

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
        </div>
      </header>

      {/* Main workspace */}
      <div className="h-[calc(100vh-57px)] overflow-hidden flex">
        {/* Left Sidebar */}
        <WorkspaceSidebar />

        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Center - Sandbox Preview */}
          <ResizablePanel defaultSize={70} minSize={30}>
            <SandboxPreview />
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
