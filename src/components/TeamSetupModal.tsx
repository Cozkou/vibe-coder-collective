import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TeamSetupModalProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
}

const TeamSetupModal = ({ open, onClose, sessionId }: TeamSetupModalProps) => {
  const [teamSize, setTeamSize] = useState("2");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const sessionLink = `${window.location.origin}/workspace/${sessionId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sessionLink);
    setCopied(true);
    toast({
      title: "Link copied!",
      description: "Share this link with your team members",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card backdrop-blur-xl border border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-mono text-retro-amber">
            Setup Your Team
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="teamSize" className="font-mono text-sm">How many people are on your team?</Label>
            <Input
              id="teamSize"
              type="number"
              min="1"
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
              className="bg-background border-border font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-mono text-sm">Share this link with your team</Label>
            <div className="flex gap-2">
              <Input
                value={sessionLink}
                readOnly
                className="bg-background border-border font-mono text-xs"
              />
              <Button
                onClick={handleCopy}
                size="icon"
                variant="outline"
                className="shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <Button
            onClick={onClose}
            className="w-full bg-retro-amber text-background hover:bg-retro-amber/90 font-mono"
          >
            Start Collaborating
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamSetupModal;