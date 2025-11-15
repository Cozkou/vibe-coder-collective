import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Users, Zap } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Hero = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

      navigate(`/workspace/${data.id}`);
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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cosmic-purple/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cosmic-cyan/20 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cosmic-indigo/10 rounded-full blur-[120px]" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-6xl md:text-7xl font-bold">
              <span className="bg-gradient-to-r from-cosmic-purple via-cosmic-indigo to-cosmic-cyan bg-clip-text text-transparent">
                VibeCode
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The collaborative coding environment where teams vibe together
            </p>
          </div>

          {/* Prompt Input */}
          <Card className="p-6 bg-background/50 backdrop-blur-sm border-border/50">
            <div className="space-y-4">
              <Textarea
                placeholder="Describe what you want to build... (e.g., Create a modern dashboard with user authentication)"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] bg-background/50 border-border/50 resize-none"
              />
              <Button 
                size="lg"
                className="w-full bg-gradient-to-r from-cosmic-purple to-cosmic-cyan hover:opacity-90 text-white"
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
                className="p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/50 hover:bg-card/50 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-cosmic flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Hero;