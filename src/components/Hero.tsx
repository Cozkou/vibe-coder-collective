import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Users, Zap } from "lucide-react";
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
      const { data, error } = await supabase
        .from("sessions")
        .insert({
          created_by: "anonymous",
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

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered",
      description: "Let AI handle the heavy lifting while you focus on creativity",
    },
    {
      icon: Users,
      title: "Collaborative",
      description: "Code together in real-time with your team",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "See changes instantly with hot reload",
    },
  ];

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

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {features.map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded bg-card border border-border hover:border-retro-amber/50 transition-all"
              >
                <div className="w-12 h-12 rounded bg-retro-amber/10 flex items-center justify-center mb-4 border border-retro-amber/20">
                  <feature.icon className="w-6 h-6 text-retro-amber" />
                </div>
                <h3 className="text-lg font-semibold mb-2 font-mono">{feature.title}</h3>
                <p className="text-sm text-muted-foreground font-mono">{feature.description}</p>
              </div>
            ))}
          </div>
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