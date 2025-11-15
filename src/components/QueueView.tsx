import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, Users } from "lucide-react";
import { useParams } from "react-router-dom";
import { useFirestorePrompts } from "@/hooks/useFirestorePrompts";
import { useUserPresence } from "@/hooks/useUserPresence";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const QueueView = () => {
  const { sessionId } = useParams();
  const { prompts } = useFirestorePrompts(sessionId);
  const { users: activeUsers } = useUserPresence(sessionId);

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
        {/* Active Users Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-mono font-semibold text-retro-amber">PROMPT QUEUE</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{activeUsers.length}</span>
            </div>
          </div>
          <TooltipProvider>
            <div className="flex -space-x-2">
              {activeUsers.map((user) => (
                <Tooltip key={user.id}>
                  <TooltipTrigger>
                    <Avatar className="w-6 h-6 border-2 border-background">
                      <AvatarFallback 
                        style={{ backgroundColor: user.color }}
                        className="text-white text-[10px] font-mono"
                      >
                        {user.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs space-y-1">
                      <p className="font-semibold">{user.userName}</p>
                      {user.currentPrompt && (
                        <p className="text-muted-foreground">
                          Working on: {user.currentPrompt.substring(0, 30)}...
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </div>
        
        {prompts.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground font-mono py-8">
            No prompts yet
          </div>
        ) : (
          prompts.map((prompt) => {
            // Find the user who sent this prompt
            const user = activeUsers.find(u => u.id === prompt.userId);
            
            return (
              <div key={prompt.id} className="p-2 rounded bg-background border border-border space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    {user && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Avatar className="w-5 h-5 shrink-0">
                              <AvatarFallback 
                                style={{ backgroundColor: user.color }}
                                className="text-white text-[8px] font-mono"
                              >
                                {user.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{user.userName}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
                <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono" style={{ paddingLeft: user ? '1.75rem' : '0' }}>
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