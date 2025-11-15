import WorkspaceSidebar from "@/components/WorkspaceSidebar";
import SandboxPreview from "@/components/SandboxPreview";
import FloatingInput from "@/components/FloatingInput";
import ShareCodeModal from "@/components/ShareCodeModal";
import { Button } from "@/components/ui/button";
import { Home, Bell, Copy } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Workspace = () => {
  const navigate = useNavigate();
  const { id: sessionId } = useParams();
  const [viewMode, setViewMode] = useState<"preview" | "code" | "document">("preview");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [currentFeature, setCurrentFeature] = useState<string | undefined>();
  const { toast } = useToast();

  const handleCopyCode = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      toast({
        title: "Code copied!",
        description: "Session code copied to clipboard",
      });
    }
  };

  const handleFeatureClick = (feature: string) => {
    setCurrentFeature(feature);
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
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyCode}
                className="h-5 w-5"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
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
        {/* Left Sidebar */}
        <WorkspaceSidebar onFeatureClick={handleFeatureClick} />

        {/* Center - Sandbox Preview */}
        <div className="flex-1">
          <SandboxPreview viewMode={viewMode} onViewModeChange={setViewMode} />
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
    </div>
  );
};

export default Workspace;
