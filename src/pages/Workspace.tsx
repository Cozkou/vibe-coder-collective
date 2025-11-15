import CodeEditor from "@/components/CodeEditor";
import UserPresence from "@/components/UserPresence";
import { Button } from "@/components/ui/button";
import { Home, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Workspace = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cosmic-purple/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cosmic-cyan/10 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-sm bg-background/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/")}
            >
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cosmic-purple to-cosmic-cyan bg-clip-text text-transparent">
              VibeCode
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Sun className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main workspace */}
      <div className="relative z-10 container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[1fr_280px] gap-6">
          <CodeEditor />
          <div className="space-y-6">
            <UserPresence />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
