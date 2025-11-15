import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import homerImage from "@/assets/homer-tutorial.png";

interface TutorialOverlayProps {
  sessionId?: string;
}

const TutorialOverlay = ({ sessionId }: TutorialOverlayProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if tutorial has been completed for this session
    const tutorialKey = `tutorial-completed-${sessionId}`;
    const hasCompleted = sessionStorage.getItem(tutorialKey);
    
    if (!hasCompleted) {
      // Show tutorial after a brief delay
      setTimeout(() => setIsVisible(true), 500);
    }
  }, [sessionId]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (sessionId) {
      sessionStorage.setItem(`tutorial-completed-${sessionId}`, 'true');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-background/95 animate-fade-in" />
      
      {/* Spotlight on first feature */}
      <div className="absolute left-4 top-32 w-72 h-12 bg-retro-amber/10 rounded-lg border-2 border-retro-amber shadow-[0_0_30px_rgba(251,191,36,0.4)] animate-pulse" />
      
      {/* Homer and speech bubble container */}
      <div className="relative z-10 flex items-center gap-6 animate-scale-in">
        {/* Homer */}
        <div className="w-48 h-64">
          <img 
            src={homerImage} 
            alt="Homer Simpson" 
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* Speech bubble */}
        <div className="relative max-w-md">
          {/* Bubble tail */}
          <div className="absolute -left-4 top-8 w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-r-[16px] border-r-card" />
          
          {/* Bubble content */}
          <div className="bg-card border-2 border-retro-amber rounded-lg p-6 shadow-lg">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={handleDismiss}
            >
              <X className="w-4 h-4" />
            </Button>
            
            <p className="text-lg font-mono text-foreground leading-relaxed pr-6">
              Ah, now we have the first mock of the website. Now let's pick our first feature for our to work on!
            </p>
            
            <Button
              onClick={handleDismiss}
              className="mt-4 bg-retro-amber text-background hover:bg-retro-amber/90 font-mono"
            >
              Got it!
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay;
