import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";

const UserPresence = () => {
  // Mock users for now - will be real-time later
  const users = [
    { id: 1, name: "Alex", color: "bg-cosmic-purple" },
    { id: 2, name: "Jordan", color: "bg-cosmic-cyan" },
    { id: 3, name: "Sam", color: "bg-cosmic-indigo" },
  ];

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Online Now</h3>
      </div>
      
      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-8 h-8">
                <AvatarFallback className={`${user.color} text-foreground text-xs`}>
                  {user.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-card" />
            </div>
            <span className="text-sm">{user.name}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default UserPresence;
