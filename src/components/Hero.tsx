import { Button } from "@/components/ui/button";
import { Code2, Users, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cosmic-purple/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cosmic-cyan/20 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cosmic-indigo/10 rounded-full blur-[120px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-card/50 backdrop-blur-sm border border-border">
          <Sparkles className="w-4 h-4 text-cosmic-cyan" />
          <span className="text-sm text-muted-foreground">Code together, vibe together</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-cosmic-purple via-cosmic-cyan to-cosmic-indigo bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000">
          VibeCode
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
          A collaborative coding space designed for flow state. Write code with your team in an ambient, distraction-free environment.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
          <Button 
            onClick={() => navigate("/workspace")}
            size="lg" 
            className="bg-primary hover:bg-primary/90 shadow-glow-primary group"
          >
            <Code2 className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
            Start Coding
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="border-border/50 backdrop-blur-sm hover:bg-card/50"
          >
            <Users className="w-5 h-5 mr-2" />
            Invite Team
          </Button>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-24 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
          {[
            {
              icon: Code2,
              title: "Real-time Collaboration",
              description: "Code together with live cursors and instant updates"
            },
            {
              icon: Sparkles,
              title: "Ambient Experience",
              description: "Focus-enhancing design with subtle animations"
            },
            {
              icon: Users,
              title: "Team Presence",
              description: "See who's online and working on what"
            }
          ].map((feature, i) => (
            <div 
              key={i}
              className="p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/50 hover:bg-card/50 transition-all hover:scale-105"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-cosmic flex items-center justify-center mb-4 mx-auto">
                <feature.icon className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hero;
