import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useFirestoreFiles } from "@/hooks/useFirestoreFiles";
import { useState } from "react";
import { BookOpen, Code2 } from "lucide-react";

interface CodeViewerProps {
  sessionId: string;
  fileId: string | null;
}

const CodeViewer = ({ sessionId, fileId }: CodeViewerProps) => {
  const { files } = useFirestoreFiles(sessionId);
  const selectedFile = files.find(f => f.id === fileId);
  const [viewType, setViewType] = useState<"code" | "explain">("code");

  if (!fileId || !selectedFile) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground bg-background">
        <p className="font-mono text-sm">← Select a file to view code</p>
      </div>
    );
  }

  // Generate simple explanation based on file type
  const getExplanation = () => {
    const fileName = selectedFile.path;
    const content = selectedFile.content || '';
    
    if (fileName.includes('App.tsx') || fileName.includes('App.jsx')) {
      return {
        title: "Main Application Component",
        sections: [
          { 
            subtitle: "What is this file?",
            text: "This is the main React component of your application. Think of it as the 'heart' of your app - it controls what you see on the screen."
          },
          {
            subtitle: "What does it do?",
            text: "It defines the structure and appearance of your app's main page. The code inside describes what elements (like buttons, text, images) appear and how they look."
          },
          {
            subtitle: "Key parts:",
            text: "• The 'return' section contains what users will see\n• CSS classes control colors, spacing, and layout\n• Any interactive elements (buttons, forms) are defined here"
          }
        ]
      };
    } else if (fileName.includes('.css')) {
      return {
        title: "Styling & Design",
        sections: [
          {
            subtitle: "What is this file?",
            text: "This is a CSS (Cascading Style Sheet) file. It controls how things look - colors, sizes, spacing, animations, and layout."
          },
          {
            subtitle: "What does it do?",
            text: "It makes your app beautiful! Without CSS, everything would be plain black text on white background. CSS adds personality and style."
          },
          {
            subtitle: "Key concepts:",
            text: "• Colors and backgrounds make things visually appealing\n• Padding and margins create spacing\n• Fonts and sizes make text readable\n• Animations and effects add interactivity"
          }
        ]
      };
    } else if (fileName.includes('index')) {
      return {
        title: "Application Entry Point",
        sections: [
          {
            subtitle: "What is this file?",
            text: "This is where your React app starts running. Think of it as the 'power button' that turns on your application."
          },
          {
            subtitle: "What does it do?",
            text: "It tells the browser where to put your app on the page and starts React. You usually don't need to change this file."
          },
          {
            subtitle: "Technical note:",
            text: "It finds the HTML element with id='root' and renders your React app inside it."
          }
        ]
      };
    } else {
      return {
        title: "Code File",
        sections: [
          {
            subtitle: "What is this file?",
            text: `This is a ${selectedFile.language} file that contains code for your application.`
          },
          {
            subtitle: "Understanding the code:",
            text: "• Each line of code tells the computer what to do\n• Functions are reusable blocks of code\n• Comments (starting with //) explain what the code does\n• Variables store information your app needs"
          },
          {
            subtitle: "For non-coders:",
            text: "Don't worry if you don't understand every line! The important thing is that this code works together with other files to make your app function."
          }
        ]
      };
    }
  };

  const explanation = getExplanation();

  return (
    <div className="h-full flex flex-col bg-background">
      {/* File header with toggle */}
      <div className="px-4 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-retro-amber">{selectedFile.path}</span>
          <span className="text-xs text-muted-foreground">({selectedFile.language})</span>
        </div>
        
        <div className="flex items-center border border-border rounded overflow-hidden">
          <Button
            variant={viewType === "code" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewType("code")}
            className="h-6 rounded-none text-xs px-3 gap-1"
          >
            <Code2 className="w-3 h-3" />
            Code
          </Button>
          <Button
            variant={viewType === "explain" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewType("explain")}
            className="h-6 rounded-none text-xs px-3 gap-1"
          >
            <BookOpen className="w-3 h-3" />
            Explain
          </Button>
        </div>
      </div>

      {/* Content area */}
      <ScrollArea className="flex-1">
        {viewType === "code" ? (
          <pre className="p-4 font-mono text-xs leading-relaxed">
            <code>{selectedFile.content || '// No content'}</code>
          </pre>
        ) : (
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-retro-amber mb-2">{explanation.title}</h2>
              <p className="text-sm text-muted-foreground">Understanding this file in plain English</p>
            </div>
            
            {explanation.sections.map((section, idx) => (
              <div key={idx} className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">{section.subtitle}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {section.text}
                </p>
              </div>
            ))}

            <div className="mt-8 p-4 bg-retro-amber/10 border border-retro-amber/30 rounded-lg">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Tip:</strong> Click "Code" to see the actual code, or ask the AI assistant to explain specific parts you're curious about!
              </p>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default CodeViewer;

