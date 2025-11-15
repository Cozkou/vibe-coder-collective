import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, GripVertical, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useParams } from "react-router-dom";
import { useFirestorePrompts } from "@/hooks/useFirestorePrompts";
import { useToast } from "@/hooks/use-toast";

interface FloatingInputProps {
  currentFeature?: string;
  onClearFeature?: () => void;
}

const FloatingInput = ({ currentFeature, onClearFeature }: FloatingInputProps) => {
  const { sessionId } = useParams();
  const { addPrompt } = useFirestorePrompts(sessionId);
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 150, y: window.innerHeight - 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [userId] = useState(() => {
    // Get or create a persistent user ID
    let id = sessionStorage.getItem('userId');
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem('userId', id);
    }
    return id;
  });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    try {
      // Add context about current feature if available
      const promptContent = currentFeature 
        ? `[Feature: ${currentFeature}] ${message}`
        : message;
      
      // Save prompt to Firestore
      await addPrompt(promptContent, userId);
      
      toast({
        title: "Prompt sent!",
        description: "AI agent will process your request",
      });
      
      setMessage("");
      console.log('Prompt saved to Firestore:', promptContent);
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast({
        title: "Error",
        description: "Failed to send prompt. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed z-50" style={{ left: `${position.x}px`, top: `${position.y}px` }}>
      {currentFeature && (
        <div className="mb-2 animate-fade-in">
          <div className="bg-retro-amber/20 border border-retro-amber/50 rounded-lg px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-mono text-retro-amber">
              Currently working on: <span className="font-semibold">{currentFeature}</span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 hover:bg-retro-amber/30"
              onClick={onClearFeature}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
      
      <Card
        ref={cardRef}
        className="bg-background border-border shadow-lg"
        style={{
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        <div className="flex items-center gap-1 p-2">
          <div
            className="flex items-center justify-center cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask AI assistant..."
            className="bg-background border-border text-xs h-8 w-64"
          />
          <Button onClick={handleSend} size="icon" className="h-8 w-8 shrink-0">
            <Send className="w-3 h-3" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default FloatingInput;
