import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareCodeModalProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
}

const ShareCodeModal = ({ open, onClose, sessionId }: ShareCodeModalProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  // Generate a 6-character code from sessionId
  const shareCode = sessionId.substring(0, 6).toUpperCase();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareCode);
    setCopied(true);
    toast({
      title: "Code copied!",
      description: "Share this code with your team members",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card backdrop-blur-xl border border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-mono text-retro-amber">
            Share Your Workspace
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="font-mono text-sm">Share this code with your team</Label>
            <div className="flex gap-2">
              <Input
                value={shareCode}
                readOnly
                className="bg-background border-border font-mono text-2xl text-center tracking-wider"
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
            <p className="text-xs text-muted-foreground font-mono">
              Team members can join using this code
            </p>
          </div>

          <Button
            onClick={onClose}
            className="w-full bg-retro-amber text-background hover:bg-retro-amber/90 font-mono"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareCodeModal;
