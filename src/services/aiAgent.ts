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
      
      // 4. Build context and call Gemini
      const context = this.buildContext(files, promptContent, sessionData, currentFeature);
      console.log('[AI Agent] Calling Gemini API...');
      const response = await this.callGemini(context);
      
      // 5. Parse response
      const parsedResponse = this.parseGeminiResponse(response);
      console.log(`[AI Agent] Received ${parsedResponse.files.length} files to update`);
      
      // 6. Update files in Firestore
      await this.updateFiles(parsedResponse.files);
      console.log('[AI Agent] Files updated in Firestore');
      
      // 7. Update product spec and features in session
      await this.updateSessionSpec(parsedResponse.productSpec, parsedResponse.features);
      console.log('[AI Agent] Product spec and features updated');
      
      // 8. Mark prompt as completed
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
    currentFeature?: string
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
      : '\nNOTE: This is the first prompt - you will create the initial product specification.\n';

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

2. STYLING - TAILWIND CSS (MANDATORY):
   - Use Tailwind CSS utility classes for ALL styling (already configured)
   - NO inline styles (style={{}}) - use className instead
   - NO separate CSS files - everything must be Tailwind classes
   - MANDATORY: Add gradients, shadows, rounded corners, hover effects
   - MANDATORY: Use proper spacing (p-4, p-6, px-8, py-4, m-4, gap-4, etc.)
   - MANDATORY: Use responsive breakpoints (sm:, md:, lg:)
   - MANDATORY: Add transitions (transition-all, transition-colors, duration-300)
   - MANDATORY: Add hover states (hover:bg-blue-600, hover:scale-105)
   - MANDATORY: Use modern color palettes (gradients, vibrant colors, not just gray)
   - MANDATORY: Make it look BEAUTIFUL and PROFESSIONAL - not basic or bland

3. CODE QUALITY (PRODUCTION STANDARD):
   - Clean, readable, well-structured, professional code
   - Proper indentation (2 spaces) and formatting
   - Meaningful, descriptive variable and function names (not "x", "temp", "data")
   - Extract reusable components when code is repeated
   - Handle edge cases, empty states, and errors gracefully
   - Use TypeScript types for ALL props, state, functions, and variables
   - No console.log statements in production code
   - Proper error handling

4. UI/UX EXCELLENCE (CRITICAL - THIS IS WHAT MATTERS MOST):
   - Create STUNNING, BEAUTIFUL interfaces that impress
   - Use proper visual hierarchy (larger headings, proper font weights)
   - MANDATORY: Add smooth animations and transitions (fade-in, slide, scale effects)
   - MANDATORY: Use gradients, shadows, and modern design elements
   - MANDATORY: Proper spacing and padding (not cramped - use generous whitespace)
   - MANDATORY: Color scheme that looks modern (not black and white only)
   - MANDATORY: Interactive elements with hover effects and feedback
   - Make components RESPONSIVE (mobile-first approach)
   - Use semantic HTML and ensure accessibility
   - Every UI element should look POLISHED and PROFESSIONAL

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
   - If App.tsx exists, it should import './App.css' (if you create App.css) or use Tailwind classes directly
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
    }
  ],
  "message": "Brief explanation of changes made",
  "productSpec": "Updated product specification describing the entire application",
  "features": ["Feature 1", "Feature 2"]
}

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

