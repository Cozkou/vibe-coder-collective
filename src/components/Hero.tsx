import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
          <Card className="p-6 bg-card border-border">
            <div className="space-y-4">
              <Textarea
                placeholder="Describe what you want to build... (e.g., Create a modern dashboard with user authentication)"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] bg-background border-border resize-none font-mono text-sm"
              />
              <Button 
                size="lg"
                className="w-full bg-retro-amber text-background hover:bg-retro-amber/90 font-mono"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Start Building"}
              </Button>
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