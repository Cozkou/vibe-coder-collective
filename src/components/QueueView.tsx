import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

const mockPrompts = [
  { id: 1, content: "Create a login page with email and password", time: "2 min ago", status: "completed" },
  { id: 2, content: "Add dark mode toggle to header", time: "5 min ago", status: "completed" },
  { id: 3, content: "Implement user profile settings", time: "Just now", status: "processing" },
];

const QueueView = () => {
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        <h3 className="text-xs font-mono font-semibold text-retro-amber mb-3">PROMPT QUEUE</h3>
        {mockPrompts.map((prompt) => (
          <div key={prompt.id} className="p-2 rounded bg-background border border-border space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-mono flex-1">{prompt.content}</p>
              <Badge variant={prompt.status === "completed" ? "secondary" : "default"} className="shrink-0 text-xs h-5">
                {prompt.status}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
              <Clock className="w-3 h-3" />
              <span>{prompt.time}</span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default QueueView;