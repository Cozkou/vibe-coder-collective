import { FileCode, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkspaceSidebarProps {
  viewMode: "preview" | "code";
  onViewModeChange: (mode: "preview" | "code") => void;
}

const WorkspaceSidebar = ({ viewMode, onViewModeChange }: WorkspaceSidebarProps) => {
  return (
    <div className="h-full bg-background border-r border-border w-16 flex flex-col gap-1 p-2">
      <button
        onClick={() => onViewModeChange("code")}
        className={cn(
          "w-12 h-12 rounded flex items-center justify-center transition-colors",
          viewMode === "code"
            ? "bg-retro-amber/20 text-retro-amber border border-retro-amber/30"
            : "hover:bg-accent/10 text-muted-foreground"
        )}
        title="Code"
      >
        <FileCode className="w-5 h-5" />
      </button>
      <button
        onClick={() => onViewModeChange("preview")}
        className={cn(
          "w-12 h-12 rounded flex items-center justify-center transition-colors",
          viewMode === "preview"
            ? "bg-retro-amber/20 text-retro-amber border border-retro-amber/30"
            : "hover:bg-accent/10 text-muted-foreground"
        )}
        title="Preview"
      >
        <Monitor className="w-5 h-5" />
      </button>
    </div>
  );
};

export default WorkspaceSidebar;
