import sdk from '@stackblitz/sdk';
import { useEffect, useRef, useState } from 'react';
import { useFirestoreFiles } from '@/hooks/useFirestoreFiles';

interface StackBlitzPreviewProps {
  sessionId: string;
  showEditor?: boolean; // true = show editor, false = preview only
}

const StackBlitzPreview = ({ sessionId, showEditor = false }: StackBlitzPreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const vmRef = useRef<any>(null);
  const { files } = useFirestoreFiles(sessionId);
  const [isReady, setIsReady] = useState(false);

  // Initial embed
  useEffect(() => {
    if (!containerRef.current || files.length === 0 || isReady) return;

    console.log('Initializing StackBlitz with files:', files);

    // Convert Firestore files to StackBlitz format
    const sbFiles: Record<string, string> = {};
    files.forEach(file => {
      if (file.type === 'file') {
        sbFiles[file.path] = file.content || '';
      }
    });

    // Ensure we have a package.json
    if (!sbFiles['package.json']) {
      sbFiles['package.json'] = JSON.stringify({
        name: 'vibe-code-app',
        version: '1.0.0',
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
        },
        scripts: {
          start: 'react-scripts start'
        }
      }, null, 2);
    }

    // Embed StackBlitz
    sdk.embedProject(
      containerRef.current,
      {
        title: 'VibeCode Project',
        description: 'AI-Generated Code',
        template: 'create-react-app',
        files: sbFiles,
      },
      {
        openFile: 'src/App.tsx',
        view: showEditor ? 'default' : 'preview',
        height: '100%',
        hideNavigation: !showEditor,
        hideDevTools: !showEditor,
        forceEmbedLayout: true,
        hideExplorer: true,
        terminalHeight: 0,
      }
    ).then(vm => {
      vmRef.current = vm;
      setIsReady(true);
      console.log('StackBlitz VM ready');
    }).catch(err => {
      console.error('StackBlitz embed error:', err);
    });
  }, [files, isReady]);

  // Update files when Firestore changes
  useEffect(() => {
    if (!vmRef.current || !isReady || files.length === 0) return;

    console.log('Updating StackBlitz files from Firestore');
    
    files.forEach(file => {
      if (file.type === 'file' && file.content) {
        try {
          vmRef.current.applyFsDiff({
            create: { [file.path]: file.content },
            destroy: []
          });
        } catch (err) {
          console.error('Error updating file:', file.path, err);
        }
      }
    });
  }, [files, isReady]);

  if (files.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background text-muted-foreground">
        <p className="font-mono text-sm">Waiting for files from Firestore...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* StackBlitz container - slightly taller to push footer down */}
      <div ref={containerRef} className="w-full h-[calc(100%+60px)] bg-white" />
      
      {/* Cover the bottom 60px where StackBlitz footer appears */}
      <div className="absolute bottom-0 left-0 right-0 h-[60px] bg-background pointer-events-none" />
    </div>
  );
};

export default StackBlitzPreview;

