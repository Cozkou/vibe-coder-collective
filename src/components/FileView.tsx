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
      <div className="p-3 space-y-1">
        <h3 className="text-xs font-mono font-semibold text-retro-amber mb-3">PROJECT FILES</h3>
        {mockFiles.map((item, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded hover:bg-accent/10 cursor-pointer transition-colors border border-transparent hover:border-border">
            {item.type === "folder" ? (
              <Folder className="w-4 h-4 text-retro-green" />
            ) : (
              <FileCode className="w-4 h-4 text-retro-amber" />
            )}
            <span className="text-xs font-mono">{item.name}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default FileView;