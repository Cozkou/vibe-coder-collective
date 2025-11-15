import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

const CodeEditor = () => {
  const [code, setCode] = useState(`// Start coding together...\n\nfunction welcomeToVibeCode() {\n  console.log("Let's create something amazing!");\n}\n\nwelcomeToVibeCode();`);

  return (
    <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive/80" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-xs text-muted-foreground font-mono">index.js</span>
      </div>
      
      <Textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="min-h-[500px] font-mono text-sm bg-transparent border-0 focus-visible:ring-0 resize-none"
        placeholder="Start typing..."
      />
    </Card>
  );
};

export default CodeEditor;
