import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const SandboxPreview = () => {
  return (
    <Card className="h-full bg-background/50 border-border/50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <h3 className="text-sm font-semibold">PREVIEW</h3>
        <Button size="sm" variant="ghost">
          <ExternalLink className="w-4 h-4" />
        </Button>
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