import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Mic, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TeamSetupModal from "./TeamSetupModal";
import sunTexture from "@/assets/sun-texture.jpg";

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
      {/* Realistic Sun - Bottom Half */}
      <div className="absolute -bottom-[400px] left-1/2 -translate-x-1/2 w-[1400px] h-[800px] pointer-events-none">
        {/* Outer Glow */}
        <div className="absolute inset-0 rounded-full blur-[100px] bg-retro-orange/40 scale-110" />
        
        {/* Sun Rays */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 origin-bottom opacity-30"
              style={{
                width: '4px',
                height: '300px',
                background: 'linear-gradient(to bottom, hsl(var(--retro-amber)), transparent)',
                transform: `translate(-50%, -50%) rotate(${i * 18}deg) translateY(350px)`,
              }}
            />
          ))}
        </div>
        
        {/* Solar Flares */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`flare-${i}`}
            className="absolute top-0 left-1/2 w-3 h-3 rounded-full bg-retro-amber/90 blur-sm"
            style={{
              left: `${20 + i * 8}%`,
              animation: `solarFlare${i % 5} ${4 + (i % 3)}s ease-out infinite`,
              animationDelay: `${i * 0.6}s`,
            }}
          />
        ))}
        
        {/* Main Sun Body with Real Texture */}
        <div className="absolute inset-0 rounded-full overflow-hidden shadow-[0_0_150px_60px_hsl(var(--retro-amber)/0.6)]">
          {/* Real sun texture */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              backgroundImage: `url(${sunTexture})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              animation: 'moveSunTexture 60s linear infinite',
            }}
          />
          
          {/* Overlay for blending */}
          <div className="absolute inset-0 rounded-full bg-gradient-radial from-[hsl(45,100%,70%)]/30 via-transparent to-[hsl(35,100%,45%)]/20 mix-blend-overlay" />
          
          {/* Corona effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-retro-amber/10 to-retro-orange/30 blur-2xl" />
        </div>
        
        {/* Atmospheric glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-retro-amber/15 to-retro-orange/30 blur-3xl scale-105" />
      </div>
      
      <style>
        {`
          @keyframes moveSunTexture {
            0% { transform: translateX(0) scale(1.1); }
            100% { transform: translateX(-100px) scale(1.1); }
          }
          
          @keyframes solarFlare0 {
            0% { 
              transform: translateY(0) scale(1); 
              opacity: 0; 
            }
            10% { 
              opacity: 0.8; 
            }
            100% { 
              transform: translateY(-250px) scale(2.5); 
              opacity: 0; 
            }
          }
          
          @keyframes solarFlare1 {
            0% { 
              transform: translateY(0) translateX(-30px) scale(1); 
              opacity: 0; 
            }
            10% { 
              opacity: 0.7; 
            }
            100% { 
              transform: translateY(-220px) translateX(-60px) scale(2); 
              opacity: 0; 
            }
          }
          
          @keyframes solarFlare2 {
            0% { 
              transform: translateY(0) translateX(30px) scale(1); 
              opacity: 0; 
            }
            10% { 
              opacity: 0.9; 
            }
            100% { 
              transform: translateY(-270px) translateX(60px) scale(2.8); 
              opacity: 0; 
            }
          }
          
          @keyframes solarFlare3 {
            0% { 
              transform: translateY(0) translateX(-40px) scale(1); 
              opacity: 0; 
            }
            10% { 
              opacity: 0.6; 
            }
            100% { 
              transform: translateY(-240px) translateX(-70px) scale(2.2); 
              opacity: 0; 
            }
          }
          
          @keyframes solarFlare4 {
            0% { 
              transform: translateY(0) translateX(40px) scale(1); 
              opacity: 0; 
            }
            10% { 
              opacity: 0.8; 
            }
            100% { 
              transform: translateY(-260px) translateX(70px) scale(2.6); 
              opacity: 0; 
            }
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