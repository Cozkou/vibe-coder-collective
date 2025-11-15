import { ScrollArea } from "@/components/ui/scroll-area";
import { FileCode } from "lucide-react";
import { useFirestoreFiles } from "@/hooks/useFirestoreFiles";

interface FileViewProps {
  sessionId: string;
  onFileClick?: (fileId: string, filePath: string) => void;
  selectedFileId?: string;
}

const FileView = ({ sessionId, onFileClick, selectedFileId }: FileViewProps) => {
  const { files } = useFirestoreFiles(sessionId);

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        <h3 className="text-xs font-mono font-semibold text-retro-amber mb-3">PROJECT FILES</h3>
        {files.length === 0 ? (
          <p className="text-xs text-muted-foreground">No files yet...</p>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              onClick={() => onFileClick?.(file.id, file.path)}
              className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors border ${
                selectedFileId === file.id
                  ? 'bg-retro-amber/10 border-retro-amber'
                  : 'border-transparent hover:bg-accent/10 hover:border-border'
              }`}
            >
              <FileCode className="w-4 h-4 text-retro-amber" />
              <span className="text-xs font-mono">{file.path}</span>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
};

export default FileView;