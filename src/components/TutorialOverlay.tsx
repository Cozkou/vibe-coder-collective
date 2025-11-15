import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import homerImage from "@/assets/homer-tutorial.png";

interface TutorialOverlayProps {
  sessionId?: string;
}

const TutorialOverlay = ({ sessionId }: TutorialOverlayProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [showButton, setShowButton] = useState(false);
  
  const fullText = "Ah, now we have the first mock of the website. Now let's pick our first feature for us to work on!";

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
    if (!isVisible) return;
    
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setShowButton(true);
      }
    }, 30);

    return () => clearInterval(typingInterval);
  }, [isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (sessionId) {
      sessionStorage.setItem(`tutorial-completed-${sessionId}`, 'true');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-8 left-8 z-50 flex flex-col items-start gap-4 animate-[slide-in-from-bottom_0.6s_ease-out]">
      {/* Speech bubble - Top */}
      <div className="relative ml-8">
        {/* Bubble tail pointing down to Homer */}
        <div className="absolute -bottom-3 left-8 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[16px] border-t-card" />
        
        {/* Bubble content */}
        <div className="bg-card border-2 border-retro-amber rounded-lg p-5 shadow-lg max-w-md">
          <p className="text-base font-mono text-foreground leading-relaxed min-h-[80px]">
            {displayedText}
            {!showButton && <span className="inline-block w-2 h-4 bg-retro-amber animate-pulse ml-1" />}
          </p>
          
          {showButton && (
            <Button
              onClick={handleDismiss}
              className="mt-4 bg-retro-amber text-background hover:bg-retro-amber/90 font-mono animate-fade-in"
            >
              Got it!
            </Button>
          )}
        </div>
      </div>
      
      {/* Homer - Big */}
      <div className="w-64 h-80">
        <img 
          src={homerImage} 
          alt="Homer Simpson" 
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
};

export default TutorialOverlay;
