import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";

interface DocumentViewProps {
  onTextClick?: (text: string) => void;
}

const DocumentView = ({ onTextClick }: DocumentViewProps) => {
  const { id: sessionId } = useParams();
  const [spec, setSpec] = useState("");
  const [displayedSpec, setDisplayedSpec] = useState("");
  const [isAnimating, setIsAnimating] = useState(true);
  const [selectedText, setSelectedText] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpec = async () => {
      if (!sessionId) return;
      
      const { data, error } = await supabase
        .from("sessions")
        .select("initial_prompt")
        .eq("id", sessionId)
        .single();

      if (data && !error) {
        setSpec(data.initial_prompt);
      }
    };

    fetchSpec();
  }, [sessionId]);

  useEffect(() => {
    if (!spec) return;
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= spec.length) {
        setDisplayedSpec(spec.slice(0, currentIndex));
        currentIndex++;
      } else {
        setIsAnimating(false);
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [spec]);

  const handleTextClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 0) {
      setSelectedText(text);
      onTextClick?.(text);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <h3 className="text-sm font-mono font-semibold text-retro-amber">PRODUCT SPEC</h3>
        
        <div 
          className="bg-card/30 border border-border rounded-lg p-4 cursor-text hover:border-retro-amber/50 transition-colors"
          onClick={handleTextClick}
        >
          <pre className="font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed select-text">
            {displayedSpec}
            {isAnimating && <span className="inline-block w-2 h-4 bg-retro-amber animate-pulse ml-1" />}
          </pre>
          {!isAnimating && (
            <p className="text-[10px] text-muted-foreground mt-4 font-mono">
              Select text and click to discuss with AI
            </p>
          )}
        </div>
      </div>
    </ScrollArea>
  );
};

export default DocumentView;
