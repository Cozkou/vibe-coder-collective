import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import homerImage from "@/assets/homer-tutorial.png";
import homerImage2 from "@/assets/homer-tutorial-2.png";

interface TutorialOverlayProps {
  sessionId?: string;
  onFeatureClicked?: boolean;
}

const TutorialOverlay = ({ sessionId, onFeatureClicked }: TutorialOverlayProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [showButton, setShowButton] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const tutorialSteps = [
    "Ah, now we have the first mock of the website. Now let's pick our first feature for us to work on! All context about the site will be in the 'Product Spec' section.",
    "Now that you've added the first feature, feel free to type anything in the prompt to make any changes! Any changes that you prompt will automatically update the Product Spec."
  ];

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
    // Advance to step 2 when feature is clicked
    if (onFeatureClicked && currentStep === 1) {
      setShowButton(false);
      setDisplayedText("");
      setCurrentStep(2);
    }
  }, [onFeatureClicked, currentStep]);

  useEffect(() => {
    if (!isVisible) return;
    
    const fullText = tutorialSteps[currentStep - 1];
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
  }, [isVisible, currentStep]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (sessionId) {
      sessionStorage.setItem(`tutorial-completed-${sessionId}`, 'true');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-8 z-50 flex items-end gap-6 animate-[slide-in-from-bottom_0.6s_ease-out]">
      {/* Homer - Big with bottom half cut off */}
      <div className="w-80 h-64 overflow-hidden">
        <img 
          src={currentStep === 1 ? homerImage : homerImage2} 
          alt="Homer Simpson" 
          className="w-full h-auto object-contain"
        />
      </div>
      
      {/* Speech bubble - Right side */}
      <div className="relative mb-8 flex-1 max-w-md">
        {/* Progress bar */}
        <div className="mb-3 flex items-center gap-2">
          <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-retro-amber transition-all duration-300" 
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground">Step {currentStep} of 3</span>
        </div>
        
        {/* Bubble tail pointing to Homer */}
        <div className="absolute -left-3 bottom-8 w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-r-[16px] border-r-card" />
        
        {/* Bubble content */}
        <div className="bg-card border-2 border-retro-amber rounded-lg p-5 shadow-lg">
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
    </div>
  );
};

export default TutorialOverlay;
