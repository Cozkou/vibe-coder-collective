import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { FileCode, ListTodo, Layers } from "lucide-react";
import FileView from "./FileView";
import QueueView from "./QueueView";
import TasksView from "./TasksView";

const WorkspaceSidebar = () => {
  return (
    <Card className="h-full bg-background/50 border-border/50 overflow-hidden">
      <Tabs defaultValue="files" className="h-full flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-border/50 bg-transparent p-0">
          <TabsTrigger value="files" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-cosmic-purple">
            <FileCode className="w-4 h-4 mr-2" />
            Files
          </TabsTrigger>
          <TabsTrigger value="queue" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-cosmic-cyan">
            <Layers className="w-4 h-4 mr-2" />
            Queue
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-cosmic-indigo">
            <ListTodo className="w-4 h-4 mr-2" />
            Tasks
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="files" className="flex-1 m-0 overflow-hidden">
          <FileView />
        </TabsContent>
        <TabsContent value="queue" className="flex-1 m-0 overflow-hidden">
          <QueueView />
        </TabsContent>
        <TabsContent value="tasks" className="flex-1 m-0 overflow-hidden">
          <TasksView />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default WorkspaceSidebar;