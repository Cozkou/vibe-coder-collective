import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const mockMessages = [
  { id: 1, role: "assistant", content: "Hi! I'm your AI coding assistant. How can I help you today?" },
  { id: 2, role: "user", content: "Can you help me add a login page?" },
  { id: 3, role: "assistant", content: "Of course! I'll create a login page with email and password fields. I'll also add proper validation and styling to match your design system." },
];

const ChatBot = () => {
  const [message, setMessage] = useState("");
  const [messages] = useState(mockMessages);

  const handleSend = () => {
    if (message.trim()) {
      // TODO: Add message to queue
      setMessage("");
    }
  };

  return (
    <Card className="h-full bg-background/50 border-border/50 flex flex-col">
      <div className="p-4 border-b border-border/50">
        <h3 className="text-sm font-semibold">AI ASSISTANT</h3>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-r from-cosmic-purple to-cosmic-cyan text-white">
                    AI
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[80%] p-3 rounded-lg ${
                msg.role === "user" 
                  ? "bg-cosmic-purple/20 ml-auto" 
                  : "bg-background border border-border/50"
              }`}>
                <p className="text-sm">{msg.content}</p>
              </div>
              {msg.role === "user" && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-cosmic-cyan/20">U</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border/50">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask me anything..."
            className="bg-background/50 border-border/50"
          />
          <Button onClick={handleSend} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ChatBot;