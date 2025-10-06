"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Code } from "lucide-react";

export function ReactNativePreview({
  code,
  loading,
}: {
  code: string;
  loading: boolean;
}) {
  if (!code && !loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center text-gray-500 text-sm p-4">
        <Code className="w-10 h-10 mb-3 text-gray-400" />
        <p className="font-semibold">No Preview Available</p>
        <p className="text-xs text-gray-400 mt-1">
          Select a visual screen component from the file explorer to generate a
          preview.
        </p>
      </div>
    );
  }

  const htmlTemplate = useMemo(() => {
    if (!code) return "";
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        
        <style>
          html, body, #root {
            height: 100%;
            width: 100%;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            background-color: #ffffff; /* Default background */
          }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <script type="text/babel">
          try {
            ${code}
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(<App />);
          } catch (e) {
            const root = document.getElementById('root');
            root.innerHTML = '<div style="color: red; padding: 20px;"><h3>Preview Error</h3><pre>' + e.message + '</pre></div>';
            console.error(e);
          }
        </script>
      </body>
      </html>
    `;
  }, [code]);

  return (
    <iframe
      srcDoc={htmlTemplate}
      title="React Native Preview"
      sandbox="allow-scripts"
      style={{
        width: "100%",
        height: "100%",
        border: 0,
      }}
    />
  );
}

export function FlutterPreview({
  code,
  loading,
}: {
  code: string;
  loading: boolean;
}) {
  const { theme } = useTheme();
  const [gistId, setGistId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // If there's no code or we are already loading a new project, do nothing.
    if (!code || loading) {
      setGistId(null);
      return;
    }

    let isMounted = true;
    const createGistForPreview = async () => {
      setIsCreating(true);
      setError(null);
      try {
        const res = await fetch("/api/create-gist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Send the `code` string in the correct format
          body: JSON.stringify({ code: code }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to create Gist.");
        }

        const data = await res.json();
        if (isMounted) {
          setGistId(data.gistId);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Gist creation failed:", err);
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setIsCreating(false);
        }
      }
    };

    createGistForPreview();

    return () => {
      isMounted = false;
    };
  }, [code, loading]); // Effect now depends on the code string

  // ... (the rest of the component's return logic for loading/error/iframe is the same and correct)
  const dartPadBaseUrl = `https://dartpad.dev/embed-flutter.html?theme=${
    theme === "dark" ? "dark" : "light"
  }&split=0&run=true&show-console=false`;

  const dartPadUrl = useMemo(() => {
    return gistId ? `${dartPadBaseUrl}&id=${gistId}` : dartPadBaseUrl;
  }, [gistId, dartPadBaseUrl]);

  if (isCreating) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center text-gray-500 text-sm p-4">
        <p className="font-semibold">Building preview...</p>
      </div>
    );
  }
  // ... (error and no-gistId states) ...
  if (!gistId) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center text-gray-500 text-sm p-4">
        <Code className="w-10 h-10 mb-3 text-gray-400" />
        <p className="font-semibold">No Preview Available</p>
      </div>
    );
  }
  // ... (iframe rendering logic) ...
  return (
    <iframe
      key={dartPadUrl}
      title="Flutter Preview"
      src={dartPadUrl}
      style={{
        position: "absolute",
        top: "-7.5%",
        left: "-2.25%",
        width: "104.25%",
        height: "109%",
        border: 0,
      }}
      className="w-full h-full border-0"
      sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
      allow="clipboard-write; clipboard-read; camera; microphone; accelerometer; geolocation"
    />
  );
}
