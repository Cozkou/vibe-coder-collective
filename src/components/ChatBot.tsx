import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ChatBotProps {
  initialContext?: string;
  onClose?: () => void;
}

const ChatBot = ({ initialContext, onClose }: ChatBotProps) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ id: number; role: string; content: string }>>([]);

  useEffect(() => {
    if (initialContext) {
      setMessages([
        { 
          id: Date.now(), 
          role: "system", 
          content: `Context from document: "${initialContext}"\n\nHow can I help you with this?` 
        }
      ]);
    }
  }, [initialContext]);

  const handleSend = () => {
    if (message.trim()) {
      // TODO: Add message to queue
      setMessage("");
    }
  };

  return (
    <Card className="h-full bg-background border-border flex flex-col">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-mono font-semibold text-retro-amber">AI ASSISTANT</h3>
        {onClose && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={onClose}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
      
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          {messages.length === 0 && (
            <div className="text-center text-xs text-muted-foreground font-mono py-8">
              Select text from the document to start discussing
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
              {(msg.role === "assistant" || msg.role === "system") && (
                <Avatar className="w-6 h-6 shrink-0">
                  <AvatarFallback className="bg-retro-green/20 text-retro-green text-xs font-mono">
                    AI
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[85%] px-2 py-1.5 rounded text-xs ${
                msg.role === "user" 
                  ? "bg-muted ml-auto" 
                  : "bg-card border border-border"
              }`}>
                <p className="text-xs leading-relaxed">{msg.content}</p>
              </div>
              {msg.role === "user" && (
                <Avatar className="w-6 h-6 shrink-0">
                  <AvatarFallback className="bg-retro-amber/20 text-retro-amber text-xs font-mono">U</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-border">
        <div className="flex gap-1">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask..."
            className="bg-background border-border text-xs h-8"
          />
          <Button onClick={handleSend} size="icon" className="h-8 w-8 shrink-0">
            <Send className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ChatBot;