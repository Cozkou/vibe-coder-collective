import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock } from "lucide-react";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Prompt {
  id: string;
  content: string;
  created_at: string;
  user_id: string | null;
  prompt_order: number;
}

interface User {
  id: string;
  color: string;
  initials: string;
}

const QueueView = () => {
  const { id: sessionId } = useParams();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [users, setUsers] = useState<Map<string, User>>(new Map());

  useEffect(() => {
    if (!sessionId) return;

    const fetchPrompts = async () => {
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .eq("session_id", sessionId)
        .order("prompt_order", { ascending: true });

      if (data && !error) {
        setPrompts(data);
        
        // Generate user colors and initials
        const userMap = new Map<string, User>();
        const colors = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500"];
        
        data.forEach((prompt, index) => {
          if (prompt.user_id && !userMap.has(prompt.user_id)) {
            userMap.set(prompt.user_id, {
              id: prompt.user_id,
              color: colors[userMap.size % colors.length],
              initials: `U${userMap.size + 1}`,
            });
          }
        });
        
        setUsers(userMap);
      }
    };

    fetchPrompts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('prompts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prompts',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchPrompts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const created = new Date(timestamp);
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
            const user = prompt.user_id ? users.get(prompt.user_id) : null;
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
                  <Badge variant="secondary" className="shrink-0 text-xs h-5">
                    done
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono pl-7">
                  <Clock className="w-3 h-3" />
                  <span>{getTimeAgo(prompt.created_at)}</span>
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