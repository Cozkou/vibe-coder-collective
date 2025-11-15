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
      {/* Dark overlay with cutout for clickable feature */}
      <div className="absolute inset-0 pointer-events-auto" style={{
        background: 'radial-gradient(circle at 140px 152px, transparent 0, transparent 150px, hsl(var(--background) / 0.95) 150px)'
      }} />
      
      {/* Spotlight border on first feature - exact size */}
      <div className="absolute left-4 top-[120px] w-[272px] h-12 rounded border-2 border-retro-amber shadow-[0_0_30px_rgba(251,191,36,0.4)] animate-pulse pointer-events-none" />
      
      {/* Homer and speech bubble - Bottom Left */}
      <div className="absolute bottom-8 left-8 flex flex-col items-start gap-4 animate-[slide-in-from-bottom_0.6s_ease-out] pointer-events-none">
        {/* Speech bubble - Top Right */}
        <div className="relative ml-auto mr-8">
          {/* Bubble tail pointing down to Homer */}
          <div className="absolute -bottom-3 left-8 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[16px] border-t-card" />
          
          {/* Bubble content */}
          <div className="bg-card border-2 border-retro-amber rounded-lg p-5 shadow-lg max-w-md">
            <p className="text-base font-mono text-foreground leading-relaxed">
              Ah, now we have the first mock of the website. Now let's pick our first feature for our to work on!
            </p>
          </div>
        </div>
        
        {/* Homer - Much Bigger */}
        <div className="w-64 h-80">
          <img 
            src={homerImage} 
            alt="Homer Simpson" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay;
