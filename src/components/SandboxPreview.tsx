import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileCode } from "lucide-react";

interface SandboxPreviewProps {
  viewMode: "preview" | "code";
  onViewModeChange: (mode: "preview" | "code") => void;
}

const SandboxPreview = ({ viewMode, onViewModeChange }: SandboxPreviewProps) => {
  return (
    <Card className="h-full bg-background border-border flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center border border-border rounded overflow-hidden">
          <Button
            variant={viewMode === "code" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("code")}
            className="h-6 rounded-none font-mono text-xs px-3"
          >
            Code
          </Button>
          <Button
            variant={viewMode === "preview" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("preview")}
            className="h-6 rounded-none font-mono text-xs px-3"
          >
            Preview
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {viewMode === "preview" ? (
          <div className="w-full h-full bg-white">
            <iframe
              src="/"
              className="w-full h-full"
              title="Preview"
            />
          </div>
        ) : (
          <div className="w-full h-full bg-background p-4 overflow-auto">
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center space-y-2">
                <FileCode className="w-12 h-12 mx-auto text-retro-amber" />
                <p className="font-mono text-sm">Code editor coming soon</p>
                <p className="font-mono text-xs text-muted-foreground">
                  This will show the project files and code
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SandboxPreview;