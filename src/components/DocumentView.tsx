import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";

interface DocumentViewProps {
  onFeatureClick?: (feature: string) => void;
}

const DocumentView = ({ onFeatureClick }: DocumentViewProps) => {
  const { id: sessionId } = useParams();
  const [hasAnimated, setHasAnimated] = useState(() => {
    return sessionStorage.getItem(`animated-${sessionId}`) === 'true';
  });
  const [displayedSpec, setDisplayedSpec] = useState("");
  const [isAnimating, setIsAnimating] = useState(!hasAnimated);
  
  const spec = `Product Specification

Core Features:
- User Authentication
- Real-time Collaboration  
- Document Management
- Task Assignment
- Team Chat`;

  const features = [
    "User Authentication",
    "Real-time Collaboration",
    "Document Management",
    "Task Assignment",
    "Team Chat"
  ];

  useEffect(() => {
    if (hasAnimated) {
      setDisplayedSpec(spec);
      return;
    }
    
    sessionStorage.setItem(`animated-${sessionId}`, 'true');
  }, [hasAnimated, sessionId, spec]);

  useEffect(() => {
    if (hasAnimated || !spec) return;
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= spec.length) {
        setDisplayedSpec(spec.slice(0, currentIndex));
        currentIndex++;
      } else {
        setIsAnimating(false);
        setHasAnimated(true);
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [spec, hasAnimated]);


  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-mono font-semibold text-retro-amber">FEATURES</h3>
          <div className="space-y-1">
            {features.map((feature) => (
              <button
                key={feature}
                onClick={() => onFeatureClick?.(feature)}
                className="w-full text-left px-3 py-2 text-xs font-mono bg-card/50 border border-border rounded hover:border-retro-amber hover:bg-retro-amber/10 transition-all duration-200"
              >
                → {feature}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <h3 className="text-sm font-mono font-semibold text-retro-amber">PRODUCT SPEC</h3>
          <div className="bg-card/30 border border-border rounded-lg p-4">
            <pre className="font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed">
              {displayedSpec}
              {isAnimating && <span className="inline-block w-2 h-4 bg-retro-amber animate-pulse ml-1" />}
            </pre>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default DocumentView;
