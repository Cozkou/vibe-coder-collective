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
  const lastFileHashRef = useRef<string>(''); // Track file changes to force updates

  // Initial embed
  useEffect(() => {
    if (!containerRef.current || files.length === 0 || isReady) return;

    console.log('Initializing StackBlitz with files:', files);

    // Convert Firestore files to StackBlitz format - INCLUDE ALL FILES
    const sbFiles: Record<string, string> = {};
    files.forEach(file => {
      if (file.type === 'file') {
        const content = file.content || '';
        sbFiles[file.path] = content;
        console.log(`[StackBlitz] Initial embed - Adding file: ${file.path} (${content.length} chars)`);
      }
    });
    
    console.log(`[StackBlitz] Initial embed - Total files from Firestore: ${Object.keys(sbFiles).length}`);

    // Ensure we have a package.json with Tailwind CSS
    // IMPORTANT: Tailwind must be in dependencies (not devDependencies) for StackBlitz to install it
    if (!sbFiles['package.json']) {
      sbFiles['package.json'] = JSON.stringify({
        name: 'vibe-code-app',
        version: '1.0.0',
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          'react-scripts': '5.0.1',
          'tailwindcss': '^3.3.0',
          'postcss': '^8.4.0',
          'autoprefixer': '^10.4.0'
        },
        scripts: {
          start: 'react-scripts start',
          build: 'react-scripts build',
          test: 'react-scripts test',
          eject: 'react-scripts eject'
        },
        browserslist: {
          production: [">0.2%", "not dead", "not op_mini all"],
          development: ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
        }
      }, null, 2);
      console.log('[StackBlitz] Created package.json with Tailwind in dependencies');
    } else {
      // If package.json exists, ensure Tailwind is in dependencies
      try {
        const packageJson = JSON.parse(sbFiles['package.json']);
        if (!packageJson.dependencies) {
          packageJson.dependencies = {};
        }
        // Ensure Tailwind dependencies are in dependencies (not devDependencies)
        if (!packageJson.dependencies.tailwindcss) {
          packageJson.dependencies.tailwindcss = '^3.3.0';
          packageJson.dependencies.postcss = '^8.4.0';
          packageJson.dependencies.autoprefixer = '^10.4.0';
          // Remove from devDependencies if present
          if (packageJson.devDependencies) {
            delete packageJson.devDependencies.tailwindcss;
            delete packageJson.devDependencies.postcss;
            delete packageJson.devDependencies.autoprefixer;
          }
          sbFiles['package.json'] = JSON.stringify(packageJson, null, 2);
          console.log('[StackBlitz] Updated package.json - moved Tailwind to dependencies');
        }
      } catch (err) {
        console.error('[StackBlitz] Error parsing package.json in initial embed:', err);
      }
    }

    // Ensure we have Tailwind config
    if (!sbFiles['tailwind.config.js']) {
      sbFiles['tailwind.config.js'] = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;
    }

    // Ensure we have PostCSS config
    if (!sbFiles['postcss.config.js']) {
      sbFiles['postcss.config.js'] = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
    }

    // Ensure index.css has Tailwind directives (CRITICAL for CSS to work)
    if (!sbFiles['src/index.css'] || !sbFiles['src/index.css'].includes('@tailwind')) {
      const existingCss = sbFiles['src/index.css'] || '';
      sbFiles['src/index.css'] = `@tailwind base;
@tailwind components;
@tailwind utilities;

${existingCss}`.trim();
      console.log('[StackBlitz] Initial embed - Ensuring Tailwind directives in index.css');
    }

    // Ensure index.tsx imports index.css (CRITICAL)
    if (sbFiles['src/index.tsx'] && !sbFiles['src/index.tsx'].includes("import './index.css'")) {
      console.log('[StackBlitz] Initial embed - Adding CSS import to index.tsx');
      // Add import after React imports but before App import
      sbFiles['src/index.tsx'] = sbFiles['src/index.tsx'].replace(
        /(import React.*?;[\n\r]*)/,
        `$1import './index.css';\n`
      );
      // If the regex didn't match, try after ReactDOM import
      if (!sbFiles['src/index.tsx'].includes("import './index.css'")) {
        sbFiles['src/index.tsx'] = sbFiles['src/index.tsx'].replace(
          /(import ReactDOM.*?;[\n\r]*)/,
          `$1import './index.css';\n`
        );
      }
    }
    
    console.log(`[StackBlitz] Initial embed - Final file count: ${Object.keys(sbFiles).length}`);
    console.log('[StackBlitz] Initial embed - Files:', Object.keys(sbFiles));

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

    // Create a hash of all files to detect changes
    const fileHash = files
      .map(f => `${f.path}:${f.content?.length || 0}`)
      .sort()
      .join('|');
    
    // Skip if files haven't changed
    if (fileHash === lastFileHashRef.current) {
      console.log('[StackBlitz] Files unchanged, skipping update');
      return;
    }
    
    lastFileHashRef.current = fileHash;
    
    console.log('[StackBlitz] Updating files from Firestore. Total files:', files.length);
    
    // Build complete file map with ALL files from Firestore
    const fileMap: Record<string, string> = {};
    
    // First, add ALL files from Firestore (including CSS, configs, everything)
    files.forEach(file => {
      if (file.type === 'file') {
        const content = file.content || '';
        fileMap[file.path] = content;
        console.log(`[StackBlitz] Adding file: ${file.path} (${content.length} chars)`);
      }
    });

    // Ensure package.json has Tailwind in dependencies (CRITICAL for CSS to work)
    if (fileMap['package.json']) {
      try {
        const packageJson = JSON.parse(fileMap['package.json']);
        if (!packageJson.dependencies) {
          packageJson.dependencies = {};
        }
        // Ensure Tailwind dependencies are in dependencies (not devDependencies)
        const needsUpdate = !packageJson.dependencies.tailwindcss || 
                           packageJson.devDependencies?.tailwindcss;
        
        if (needsUpdate) {
          packageJson.dependencies.tailwindcss = '^3.3.0';
          packageJson.dependencies.postcss = '^8.4.0';
          packageJson.dependencies.autoprefixer = '^10.4.0';
          // Remove from devDependencies if present
          if (packageJson.devDependencies) {
            delete packageJson.devDependencies.tailwindcss;
            delete packageJson.devDependencies.postcss;
            delete packageJson.devDependencies.autoprefixer;
          }
          fileMap['package.json'] = JSON.stringify(packageJson, null, 2);
          console.log('[StackBlitz] Updated package.json - moved Tailwind to dependencies');
        }
      } catch (err) {
        console.error('[StackBlitz] Error parsing package.json:', err);
      }
    } else {
      // Create package.json if it doesn't exist
      fileMap['package.json'] = JSON.stringify({
        name: 'vibe-code-app',
        version: '1.0.0',
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          'react-scripts': '5.0.1',
          'tailwindcss': '^3.3.0',
          'postcss': '^8.4.0',
          'autoprefixer': '^10.4.0'
        },
        scripts: {
          start: 'react-scripts start',
          build: 'react-scripts build',
          test: 'react-scripts test',
          eject: 'react-scripts eject'
        },
        browserslist: {
          production: [">0.2%", "not dead", "not op_mini all"],
          development: ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
        }
      }, null, 2);
      console.log('[StackBlitz] Created missing package.json with Tailwind in dependencies');
    }

    // Ensure Tailwind config files are always present
    if (!fileMap['tailwind.config.js']) {
      fileMap['tailwind.config.js'] = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
}`;
      console.log('[StackBlitz] Added missing tailwind.config.js');
    }

    if (!fileMap['postcss.config.js']) {
      fileMap['postcss.config.js'] = `module.exports = {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}`;
      console.log('[StackBlitz] Added missing postcss.config.js');
    }

    // Ensure index.css has Tailwind directives (CRITICAL for CSS to work)
    if (fileMap['src/index.css']) {
      if (!fileMap['src/index.css'].includes('@tailwind')) {
        console.log('[StackBlitz] Adding Tailwind directives to existing index.css');
        fileMap['src/index.css'] = `@tailwind base;
@tailwind components;
@tailwind utilities;

${fileMap['src/index.css']}`;
      }
    } else {
      console.log('[StackBlitz] Creating index.css with Tailwind directives');
      fileMap['src/index.css'] = `@tailwind base;
@tailwind components;
@tailwind utilities;

body { margin: 0; font-family: sans-serif; }
* { box-sizing: border-box; }`;
    }

    // Ensure index.tsx imports index.css (CRITICAL)
    if (fileMap['src/index.tsx'] && !fileMap['src/index.tsx'].includes("import './index.css'")) {
      console.log('[StackBlitz] Adding CSS import to index.tsx');
      // Add import after React imports but before App import
      let indexTsx = fileMap['src/index.tsx'];
      
      // Try after React import
      if (!indexTsx.includes("import './index.css'")) {
        indexTsx = indexTsx.replace(
          /(import React.*?;[\n\r]*)/,
          `$1import './index.css';\n`
        );
      }
      
      // If that didn't work, try after ReactDOM import
      if (!indexTsx.includes("import './index.css'")) {
        indexTsx = indexTsx.replace(
          /(import ReactDOM.*?;[\n\r]*)/,
          `$1import './index.css';\n`
        );
      }
      
      // If still not found, add it before the App import
      if (!indexTsx.includes("import './index.css'")) {
        indexTsx = indexTsx.replace(
          /(import App from.*?;)/,
          `import './index.css';\n$1`
        );
      }
      
      fileMap['src/index.tsx'] = indexTsx;
    }

    console.log(`[StackBlitz] Updating ${Object.keys(fileMap).length} files in StackBlitz`);
    console.log('[StackBlitz] Files to update:', Object.keys(fileMap));

    // Update ALL files in StackBlitz
    // Use applyFsDiff to update/create all files at once
    try {
      // First, get existing files to compare
      vmRef.current.applyFsDiff({
        create: fileMap,
        destroy: [] // Don't destroy anything, just update/create
      });
      
      console.log('[StackBlitz] Files updated successfully');
      
      // Force a rebuild by triggering a file change (hack to ensure StackBlitz recompiles)
      setTimeout(() => {
        // Small delay to ensure files are written, then force a recompile if possible
        console.log('[StackBlitz] File sync complete');
      }, 500);
      
    } catch (err) {
      console.error('[StackBlitz] Error updating files:', err);
      // Try alternative method - write files one by one if batch fails
      console.log('[StackBlitz] Attempting individual file updates...');
      
      Promise.all(
        Object.entries(fileMap).map(([path, content]) => {
          return vmRef.current.applyFsDiff({
            create: { [path]: content },
            destroy: []
          }).catch(fileErr => {
            console.error(`[StackBlitz] Error updating ${path}:`, fileErr);
          });
        })
      ).then(() => {
        console.log('[StackBlitz] Individual file updates complete');
      });
    }
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

