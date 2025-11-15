import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";

const DocumentView = () => {
  const { id: sessionId } = useParams();
  const [spec, setSpec] = useState("");
  const [displayedSpec, setDisplayedSpec] = useState("");
  const [isAnimating, setIsAnimating] = useState(true);

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

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-5 h-5 text-retro-amber" />
          <h3 className="text-lg font-mono font-semibold text-foreground">Product Specification</h3>
        </div>
        
        <div className="bg-card/30 border border-border rounded-lg p-6">
          <pre className="font-mono text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {displayedSpec}
            {isAnimating && <span className="inline-block w-2 h-4 bg-retro-amber animate-pulse ml-1" />}
          </pre>
        </div>
      </div>
    </ScrollArea>
  );
};

export default DocumentView;
