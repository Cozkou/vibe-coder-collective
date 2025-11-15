import WorkspaceSidebar from "@/components/WorkspaceSidebar";
import StackBlitzPreview from "@/components/StackBlitzPreview";
import FileView from "@/components/FileView";
import CodeViewer from "@/components/CodeViewer";
import FloatingInput from "@/components/FloatingInput";
import ShareCodeModal from "@/components/ShareCodeModal";
import TutorialOverlay from "@/components/TutorialOverlay";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, Bell, Copy } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAIAgent } from "@/hooks/useAIAgent";

const Workspace = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [currentFeature, setCurrentFeature] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [featureClicked, setFeatureClicked] = useState(false);
  const [isSwitchingTabs, setIsSwitchingTabs] = useState(false);
  const { toast } = useToast();

  // Initialize AI Agent (watches for new prompts automatically)
  const { isProcessing, hasApiKey } = useAIAgent(sessionId);

  // Handle tab switching with loading state
  const handleViewModeChange = (mode: "preview" | "code") => {
    if (mode === viewMode) return;
    
    setIsSwitchingTabs(true);
    setTimeout(() => {
      setViewMode(mode);
      setIsSwitchingTabs(false);
    }, 200); // Brief loading state for smooth transition
  };

  // Debug logging (only once on mount)
  useEffect(() => {
    console.log('Workspace loaded. Session ID from URL:', sessionId);
    console.log('Current URL:', window.location.href);
    console.log('AI Agent Status:', { isProcessing, hasApiKey });
  }, [sessionId]); // Only log when sessionId changes, not on every render

  const handleCopyCode = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      toast({
        title: "Code copied!",
        description: "Session code copied to clipboard"
      });
    }
  };

  const handleFeatureClick = (feature: string) => {
    setCurrentFeature(feature);
    setFeatureClicked(true);
  };

  const handleClearFeature = () => {
    setCurrentFeature(undefined);
  };

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
              HomerIDE
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded border border-border">
              <span className="text-xs font-mono font-semibold text-foreground">{sessionId}</span>
              <Button variant="ghost" size="icon" onClick={handleCopyCode} className="h-5 w-5">
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Bell className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main workspace */}
      <div className="h-[calc(100vh-57px)] overflow-hidden flex relative">
        {/* Left Sidebar */}
        <WorkspaceSidebar onFeatureClick={handleFeatureClick} />

        {/* Center - Preview/Code View */}
        <div className="flex-1">
          {sessionId ? (
            <Card className="h-full bg-background border-border flex flex-col">
              {/* Toggle Buttons */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <div className="flex items-center border border-border rounded overflow-hidden">
                  <Button
                    variant={viewMode === "code" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleViewModeChange("code")}
                    disabled={isSwitchingTabs}
                    className="h-6 rounded-none font-mono text-xs px-3"
                  >
                    Code
                  </Button>
                  <Button
                    variant={viewMode === "preview" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleViewModeChange("preview")}
                    disabled={isSwitchingTabs}
                    className="h-6 rounded-none font-mono text-xs px-3"
                  >
                    Preview
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden relative">
                {isSwitchingTabs ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
                    <div className="text-center space-y-3">
                      <div className="w-8 h-8 border-4 border-retro-amber/30 border-t-retro-amber rounded-full animate-spin mx-auto"></div>
                      <p className="text-xs text-muted-foreground font-mono">Loading...</p>
                    </div>
                  </div>
                ) : null}
                {viewMode === "preview" ? (
                  <StackBlitzPreview sessionId={sessionId} showEditor={false} />
                ) : (
                  <div className="flex h-full">
                    {/* File List - Left Side */}
                    <div className="w-64 border-r border-border">
                      <FileView 
                        sessionId={sessionId}
                        onFileClick={(fileId) => setSelectedFileId(fileId)}
                        selectedFileId={selectedFileId || undefined}
                      />
                    </div>
                    {/* Code Viewer - Right Side */}
                    <div className="flex-1">
                      <CodeViewer sessionId={sessionId} fileId={selectedFileId} />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-full bg-background">
              <p className="text-muted-foreground font-mono">No session ID</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Input */}
      <FloatingInput currentFeature={currentFeature} onClearFeature={handleClearFeature} />
      {sessionId && (
        <ShareCodeModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          sessionId={sessionId}
        />
      )}
      
      {/* Tutorial Overlay */}
      <TutorialOverlay sessionId={sessionId} onFeatureClicked={featureClicked} />
    </div>
  );
};

export default Workspace;
