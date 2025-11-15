import { useState, useEffect } from "react";
import homerImage from "@/assets/homer-tutorial.png";

interface TutorialOverlayProps {
  sessionId?: string;
  onFeatureClicked?: boolean;
}

const TutorialOverlay = ({ sessionId, onFeatureClicked }: TutorialOverlayProps) => {
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

  useEffect(() => {
    // Dismiss when feature is clicked
    if (onFeatureClicked) {
      setIsVisible(false);
      if (sessionId) {
        sessionStorage.setItem(`tutorial-completed-${sessionId}`, 'true');
      }
    }
  }, [onFeatureClicked, sessionId]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-background/95 animate-fade-in pointer-events-auto" />
      
      {/* Spotlight on first feature */}
      <div className="absolute left-4 top-32 w-72 h-12 bg-retro-amber/10 rounded-lg border-2 border-retro-amber shadow-[0_0_30px_rgba(251,191,36,0.4)] animate-pulse pointer-events-none" />
      
      {/* Homer and speech bubble - Bottom Left */}
      <div className="absolute bottom-8 left-8 flex items-end gap-4 animate-[slide-in-from-bottom_0.6s_ease-out] pointer-events-auto">
        {/* Homer */}
        <div className="w-32 h-44">
          <img 
            src={homerImage} 
            alt="Homer Simpson" 
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* Speech bubble */}
        <div className="relative mb-4">
          {/* Bubble tail pointing to Homer */}
          <div className="absolute -left-4 bottom-8 w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-r-[16px] border-r-card" />
          
          {/* Bubble content */}
          <div className="bg-card border-2 border-retro-amber rounded-lg p-5 shadow-lg max-w-md">
            <p className="text-base font-mono text-foreground leading-relaxed">
              Ah, now we have the first mock of the website. Now let's pick our first feature for our to work on!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay;
