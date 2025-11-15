import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, Circle } from "lucide-react";

const mockTasks = [
  { id: 1, title: "Setup authentication flow", assignee: "User 1", status: "completed" },
  { id: 2, title: "Design landing page", assignee: "User 2", status: "in-progress" },
  { id: 3, title: "Implement sidebar navigation", assignee: "User 1", status: "pending" },
  { id: 4, title: "Add real-time collaboration", assignee: "User 3", status: "pending" },
];

const TasksView = () => {
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        <h3 className="text-xs font-mono font-semibold text-retro-amber mb-3">TASKS</h3>
        {mockTasks.map((task) => (
          <div key={task.id} className="p-2 rounded bg-background border border-border space-y-2">
            <div className="flex items-start gap-2">
              {task.status === "completed" ? (
                <CheckCircle2 className="w-4 h-4 text-retro-green shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-1.5">
                <p className={`text-xs font-mono ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                  {task.title}
                </p>
                <div className="flex items-center gap-2">
                  <Avatar className="w-5 h-5">
                    <AvatarFallback className="text-xs bg-retro-amber/20 text-retro-amber font-mono">
                      {task.assignee.split(" ")[1]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground font-mono">{task.assignee}</span>
                </div>
              </div>
              <Badge variant={task.status === "completed" ? "secondary" : task.status === "in-progress" ? "default" : "outline"} className="text-xs h-5">
                {task.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default TasksView;