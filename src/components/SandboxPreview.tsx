import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import FileView from "./FileView";
import DocumentView from "./DocumentView";

interface SandboxPreviewProps {
  viewMode: "preview" | "code" | "document";
  onViewModeChange: (mode: "preview" | "code" | "document") => void;
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
            variant={viewMode === "document" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("document")}
            className="h-6 rounded-none font-mono text-xs px-3 gap-1"
          >
            <FileText className="w-3 h-3" />
            Doc
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
        ) : viewMode === "document" ? (
          <div className="w-full h-full bg-background overflow-hidden">
            <DocumentView />
          </div>
        ) : (
          <div className="w-full h-full bg-background overflow-hidden">
            <FileView />
          </div>
        )}
      </div>
    </Card>
  );
};

export default SandboxPreview;