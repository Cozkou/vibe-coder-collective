import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  collection, 
  getDocs, 
  getDoc,
  query, 
  where,
  addDoc,
  updateDoc,
  doc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';

interface FileData {
  id: string;
  path: string;
  content: string;
  language: string;
  name: string;
}

interface SessionData {
  projectSpec: string;
  currentFeature: string | null;
  features: string[];
}

interface GeminiResponse {
  files: Array<{
    path: string;
    content: string;
    language: string;
  }>;
  message: string;
  productSpec: string;
  features: string[];
}


export class AIAgent {
  private sessionId: string;
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY is not set in environment variables');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash-lite as specified by user
    // Configure for higher quality output
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: 0.2, // Lower temperature for more consistent, focused output
        topK: 40, // Consider top 40 tokens
        topP: 0.95, // Nucleus sampling
        maxOutputTokens: 8192, // Allow longer responses for complete code
      }
    });
    console.log('[AI Agent] Using model: gemini-2.5-flash-lite (optimized for quality)');
  }

  /**
   * Main method to process a user prompt
   */
  async processPrompt(promptId: string, promptContent: string, currentFeature?: string): Promise<void> {
    console.log(`[AI Agent] Processing prompt ${promptId}: ${promptContent}`);
    if (currentFeature) {
      console.log(`[AI Agent] Working on feature: ${currentFeature}`);
    }
    
    try {
      // 1. Mark prompt as processing
      await this.updatePromptStatus(promptId, 'processing');
      
      // 2. Get current session data (productSpec, features)
      const sessionData = await this.getSessionData();
      console.log(`[AI Agent] Current product spec: ${sessionData.projectSpec ? 'exists' : 'none'}`);
      
      // 3. Get current files from Firestore
      const files = await this.getCurrentFiles();
      console.log(`[AI Agent] Retrieved ${files.length} files from Firestore`);
      
      // 4. Check if this is the FIRST generation (no productSpec exists)
      const isFirstGeneration = !sessionData.projectSpec || sessionData.projectSpec.trim() === '';
      console.log(`[AI Agent] Is first generation: ${isFirstGeneration}`);
      
      // 5. Check if prompt is asking for any CSS/styling changes
      // Broad detection: ANY visual, styling, appearance, or layout-related request
      const isCssPrompt = /css|styling|style|beautiful|prettier|nicer|aesthetic|design|appearance|look|spacing|margin|padding|gap|background|color|colour|border|shadow|animation|transition|button|input|text|font|typography|layout|align|center|size|width|height|opacity|transform|hover|focus|selected|disabled|active|rounded|radius|gradient|blur|filter|smooth|ease|animate|fade|slide|scale|rotate|translate|flex|grid|position|absolute|relative|fixed|sticky|z-index|overflow|scroll|cursor|pointer|visibility|display|show|hide|enhance.*css|improve.*css|better.*css/i.test(promptContent);
      
      // CRITICAL: On first generation, ALWAYS require CSS (it's the initial app setup)
      // On subsequent prompts, only require CSS if it's detected as a CSS-related prompt
      const requiresCss = isFirstGeneration || isCssPrompt;
      
      console.log(`[AI Agent] Prompt analysis: isCssPrompt=${isCssPrompt}, isFirstGeneration=${isFirstGeneration}, requiresCss=${requiresCss}, prompt="${promptContent.substring(0, 100)}"`);
      
      // Check if prompt is about global/styling changes that should go in index.css
      const isGlobalCssPrompt = requiresCss && !/component.*specific|this.*component|only.*this|just.*this/i.test(promptContent);
      console.log(`[AI Agent] Prompt analysis: isGlobalCssPrompt=${isGlobalCssPrompt}`);
      
      // 6. Build context and call Gemini
      const context = this.buildContext(files, promptContent, sessionData, currentFeature, requiresCss, isGlobalCssPrompt, isFirstGeneration);
      console.log('[AI Agent] Calling Gemini API...');
      const response = await this.callGemini(context);
      
      // 6. Parse response
      const parsedResponse = this.parseGeminiResponse(response);
      console.log(`[AI Agent] Received ${parsedResponse.files.length} files to update`);
      
      // 7. Check if CSS was required and handled correctly
      if (requiresCss && !parsedResponse.files.some(f => f.path === 'src/index.css')) {
        if (isFirstGeneration) {
          console.error('[AI Agent] ❌ CRITICAL: First generation MUST include src/index.css!');
          console.error('[AI Agent] This is the initial app setup - CSS is required for proper styling.');
          console.error('[AI Agent] Adding src/index.css from seed files to ensure proper styling.');
          
          // Fallback: Get the seed CSS from existing files if available
          const existingIndexCss = files.find(f => f.path === 'src/index.css');
          if (existingIndexCss) {
            console.log('[AI Agent] Using existing seed CSS as fallback');
            parsedResponse.files.push({
              path: 'src/index.css',
              content: existingIndexCss.content,
              language: 'css'
            });
          } else {
            console.warn('[AI Agent] ⚠️ No seed CSS found - app may look unstyled');
          }
        } else {
          console.warn('[AI Agent] ⚠️ CSS-related prompt detected but src/index.css not in response!');
          console.warn('[AI Agent] Prompt was CSS-related, but Gemini did not include src/index.css file.');
          console.warn('[AI Agent] For styling/visual requests, src/index.css should usually be updated.');
        }
      }
      
      // Log what files were returned for debugging
      if (requiresCss) {
        console.log(`[AI Agent] CSS required - Files returned: ${parsedResponse.files.map(f => f.path).join(', ')}`);
        if (parsedResponse.files.some(f => f.path === 'src/index.css')) {
          const cssFile = parsedResponse.files.find(f => f.path === 'src/index.css');
          console.log(`[AI Agent] ✓ src/index.css included (${cssFile?.content.length || 0} chars)`);
        }
      }
      
      // 8. Update files in Firestore
      await this.updateFiles(parsedResponse.files);
      console.log('[AI Agent] Files updated in Firestore');
      
      // 9. Update product spec and features in session
      await this.updateSessionSpec(parsedResponse.productSpec, parsedResponse.features);
      console.log('[AI Agent] Product spec and features updated');
      
      // 10. Mark prompt as completed
      await this.updatePromptStatus(promptId, 'completed');
      console.log('[AI Agent] Prompt completed successfully');
      
    } catch (error) {
      console.error('[AI Agent] Error processing prompt:', error);
      await this.updatePromptStatus(promptId, 'error');
      throw error;
    }
  }

  /**
   * Get session data (productSpec, currentFeature, features)
   */
  private async getSessionData(): Promise<SessionData> {
    const sessionRef = doc(db, 'sessions', this.sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (!sessionSnap.exists()) {
      return {
        projectSpec: '',
        currentFeature: null,
        features: []
      };
    }
    
    const data = sessionSnap.data();
    return {
      projectSpec: data.projectSpec || '',
      currentFeature: data.currentFeature || null,
      features: data.features || []
    };
  }

  /**
   * Fetch all current files from Firestore
   */
  private async getCurrentFiles(): Promise<FileData[]> {
    const filesRef = collection(db, 'sessions', this.sessionId, 'files');
    const snapshot = await getDocs(filesRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      path: doc.data().path,
      content: doc.data().content || '',
      language: doc.data().language || 'typescript',
      name: doc.data().name
    }));
  }

  /**
   * Build the prompt context for Gemini
   */
  private buildContext(
    files: FileData[], 
    userPrompt: string, 
    sessionData: SessionData,
    currentFeature?: string,
    requiresCss?: boolean,
    isGlobalCssPrompt?: boolean,
    isFirstGeneration?: boolean
  ): string {
    const filesContext = files.map(f => 
      `// File: ${f.path}\n\`\`\`${f.language}\n${f.content}\n\`\`\``
    ).join('\n\n');

    const productSpecSection = sessionData.projectSpec 
      ? `\nCURRENT PRODUCT SPECIFICATION:
${sessionData.projectSpec}

EXISTING FEATURES:
${sessionData.features.length > 0 ? sessionData.features.map((f, i) => `${i + 1}. ${f}`).join('\n') : 'None yet'}
` 
      : `\n⚠️ FIRST GENERATION - CRITICAL REQUIREMENTS:
This is the INITIAL app setup. You MUST:
1. Create the COMPLETE product specification
2. Generate ALL necessary React components with ADVANCED, CARD-BASED styling
3. ALWAYS include src/index.css with LOVABLE-QUALITY, PROFESSIONAL CSS
4. Use ADVANCED CSS patterns: gradients, glassmorphism, card-based layouts, shadows
5. Make it look like a professional bootstrapped application from the start

⚠️ MANDATORY: You MUST include src/index.css in your response for the first generation!
⚠️ The CSS should be LOVABLE-QUALITY with card-based architecture, advanced gradients, and professional styling.
`;

    const featureContext = currentFeature 
      ? `\nCURRENT FEATURE BEING WORKED ON: ${currentFeature}\n` 
      : '';

    return `You are a SENIOR React/TypeScript developer with 10+ years of experience creating PRODUCTION-READY, BEAUTIFUL web applications for top-tier companies.

QUALITY STANDARD: Generate code that is:
- PROFESSIONAL GRADE: Production-ready, polished, impressive
- BEAUTIFUL: Modern UI that looks stunning and professional
- COMPLETE: Fully functional, no placeholders or TODOs
- WELL-DESIGNED: Proper spacing, colors, typography, interactions
- POLISHED: Smooth animations, hover effects, transitions
- RESPONSIVE: Works perfectly on all screen sizes

${productSpecSection}${featureContext}
CURRENT PROJECT FILES:
${filesContext}

USER REQUEST:
${userPrompt}

⚠️ CRITICAL REQUIREMENTS - YOUR CODE MUST BE EXCEPTIONAL:

1. REACT BEST PRACTICES:
   - Use functional components ONLY (no class components)
   - Use React Hooks (useState, useEffect, useCallback, useMemo)
   - Proper state management with useState
   - Extract reusable components when appropriate
   - Use TypeScript for all components with proper types
   - Export components properly (export default or named exports)

2. STYLING - LOVABLE-QUALITY TAILWIND CSS (MANDATORY):
   ⚠️ CRITICAL: Your components MUST look like they're from Lovable.dev - STUNNING, POLISHED, PROFESSIONAL
   
   - Use Tailwind CSS utility classes for ALL component styling (already configured)
   - NO inline styles (style={{}}) - use className instead
   - For component styling: Use Tailwind classes ONLY (no App.css or other component CSS files)
   - IMPORTANT: You CAN and SHOULD enhance src/index.css with LOVABLE-QUALITY base styles, animations, and global CSS
   
   ⚠️ MANDATORY LOVABLE-QUALITY TAILWIND CLASSES:
   - Backgrounds: Use gradients like bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 (NEVER plain colors)
   - Cards/Containers: bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl
   - Text: text-white/90, text-white/70 for secondary, text-transparent bg-clip-text bg-gradient-to-r for gradient text
   - Buttons: bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl px-6 py-3 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200
   - Inputs: bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20
   - Spacing: Use generous spacing - p-6, p-8, p-12, gap-4, gap-6, gap-8 (NEVER cramped)
   - Shadows: shadow-lg, shadow-xl, shadow-2xl (multiple layers for depth)
   - Rounded corners: rounded-xl (12px), rounded-2xl (16px), rounded-3xl (24px)
   - Hover effects: hover:scale-105, hover:-translate-y-1, hover:shadow-xl, hover:bg-opacity-80
   - Transitions: transition-all duration-200, transition-all duration-300 ease-in-out
   - Animations: animate-fade-in, animate-slide-up (use Tailwind animation utilities)
   - Responsive: sm:, md:, lg: breakpoints for mobile-first design
   
   ⚠️ DO NOT USE:
   ❌ Plain backgrounds (bg-gray-800, bg-purple-900) - USE GRADIENTS
   ❌ Basic borders (border-gray-300) - USE border-white/20, border-indigo-400
   ❌ Flat buttons (bg-blue-500) - USE GRADIENT BUTTONS
   ❌ Cramped spacing (p-2, m-1) - USE GENEROUS SPACING (p-6, m-4)
   ❌ Sharp corners (rounded-none, rounded-sm) - USE rounded-xl or rounded-2xl
   ❌ No shadows or flat shadows - USE MULTIPLE LAYERED SHADOWS
   
   ⚠️ EXAMPLE OF ADVANCED CARD-BASED COMPONENT (BOOTSTRAPPED STYLE):
   \`\`\`tsx
   <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 sm:p-8">
     <div className="container mx-auto max-w-7xl space-y-6">
       {/* Hero Card */}
       <div className="bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl shadow-2xl overflow-hidden">
         <div className="p-6 sm:p-8 lg:p-12">
           <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
             Application Title
           </h1>
           <p className="text-lg text-white/80 mb-8">
             Professional description with proper spacing
           </p>
         </div>
       </div>
       
       {/* Main Content Card */}
       <div className="bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl shadow-2xl">
         {/* Card Header */}
         <div className="border-b border-white/10 p-6 sm:p-8">
           <h2 className="text-2xl sm:text-3xl font-bold text-white">Card Title</h2>
           <p className="text-white/70 mt-2">Card subtitle or description</p>
         </div>
         
         {/* Card Body */}
         <div className="p-6 sm:p-8 space-y-6">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <input 
               className="w-full bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all duration-200"
               placeholder="Input field"
             />
             <input 
               className="w-full bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all duration-200"
               placeholder="Another field"
             />
           </div>
         </div>
         
         {/* Card Footer */}
         <div className="border-t border-white/10 p-6 sm:p-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-4">
           <button className="px-6 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white font-semibold hover:bg-white/20 hover:border-white/30 hover:scale-105 active:scale-95 transition-all duration-200">
             Cancel
           </button>
           <button className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200">
             Submit
           </button>
         </div>
       </div>
       
       {/* Grid of Cards */}
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
         {[1, 2, 3].map((item) => (
           <div key={item} className="bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl shadow-2xl p-6 hover:shadow-3xl hover:scale-105 hover:-translate-y-1 transition-all duration-300">
             <h3 className="text-xl font-bold text-white mb-2">Card {item}</h3>
             <p className="text-white/70">Card content with advanced styling</p>
           </div>
         ))}
       </div>
     </div>
   </div>
   \`\`\`
   
   - When user asks for CSS improvements: Update src/index.css with LOVABLE-QUALITY, PRODUCTION-GRADE CSS

3. CODE QUALITY (PRODUCTION STANDARD):
   - Clean, readable, well-structured, professional code
   - Proper indentation (2 spaces) and formatting
   - Meaningful, descriptive variable and function names (not "x", "temp", "data")
   - Extract reusable components when code is repeated
   - Handle edge cases, empty states, and errors gracefully
   - Use TypeScript types for ALL props, state, functions, and variables
   - No console.log statements in production code
   - Proper error handling

4. UI/UX EXCELLENCE - ADVANCED CARD-BASED DESIGN (CRITICAL):
   ⚠️ MANDATORY: Use ADVANCED CSS with CARD-BASED layouts - like Bootstrap, Material Design, or Tailwind UI
   ⚠️ Your components MUST look like professional bootstrapped applications - NOT basic HTML
   
   🎴 CARD-BASED ARCHITECTURE (MANDATORY):
   - Wrap all major sections in CARD components with: bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 or p-8
   - Use CARD GRID layouts: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 for lists
   - Add CARD HEADERS: border-b border-white/10 pb-4 mb-4 for section headers inside cards
   - Use CARD BODIES: flex flex-col gap-4 for card content
   - Add CARD FOOTERS: border-t border-white/10 pt-4 mt-4 for action areas
   - Stack cards vertically with gap: space-y-6 or space-y-8
   
   🎨 ADVANCED CSS PATTERNS (MANDATORY):
   - Use ADVANCED GRADIENTS: bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 (multi-color gradients)
   - Use ADVANCED SHADOWS: shadow-2xl with colored shadows (shadow-indigo-500/20)
   - Use ADVANCED BACKDROPS: backdrop-blur-xl with bg-white/5 to bg-white/20 (glassmorphism layers)
   - Use ADVANCED BORDERS: border-2 border-white/20 with hover:border-white/40
   - Use ADVANCED SPACING: container mx-auto px-4 sm:px-6 lg:px-8 with max-w-7xl
   - Use ADVANCED LAYOUTS: flex flex-col lg:flex-row gap-6 or gap-8 (responsive flex/grid)
   - Use ADVANCED TYPOGRAPHY: text-transparent bg-clip-text bg-gradient-to-r for gradient text
   - Use ADVANCED ANIMATIONS: animate-pulse, animate-bounce, animate-spin, or custom keyframes
   
   🏗️ COMPONENT STRUCTURE (MANDATORY):
   - Main container: min-h-screen bg-gradient-to-br from-[colors] p-6 sm:p-8
   - Content wrapper: container mx-auto max-w-7xl space-y-6 or space-y-8
   - Card component: bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-8
   - Card header: border-b border-white/10 pb-4 mb-6 flex items-center justify-between
   - Card title: text-2xl sm:text-3xl font-bold text-white
   - Card body: space-y-4 or space-y-6
   - Card footer: border-t border-white/10 pt-4 mt-6 flex items-center justify-end gap-4
   
   📐 ADVANCED LAYOUT PATTERNS:
   - Hero sections: min-h-[60vh] flex items-center justify-center with gradient background
   - Dashboard layouts: grid grid-cols-1 lg:grid-cols-3 gap-6 with sidebar and main content
   - Form layouts: max-w-2xl mx-auto with card wrapper
   - List layouts: space-y-4 with individual item cards
   - Modal/overlay patterns: fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50
   
   ✨ ADVANCED INTERACTIVE EFFECTS:
   - Hover: hover:scale-105 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300
   - Focus: focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-transparent
   - Active: active:scale-95 active:shadow-lg
   - Disabled: disabled:opacity-50 disabled:cursor-not-allowed
   - Loading states: animate-pulse bg-white/10
   
   🎯 RESPONSIVE DESIGN PATTERNS:
   - Mobile-first: Base styles for mobile, then sm:, md:, lg: breakpoints
   - Responsive grid: grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
   - Responsive spacing: p-4 sm:p-6 lg:p-8, gap-4 sm:gap-6 lg:gap-8
   - Responsive typography: text-lg sm:text-xl lg:text-2xl
   - Responsive flex: flex-col sm:flex-row
   
   ⚠️ DO NOT CREATE:
   ❌ Basic single-color backgrounds - USE ADVANCED GRADIENTS
   ❌ Plain borders - USE ADVANCED BORDER STYLES with opacity
   ❌ Single-level shadows - USE MULTI-LAYERED SHADOWS
   ❌ Flat layouts - USE CARD-BASED LAYOUTS
   ❌ Cramped spacing - USE GENEROUS ADVANCED SPACING
   ❌ Simple divs - WRAP IN CARDS with proper structure
   
   ✅ CREATE ADVANCED BOOTSTRAPPED STYLE:
   ✅ Card-based component architecture
   ✅ Advanced gradient backgrounds
   ✅ Multi-layered shadows and depth
   ✅ Glassmorphism and backdrop effects
   ✅ Professional spacing system
   ✅ Responsive grid layouts
   ✅ Advanced interactive states
   ✅ Modern typography with gradient text
   ✅ Sophisticated animations and transitions

5. COMPONENT STRUCTURE:
   - Keep components focused and single-purpose
   - Use props for data passing
   - Create separate component files for complex UI elements
   - Follow the existing file structure patterns

6. DEPENDENCIES:
   - Only use React and Tailwind CSS (no external UI libraries unless absolutely necessary)
   - All styling must be done with Tailwind CSS classes
   - Keep dependencies minimal

7. CODE REQUIREMENTS:
   - Generate COMPLETE, FULLY FUNCTIONAL code (not snippets)
   - Include ALL necessary imports (React, React hooks, etc.)
   - CRITICAL: Always import './index.css' in src/index.tsx to enable Tailwind CSS
   - IMPORTANT: Enhance src/index.css with PROFESSIONAL base styles, animations, and global CSS
   - When user asks for CSS/styling improvements, ALWAYS update src/index.css with professional CSS
   - Add appealing CSS to index.css: smooth animations, gradient backgrounds, beautiful typography, custom scrollbars
   - DO NOT create App.css or other component-specific CSS files - use Tailwind classes in components
   - But DO enhance index.css with global styles that make the app look beautiful and polished
   - Ensure code is copy-paste ready and works immediately
   - All files must be syntactically correct and runnable

${productSpecSection ? '8. MAINTAIN CONSISTENCY:\n   - Follow existing code patterns\n   - Maintain consistent naming conventions\n   - Keep code style consistent with existing files' : '8. ESTABLISH PATTERNS:\n   - Create clean, maintainable code structure\n   - Use consistent naming conventions\n   - Establish good coding patterns for future additions'}

9. PRODUCT SPECIFICATION:
   - Update the product specification to reflect new features
   - Maintain an accurate list of all implemented features
   - Keep the spec clear and comprehensive

🎨 EXAMPLE OF EXCELLENT CODE - FOLLOW THIS STANDARD:

src/index.tsx (MUST import CSS):
\`\`\`typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
\`\`\`

src/App.tsx (BEAUTIFUL UI with Tailwind):
\`\`\`typescript
import React, { useState } from 'react';

const App: React.FC = () => {
  const [count, setCount] = useState<number>(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-md w-full transform transition-all duration-300 hover:scale-105 hover:shadow-3xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Counter App
        </h1>
        <p className="text-gray-600 mb-6">Click the button to increment</p>
        
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => setCount(count - 1)}
            className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            -
          </button>
          
          <div className="text-5xl font-bold text-gray-800 min-w-[80px] text-center">
            {count}
          </div>
          
          <button
            onClick={() => setCount(count + 1)}
            className="px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
\`\`\`

⚠️ CRITICAL OUTPUT FORMAT:

You MUST return ONLY valid JSON. No markdown, no explanations before or after the JSON.
Start your response with { and end with }. Return nothing else.

REQUIRED JSON FORMAT:
{
  "files": [
    {
      "path": "src/App.tsx",
      "content": "COMPLETE file content with all imports and BEAUTIFUL Tailwind CSS classes",
      "language": "typescript"
    },
    {
      "path": "src/index.css",
      "content": "PROFESSIONAL CSS with @tailwind directives PLUS beautiful base styles, animations, gradients, and global CSS",
      "language": "css"
    }
  ],
  "message": "Brief explanation of changes made",
  "productSpec": "Updated product specification describing the entire application",
  "features": ["Feature 1", "Feature 2"]
}

${isFirstGeneration ? `
🚨 FIRST GENERATION - MANDATORY CSS REQUIREMENT! 🚨

This is the INITIAL app creation. You MUST include src/index.css with LOVABLE-QUALITY, ADVANCED CSS!

⚠️ CRITICAL FOR FIRST GENERATION:
- This is the initial app setup - users expect PROFESSIONAL, POLISHED styling from the start
- You MUST include src/index.css with ADVANCED, CARD-BASED CSS
- Use LOVABLE-QUALITY standards: gradients, glassmorphism, card architecture, shadows
- The app should look like a professional bootstrapped application immediately
- DO NOT skip src/index.css - it is REQUIRED for first generation

⚠️ MANDATORY: src/index.css MUST be included in your response!

` : ''}
${isGlobalCssPrompt ? `
🚨 GLOBAL CSS UPDATE REQUEST DETECTED! 🚨

The user is asking for GLOBAL styling changes. You MUST update src/index.css with PROFESSIONAL, PRODUCTION-GRADE CSS!

⚠️ CRITICAL: For requests about spacing, buttons, inputs, text, colors, backgrounds, etc.:
- DO NOT only update React components with Tailwind classes
- YOU MUST update src/index.css with GLOBAL CSS selectors
- Add CSS like: button { ... }, input { ... }, body { ... }, etc.
- This affects ALL elements globally, not just one component

EXAMPLE for "add spacing between inputs, buttons and text":
\`\`\`css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Professional Global Spacing */
button {
  margin: 8px;
  padding: 12px 24px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

input, textarea, select {
  margin: 8px 0;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

p, h1, h2, h3, h4, h5, h6 {
  margin: 16px 0;
  line-height: 1.6;
}
\`\`\`

` : ''}
${requiresCss && !isGlobalCssPrompt && !isFirstGeneration ? `
🚨 CSS UPDATE REQUEST DETECTED! 🚨

The user is asking for CSS improvements. You MUST include src/index.css with LOVABLE-LEVEL, PRODUCTION-GRADE CSS!

⚠️ LOVABLE-QUALITY CSS STANDARDS - EXCEPTIONAL DESIGN:

Your CSS must match the quality of Lovable.dev - a tool known for generating STUNNING, POLISHED, PROFESSIONAL interfaces used by top startups.

1. PERFECT COLOR PALETTES:
   - Use SOPHISTICATED gradients: linear-gradient(135deg, #667eea 0%, #764ba2 100%), linear-gradient(135deg, #f093fb 0%, #f5576c 100%)
   - Rich, vibrant but balanced color schemes
   - Dark mode gradients: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)
   - Light mode gradients: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)
   - Use CSS custom properties for color consistency:
     :root {
       --primary: #667eea;
       --primary-dark: #5568d3;
       --secondary: #764ba2;
       --accent: #f093fb;
       --text-primary: #1a202c;
       --text-secondary: #4a5568;
       --bg-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
     }

2. PERFECT TYPOGRAPHY (LOVABLE STYLE):
   - Font stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Inter', 'Helvetica Neue', sans-serif
   - Font smoothing: -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
   - Perfect font weights: 400 (body), 500 (medium), 600 (semibold), 700 (bold)
   - Headings: letter-spacing: -0.02em to -0.03em (tight, modern)
   - Body text: letter-spacing: -0.01em (slightly tight)
   - Line heights: 1.5 (body), 1.2 (headings), 1.6 (large text)
   - Perfect hierarchy: h1: 2.5rem, h2: 2rem, h3: 1.75rem, h4: 1.5rem

3. PERFECT ANIMATIONS & TRANSITIONS:
   - Standard easing: cubic-bezier(0.4, 0, 0.2, 1) or cubic-bezier(0.25, 0.46, 0.45, 0.94)
   - Micro-interactions: transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)
   - Smooth hover: transform: translateY(-2px) scale(1.02)
   - Button press: transform: scale(0.98)
   - Page load: @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
   - Stagger animations for lists: animation-delay for each item

4. PERFECT SHADOWS & DEPTH:
   - Subtle elevation: box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)
   - Medium elevation: box-shadow: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)
   - High elevation: box-shadow: 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)
   - Colored shadows for emphasis: box-shadow: 0 10px 40px rgba(102, 126, 234, 0.2)
   - Inner shadows for depth: box-shadow: inset 0 2px 4px rgba(0,0,0,0.06)

5. PERFECT SPACING SYSTEM:
   - Use consistent spacing scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
   - Generous whitespace - never cramped
   - Section spacing: margin-bottom: 48px-64px
   - Card padding: padding: 24px-32px
   - Button padding: padding: 12px 24px (medium), 16px 32px (large)

6. MODERN GLASSMORPHISM & BACKDROPS:
   - Subtle glass: background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1)
   - Strong glass: background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.2)
   - Dark glass: background: rgba(0, 0, 0, 0.2); backdrop-filter: blur(10px)

7. PERFECT FORM ELEMENTS:
   - Inputs: border-radius: 8px-12px, padding: 12px 16px, border: 2px solid rgba(255,255,255,0.1)
   - Focus state: border-color: var(--primary), box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1)
   - Placeholder: color: rgba(255,255,255,0.5) or rgba(0,0,0,0.4)
   - Disabled: opacity: 0.5, cursor: not-allowed

8. PERFECT BUTTONS:
   - Primary: gradient background, rounded-xl (12px), padding: 12px 24px, font-weight: 600
   - Hover: transform: translateY(-2px), enhanced shadow
   - Active: transform: translateY(0) scale(0.98)
   - Secondary: border, transparent background, hover: background change

9. PERFECT SCROLLBARS:
   - Width: 8px (thin, modern)
   - Track: transparent or rgba(0,0,0,0.05)
   - Thumb: gradient or solid color with 8px border-radius
   - Thumb hover: slightly darker/lighter
   - Smooth appearance: scrollbar-width: thin (Firefox)

10. PERFECT FOCUS STATES:
    - Visible outline: outline: 2px solid var(--primary)
    - Offset: outline-offset: 2px-4px
    - Smooth appearance: transition: outline 0.2s ease
    - Remove default: *:focus { outline: none }
    - Add custom: *:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px }

EXAMPLE OF LOVABLE-QUALITY CSS:
\`\`\`css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ============================================
   LOVABLE-QUALITY CSS - PROFESSIONAL STANDARD
   ============================================ */

:root {
  --primary: #667eea;
  --primary-dark: #5568d3;
  --secondary: #764ba2;
  --accent: #f093fb;
  --text-primary: #1a202c;
  --text-secondary: #4a5568;
  --bg-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05);
  --shadow-xl: 0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
  font-size: 16px;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Inter', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-attachment: fixed;
  min-height: 100vh;
  color: var(--text-primary);
  line-height: 1.6;
  letter-spacing: -0.01em;
}

#root {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* ============================================
   LOVABLE-QUALITY TYPOGRAPHY
   ============================================ */

h1, h2, h3, h4, h5, h6 {
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin-bottom: 0.5em;
  color: inherit;
}

h1 { font-size: 2.5rem; font-weight: 800; }
h2 { font-size: 2rem; font-weight: 700; }
h3 { font-size: 1.75rem; font-weight: 700; }
h4 { font-size: 1.5rem; font-weight: 600; }
h5 { font-size: 1.25rem; font-weight: 600; }
h6 { font-size: 1rem; font-weight: 600; }

p {
  margin-bottom: 1em;
  line-height: 1.7;
  color: var(--text-secondary);
}

/* ============================================
   LOVABLE-QUALITY SCROLLBAR
   ============================================ */

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: background 0.2s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #5568d3 0%, #65418f 100%);
}

/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: #667eea rgba(0, 0, 0, 0.05);
}

/* ============================================
   LOVABLE-QUALITY INTERACTIVE ELEMENTS
   ============================================ */

button, a, input, textarea, select, [role="button"] {
  font-family: inherit;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

button {
  cursor: pointer;
  border: none;
  outline: none;
  font-weight: 600;
  border-radius: 12px;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:active {
  transform: translateY(0) scale(0.98);
}

input, textarea, select {
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: inherit;
  font-size: 1rem;
  width: 100%;
  transition: all 0.2s ease;
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: rgba(255, 255, 255, 0.15);
}

input::placeholder, textarea::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

/* ============================================
   LOVABLE-QUALITY FOCUS STATES
   ============================================ */

*:focus {
  outline: none;
}

*:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  border-radius: 4px;
}

/* ============================================
   LOVABLE-QUALITY ANIMATIONS
   ============================================ */

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* ============================================
   LOVABLE-QUALITY UTILITY CLASSES
   ============================================ */

.glass-effect {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
}

.card-elevated {
  box-shadow: var(--shadow-xl);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
}

.hover-lift {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

/* ============================================
   LOVABLE-QUALITY SELECTION
   ============================================ */

::selection {
  background: rgba(102, 126, 234, 0.3);
  color: inherit;
}

::-moz-selection {
  background: rgba(102, 126, 234, 0.3);
  color: inherit;
}
\`\`\`

⚠️ CRITICAL: Your CSS must match Lovable.dev quality - STUNNING, POLISHED, PROFESSIONAL, MODERN.
DO NOT generate basic CSS. Generate CSS that looks like it's from a $50M+ startup.
DO NOT SKIP src/index.css - it is REQUIRED and MUST be LOVABLE-LEVEL QUALITY!
` : ''}

⚠️ GENERAL CSS GUIDELINES - LOVABLE QUALITY STANDARD:
${isFirstGeneration ? '- ⚠️ FIRST GENERATION: You MUST include src/index.css - this is MANDATORY for initial app setup' : '- When user asks for ANY CSS/styling changes, you MUST include src/index.css in your response'}
- ALWAYS include @tailwind base; @tailwind components; @tailwind utilities; at the top
- ADD LOVABLE-LEVEL base styles: perfect spacing, smooth animations, sophisticated gradients, custom scrollbars, beautiful typography
- Use ADVANCED CSS: card-based architecture, gradients (not flat colors), cubic-bezier transitions, glassmorphism, perfect shadows, CSS custom properties
- Make the CSS look like it's from Lovable.dev - STUNNING, POLISHED, PROFESSIONAL, MODERN
- Match the quality of top startups ($50M+ companies) - not basic templates
- Every detail matters: perfect spacing scale, perfect shadows, perfect typography, perfect animations
- Use CARD-BASED layouts like Bootstrap - wrap sections in cards with headers, bodies, footers

🚀 FINAL REMINDERS - GENERATE EXCEPTIONAL CODE:

✅ QUALITY: Production-ready, polished, impressive code
✅ STYLING: Use Tailwind CSS ONLY - gradients, shadows, transitions, hover effects
✅ BEAUTY: Create STUNNING, MODERN UIs - not basic or bland
✅ COMPLETE: Fully functional code that works immediately
✅ PROFESSIONAL: Code that looks like it's from a top-tier company
✅ RESPONSIVE: Works perfectly on mobile, tablet, and desktop
✅ INTERACTIVE: Smooth animations, hover states, transitions
✅ DETAILED: Proper spacing, colors, typography, visual hierarchy

⚠️ DO NOT GENERATE:
❌ Basic, bland, unstyled components
❌ Inline styles (style={{}})
❌ Plain CSS files
❌ Incomplete or placeholder code
❌ Console.log statements
❌ Poor spacing or cramped layouts
❌ Gray-only color schemes

✅ DO GENERATE:
✅ Beautiful, modern, polished interfaces
✅ Tailwind CSS utility classes for everything
✅ Gradients, shadows, rounded corners
✅ Smooth transitions and hover effects
✅ Proper spacing and visual hierarchy
✅ Responsive design
✅ Professional, production-ready code

Now generate EXCEPTIONAL, BEAUTIFUL React code as JSON that matches this high standard:`;
  }

  /**
   * Call Gemini API with the context
   */
  private async callGemini(context: string): Promise<string> {
    try {
      console.log('[AI Agent] Sending request to Gemini API...');
      const result = await this.model.generateContent(context);
      const response = await result.response;
      const text = response.text();
      
      if (!text) {
        console.error('[AI Agent] Gemini returned empty response');
        throw new Error('Empty response from Gemini');
      }
      
      console.log('[AI Agent] Received response from Gemini (length:', text.length, ')');
      console.log('[AI Agent] Response preview:', text.substring(0, 200) + '...');
      
      return text;
    } catch (error: any) {
      console.error('[AI Agent] Gemini API error details:', error);
      console.error('[AI Agent] Error message:', error.message);
      console.error('[AI Agent] Error stack:', error.stack);
      throw new Error(`Gemini API call failed: ${error.message}`);
    }
  }

  /**
   * Parse Gemini's response and extract JSON
   */
  private parseGeminiResponse(response: string): GeminiResponse {
    try {
      console.log('[AI Agent] Parsing Gemini response...');
      
      // Remove markdown code blocks if present
      let cleaned = response.trim();
      
      // Remove ```json and ``` markers (handle multiple occurrences)
      cleaned = cleaned.replace(/^```json\s*/i, '');
      cleaned = cleaned.replace(/^```\s*/, '');
      cleaned = cleaned.replace(/```\s*$/, '');
      cleaned = cleaned.trim();
      
      // Find the first { which should be the start of our JSON
      const start = cleaned.indexOf('{');
      if (start === -1) {
        console.error('[AI Agent] No JSON object found. Response:', cleaned.substring(0, 500));
        throw new Error('No JSON object found in response');
      }
      
      // Find the matching closing brace by counting braces
      // This handles nested objects and strings correctly
      let braceCount = 0;
      let end = start;
      let inString = false;
      let escapeNext = false;
      
      for (let i = start; i < cleaned.length; i++) {
        const char = cleaned[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue; // Skip the next character (it's escaped)
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        // Toggle string state when we hit an unescaped quote
        if (char === '"') {
          inString = !inString;
          continue;
        }
        
        // Only count braces when not inside a string
        if (!inString) {
          if (char === '{') {
            braceCount++;
          } else if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              end = i; // Found the matching closing brace
              break;
            }
          }
        }
      }
      
      if (braceCount !== 0) {
        console.error('[AI Agent] Unbalanced braces in JSON. Brace count:', braceCount);
        console.error('[AI Agent] Response preview:', cleaned.substring(start, start + 200));
        throw new Error('Invalid JSON: unbalanced braces');
      }
      
      if (end === start) {
        console.error('[AI Agent] Could not find matching closing brace');
        throw new Error('Invalid JSON: no closing brace found');
      }
      
      // Extract the JSON object (including the closing brace)
      const jsonStr = cleaned.substring(start, end + 1);
      console.log('[AI Agent] Extracted JSON string (length:', jsonStr.length, ')');
      console.log('[AI Agent] JSON preview:', jsonStr.substring(0, 200) + '...');
      
      // Log what comes after the JSON (if anything)
      const afterJson = cleaned.substring(end + 1).trim();
      if (afterJson) {
        console.warn('[AI Agent] Found text after JSON (this is normal, ignoring):', afterJson.substring(0, 100));
      }
      
      let parsed: any;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (parseError: any) {
        console.error('[AI Agent] JSON parse error:', parseError.message);
        const positionMatch = parseError.message.match(/position (\d+)/);
        const errorPosition = positionMatch ? parseInt(positionMatch[1], 10) : 0;
        console.error('[AI Agent] Error at position:', errorPosition);
        console.error('[AI Agent] JSON string (first 1000 chars):', jsonStr.substring(0, 1000));
        if (errorPosition > 0) {
          const startPos = Math.max(0, errorPosition - 50);
          const endPos = Math.min(jsonStr.length, errorPosition + 50);
          console.error('[AI Agent] JSON string (around error position):', jsonStr.substring(startPos, endPos));
        }
        throw new Error(`Invalid JSON format: ${parseError.message}`);
      }
      
      // Validate response structure - files are required
      if (!parsed.files || !Array.isArray(parsed.files)) {
        console.error('[AI Agent] Missing files array in response. Keys:', Object.keys(parsed));
        throw new Error('Invalid response: missing files array');
      }
      
      // Build response with defaults for optional fields
      const result: GeminiResponse = {
        files: parsed.files,
        message: parsed.message || 'Code updated successfully',
        productSpec: parsed.productSpec || '',
        features: Array.isArray(parsed.features) ? parsed.features : []
      };
      
      console.log('[AI Agent] Parsed successfully:', {
        filesCount: result.files.length,
        hasMessage: !!result.message,
        hasProductSpec: !!result.productSpec,
        featuresCount: result.features.length
      });
      
      return result;
    } catch (error: any) {
      console.error('[AI Agent] Failed to parse Gemini response');
      console.error('[AI Agent] Error:', error.message);
      console.error('[AI Agent] Full response:', response.substring(0, 1000));
      throw new Error(`Failed to parse Gemini response: ${error.message}`);
    }
  }

  /**
   * Update or create files in Firestore
   */
  private async updateFiles(files: GeminiResponse['files']): Promise<void> {
    for (const file of files) {
      await this.updateOrCreateFile(file.path, file.content, file.language);
    }
  }

  /**
   * Update existing file or create new one
   */
  private async updateOrCreateFile(
    path: string, 
    content: string, 
    language: string
  ): Promise<void> {
    const filesRef = collection(db, 'sessions', this.sessionId, 'files');
    const q = query(filesRef, where('path', '==', path));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // Update existing file
      const fileDoc = snapshot.docs[0];
      const fileRef = doc(db, 'sessions', this.sessionId, 'files', fileDoc.id);
      await updateDoc(fileRef, {
        content,
        updatedAt: Timestamp.now()
      });
      console.log(`[AI Agent] Updated file: ${path}`);
    } else {
      // Create new file
      await addDoc(filesRef, {
        path,
        name: path.split('/').pop() || 'untitled',
        type: 'file',
        content,
        language,
        updatedAt: Timestamp.now()
      });
      console.log(`[AI Agent] Created new file: ${path}`);
    }
  }

  /**
   * Update prompt status in Firestore
   */
  private async updatePromptStatus(
    promptId: string, 
    status: 'pending' | 'processing' | 'completed' | 'error'
  ): Promise<void> {
    const promptRef = doc(db, 'sessions', this.sessionId, 'prompts', promptId);
    const updates: any = { status };
    
    if (status === 'completed') {
      updates.completedAt = Timestamp.now();
    }
    
    await updateDoc(promptRef, updates);
  }

  /**
   * Update product spec and features in session document
   */
  private async updateSessionSpec(productSpec: string, features: string[]): Promise<void> {
    if (!productSpec && features.length === 0) {
      console.log('[AI Agent] No product spec or features to update, skipping');
      return;
    }

    const sessionRef = doc(db, 'sessions', this.sessionId);
    const updates: any = {};
    
    if (productSpec) {
      updates.projectSpec = productSpec;
    }
    
    if (features.length > 0) {
      updates.features = features;
    }
    
    await updateDoc(sessionRef, updates);
    console.log('[AI Agent] Session updated with new spec and features');
  }
}

