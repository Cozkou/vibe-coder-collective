import { useEffect, useState, useRef } from 'react';
import { useFirestorePrompts } from './useFirestorePrompts';
import { AIAgent } from '@/services/aiAgent';
import { useToast } from './use-toast';

/**
 * Hook that automatically processes pending prompts using the AI agent
 * 
 * Usage: Simply call useAIAgent(sessionId) in your workspace component
 * and it will automatically watch for and process new prompts.
 */
export const useAIAgent = (sessionId: string | undefined) => {
  const { prompts } = useFirestorePrompts(sessionId);
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false); // Prevent race conditions
  const lastProcessedRef = useRef<string | null>(null); // Track last processed prompt

  useEffect(() => {
    // Don't process if no session or already processing
    if (!sessionId || isProcessing || processingRef.current) {
      return;
    }

    // Find the oldest pending prompt (FIFO queue)
    const pendingPrompt = prompts
      .filter(p => p.status === 'pending')
      .sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis())[0];

    // No pending prompts or already processed this one
    if (!pendingPrompt || pendingPrompt.id === lastProcessedRef.current) {
      return;
    }

    // Check if API key is configured
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[useAIAgent] VITE_GEMINI_API_KEY not found. Agent is disabled.');
      return;
    }

    // Process the prompt
    const processPrompt = async () => {
      processingRef.current = true;
      setIsProcessing(true);
      lastProcessedRef.current = pendingPrompt.id;

      console.log(`[useAIAgent] Starting to process prompt: ${pendingPrompt.content}`);

      try {
        // Extract feature from prompt if present (format: "[Feature: XYZ] actual prompt")
        let currentFeature: string | undefined;
        let cleanPrompt = pendingPrompt.content;
        
        const featureMatch = pendingPrompt.content.match(/^\[Feature:\s*([^\]]+)\]\s*(.+)$/);
        if (featureMatch) {
          currentFeature = featureMatch[1];
          cleanPrompt = featureMatch[2];
          console.log(`[useAIAgent] Extracted feature: ${currentFeature}`);
        }

        const agent = new AIAgent(sessionId);
        await agent.processPrompt(pendingPrompt.id, cleanPrompt, currentFeature);
        
        toast({
          title: '✨ Code Generated!',
          description: 'AI agent has updated your code. Check the preview!',
        });
        
        console.log('[useAIAgent] Prompt processed successfully');
      } catch (error: any) {
        console.error('[useAIAgent] Error processing prompt:', error);
        
        toast({
          title: '❌ Agent Error',
          description: error.message || 'Failed to process prompt. Check console for details.',
          variant: 'destructive',
        });
      } finally {
        processingRef.current = false;
        setIsProcessing(false);
      }
    };

    processPrompt();
  }, [prompts, sessionId, isProcessing, toast]);

  return {
    isProcessing,
    hasApiKey: Boolean(import.meta.env.VITE_GEMINI_API_KEY),
  };
};

