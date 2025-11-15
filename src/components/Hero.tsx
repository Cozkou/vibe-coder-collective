import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Mic, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TeamSetupModal from "./TeamSetupModal";
import homerImage from "@/assets/homer.png";

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
    <div className="relative h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Grid Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle, hsl(45 100% 55%) 2px, transparent 2px),
            linear-gradient(to right, hsl(45 100% 55% / 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(45 100% 55% / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          backgroundPosition: '0 0'
        }}
      />
      
      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4 mb-4 -mt-12">
            <h1 className="text-5xl md:text-6xl font-mono font-bold text-retro-amber">
              HomerIDE
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-mono">
              Collaborative Vibe Coding - Made Possible
            </p>
          </div>

          {/* Centered Layout with Image and Form */}
          <div className="relative flex items-center justify-center">
            {/* Homer Image - Background */}
            <div className="absolute -top-8">
              <img 
                src={homerImage} 
                alt="Homer Simpson" 
                className="w-96 object-contain scale-x-[-1] opacity-60"
              />
            </div>

            {/* Prompt Input - Foreground */}
            <Card className="relative z-10 p-6 bg-card/95 backdrop-blur-sm border-border w-full max-w-2xl mt-64">
              <div className="space-y-4">
                <Textarea
                  placeholder="Describe what you want to build..."
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
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-0 left-0 right-0 pb-8 text-center">
        <p className="text-sm text-muted-foreground font-mono">
          WLDN x Builder's Brew | HomerIDE 2025 <span className="text-base">©</span>
        </p>
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