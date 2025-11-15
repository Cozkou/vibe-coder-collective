import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Mic, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TeamSetupModal from "./TeamSetupModal";

const Hero = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Generate a UUID for anonymous user
      const anonymousId = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from("sessions")
        .insert({
          created_by: anonymousId,
          initial_prompt: prompt,
          team_size: 1,
        })
        .select()
        .single();

      if (error) throw error;

      setSessionId(data.id);
      setModalOpen(true);
    } catch (error) {
      console.error("Error creating session:", error);
      toast({
        title: "Failed to create session",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    if (sessionId) {
      navigate(`/workspace/${sessionId}`);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Realistic Sun */}
      <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] pointer-events-none">
        {/* Outer Glow */}
        <div className="absolute inset-0 rounded-full blur-3xl bg-retro-orange/30 scale-110" />
        
        {/* Sun Rays */}
        <div className="absolute inset-0">
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 origin-bottom opacity-40"
              style={{
                width: '3px',
                height: '200px',
                background: 'linear-gradient(to top, hsl(var(--retro-amber)), transparent)',
                transform: `translate(-50%, -50%) rotate(${i * 22.5}deg) translateY(-250px)`,
              }}
            />
          ))}
        </div>
        
        {/* Main Sun Body with Globe Effect */}
        <div className="absolute inset-0 rounded-full overflow-hidden shadow-[0_0_120px_40px_hsl(var(--retro-amber)/0.5)]">
          {/* Core gradient */}
          <div className="absolute inset-0 rounded-full bg-gradient-radial from-[hsl(45,100%,65%)] via-[hsl(40,100%,55%)] to-[hsl(35,100%,45%)]" />
          
          {/* Rotating texture overlay for globe effect */}
          <div 
            className="absolute inset-0 rounded-full opacity-30"
            style={{
              background: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.1) 40px, rgba(0,0,0,0.1) 80px)',
              animation: 'moveTexture 30s linear infinite',
            }}
          />
          
          {/* Light spots for dimension */}
          <div className="absolute top-[20%] left-[30%] w-32 h-32 rounded-full bg-[hsl(45,100%,75%)] blur-3xl opacity-60" />
          <div className="absolute top-[40%] right-[25%] w-24 h-24 rounded-full bg-[hsl(45,100%,70%)] blur-2xl opacity-40" />
          
          {/* Surface detail overlay */}
          <div 
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle at 35% 35%, transparent 30%, rgba(0,0,0,0.2) 100%)',
            }}
          />
        </div>
        
        {/* Atmospheric glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent via-retro-amber/20 to-retro-orange/40 blur-xl scale-105" />
      </div>
      
      <style>
        {`
          @keyframes moveTexture {
            0% { transform: translateX(0); }
            100% { transform: translateX(80px); }
          }
        `}
      </style>
      
      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-6xl md:text-7xl font-mono font-bold text-retro-amber">
              VibeCode
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-mono">
              The collaborative coding environment where teams vibe together
            </p>
          </div>

          {/* Prompt Input */}
          <Card className="p-4 bg-card border-border">
            <div className="space-y-3">
              <Textarea
                placeholder="Describe what you want to build... (e.g., Create a modern dashboard with user authentication)"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[80px] bg-background border-border resize-none font-mono text-sm"
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-foreground"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-foreground"
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  className="bg-retro-amber text-background hover:bg-retro-amber/90 font-mono h-9 px-4 gap-2"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? "Creating..." : "Start Building"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {sessionId && (
        <TeamSetupModal
          open={modalOpen}
          onClose={handleModalClose}
          sessionId={sessionId}
        />
      )}
    </div>
  );
};

export default Hero;