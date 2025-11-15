import { ScrollArea } from "@/components/ui/scroll-area";
import { FileCode, Folder } from "lucide-react";

const mockFiles = [
  { name: "src", type: "folder", children: [
    { name: "components", type: "folder" },
    { name: "pages", type: "folder" },
    { name: "App.tsx", type: "file" },
    { name: "index.css", type: "file" },
  ]},
  { name: "public", type: "folder" },
  { name: "package.json", type: "file" },
  { name: "README.md", type: "file" },
];

const FileView = () => {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">PROJECT FILES</h3>
        {mockFiles.map((item, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded hover:bg-accent/50 cursor-pointer transition-colors">
            {item.type === "folder" ? (
              <Folder className="w-4 h-4 text-cosmic-cyan" />
            ) : (
              <FileCode className="w-4 h-4 text-cosmic-purple" />
            )}
            <span className="text-sm">{item.name}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default FileView;