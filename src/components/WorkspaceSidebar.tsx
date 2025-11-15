import { FileCode, ListTodo, Layers } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import FileView from "./FileView";
import QueueView from "./QueueView";
import TasksView from "./TasksView";

const items = [
  { title: "Files", value: "files", icon: FileCode },
  { title: "Queue", value: "queue", icon: Layers },
  { title: "Tasks", value: "tasks", icon: ListTodo },
];

const WorkspaceSidebar = () => {
  const { open } = useSidebar();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get("tab") || "files";

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-border/50">
      <SidebarContent className="bg-background/50">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    asChild
                    isActive={activeTab === item.value}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={`?tab=${item.value}`}
                      className="flex items-center gap-3"
                      activeClassName="bg-accent text-accent-foreground"
                    >
                      <item.icon className="w-5 h-5" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="flex-1 overflow-hidden mt-4">
          {activeTab === "files" && <FileView />}
          {activeTab === "queue" && <QueueView />}
          {activeTab === "tasks" && <TasksView />}
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

export default WorkspaceSidebar;
