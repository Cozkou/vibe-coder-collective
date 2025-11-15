import { Card } from "@/components/ui/card";

const SandboxPreview = () => {
  return (
    <Card className="h-full bg-background border-border flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h3 className="text-xs font-mono font-semibold text-retro-amber">PREVIEW</h3>
      </div>
      <div className="flex-1 bg-white overflow-hidden">
        <iframe
          src="/"
          className="w-full h-full"
          title="Preview"
        />
      </div>
    </Card>
  );
};

export default SandboxPreview;