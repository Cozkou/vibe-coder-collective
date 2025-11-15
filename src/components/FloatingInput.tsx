import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, GripVertical } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";

const FloatingInput = () => {
  const [message, setMessage] = useState("");
  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 150, y: window.innerHeight - 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
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

  const handleSend = () => {
    if (message.trim()) {
      // TODO: Handle message sending
      setMessage("");
    }
  };

  return (
    <Card
      ref={cardRef}
      className="fixed z-50 bg-background border-border shadow-lg"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
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
  );
};

export default FloatingInput;
