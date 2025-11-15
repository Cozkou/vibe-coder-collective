import { FileCode, ListTodo, Layers } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import FileView from "./FileView";
import QueueView from "./QueueView";
import TasksView from "./TasksView";

const items = [
  { title: "Files", value: "files", icon: FileCode },
  { title: "Queue", value: "queue", icon: Layers },
  { title: "Tasks", value: "tasks", icon: ListTodo },
];

const WorkspaceSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get("tab") || "files";

  const handleTabChange = (value: string) => {
    navigate(`?tab=${value}`);
  };

  return (
    <div
      className={cn(
        "h-full bg-background/50 border-r border-border/50 transition-all duration-300 flex",
        isExpanded ? "w-72" : "w-16"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Icon Navigation */}
      <div className="w-16 flex flex-col gap-2 p-2 border-r border-border/30">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.value}
              onClick={() => handleTabChange(item.value)}
              className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center transition-colors",
                activeTab === item.value
                  ? "bg-cosmic-purple/20 text-cosmic-purple"
                  : "hover:bg-accent/50 text-muted-foreground"
              )}
              title={item.title}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      {isExpanded && (
        <div className="flex-1 overflow-hidden">
          {activeTab === "files" && <FileView />}
          {activeTab === "queue" && <QueueView />}
          {activeTab === "tasks" && <TasksView />}
        </div>
      )}
    </div>
  );
};

export default WorkspaceSidebar;
