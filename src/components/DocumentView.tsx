import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";

interface DocumentViewProps {
  onFeatureClick?: (feature: string) => void;
}

const DocumentView = ({ onFeatureClick }: DocumentViewProps) => {
  const { id: sessionId } = useParams();
  const [spec, setSpec] = useState("");
  const [displayedSpec, setDisplayedSpec] = useState("");
  const [isAnimating, setIsAnimating] = useState(true);
  const features = [
    "User Authentication",
    "Real-time Collaboration",
    "Document Management",
    "Task Assignment",
    "Team Chat"
  ];

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
      } else {
        // Mock data for now
        setSpec(`Product Specification: Collaborative Workspace Platform

Overview:
A modern, real-time collaborative workspace designed for distributed teams to work together seamlessly. This platform combines project management, document collaboration, and team communication in one unified interface.

Core Features:
- User Authentication
- Real-time Collaboration  
- Document Management
- Task Assignment
- Team Chat

Technical Stack:
- Frontend: React, TypeScript, Tailwind CSS
- Backend: Supabase (PostgreSQL, Realtime, Auth)
- Deployment: Vercel

Target Users:
Remote teams, startups, and small to medium-sized businesses looking for an all-in-one collaboration solution.`);
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
      <div className="p-4 space-y-4">
        <h3 className="text-sm font-mono font-semibold text-retro-amber">PRODUCT SPEC</h3>
        
        <div className="bg-card/30 border border-border rounded-lg p-4">
          <pre className="font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed">
            {displayedSpec}
            {isAnimating && <span className="inline-block w-2 h-4 bg-retro-amber animate-pulse ml-1" />}
          </pre>
        </div>

        {!isAnimating && (
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-semibold text-muted-foreground">CLICK A FEATURE TO START WORKING:</h4>
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
        )}
      </div>
    </ScrollArea>
  );
};

export default DocumentView;
