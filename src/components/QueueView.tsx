import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock } from "lucide-react";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useFirestorePrompts } from "@/hooks/useFirestorePrompts";

interface User {
  id: string;
  color: string;
  initials: string;
}

const QueueView = () => {
  const { sessionId } = useParams();
  const { prompts } = useFirestorePrompts(sessionId);
  const [users, setUsers] = useState<Map<string, User>>(new Map());

  useEffect(() => {
    // Generate user colors and initials
    const userMap = new Map<string, User>();
    const colors = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500"];
    
    prompts.forEach((prompt, index) => {
      if (prompt.userId && !userMap.has(prompt.userId)) {
        userMap.set(prompt.userId, {
          id: prompt.userId,
          color: colors[userMap.size % colors.length],
          initials: `U${userMap.size + 1}`,
        });
      }
    });
    
    setUsers(userMap);
  }, [prompts]);

  const getTimeAgo = (timestamp: any) => {
    const now = new Date();
    const created = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((now.getTime() - created.getTime()) / 1000);
    
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-semibold text-retro-amber">PROMPT QUEUE</h3>
          <div className="flex -space-x-2">
            {Array.from(users.values()).map((user) => (
              <Avatar key={user.id} className="w-6 h-6 border-2 border-background">
                <AvatarFallback className={`${user.color} text-white text-[10px] font-mono`}>
                  {user.initials}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
        
        {prompts.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground font-mono py-8">
            No prompts yet
          </div>
        ) : (
          prompts.map((prompt) => {
            const user = prompt.userId ? users.get(prompt.userId) : null;
            return (
              <div key={prompt.id} className="p-2 rounded bg-background border border-border space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    {user && (
                      <Avatar className="w-5 h-5 shrink-0">
                        <AvatarFallback className={`${user.color} text-white text-[8px] font-mono`}>
                          {user.initials}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <p className="text-xs font-mono flex-1">{prompt.content}</p>
                  </div>
                  <Badge 
                    variant={prompt.status === "completed" ? "secondary" : "default"} 
                    className="shrink-0 text-xs h-5"
                  >
                    {prompt.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono pl-7">
                  <Clock className="w-3 h-3" />
                  <span>{getTimeAgo(prompt.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </ScrollArea>
  );
};

export default QueueView;