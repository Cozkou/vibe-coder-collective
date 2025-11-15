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
      <div className="p-4 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">TASKS</h3>
        {mockTasks.map((task) => (
          <div key={task.id} className="p-3 rounded-lg bg-background/50 border border-border/50 space-y-3">
            <div className="flex items-start gap-2">
              {task.status === "completed" ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-2">
                <p className={`text-sm ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                  {task.title}
                </p>
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs bg-cosmic-purple/20">
                      {task.assignee.split(" ")[1]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">{task.assignee}</span>
                </div>
              </div>
              <Badge variant={task.status === "completed" ? "secondary" : task.status === "in-progress" ? "default" : "outline"}>
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