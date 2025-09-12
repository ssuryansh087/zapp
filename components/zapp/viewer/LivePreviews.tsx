"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";

// --- FINAL, CORRECTED, SANDPACK-FREE IFRAME PREVIEW ---
export function ReactNativePreview({
  code,
  loading,
}: {
  code: string; // This is the browser-ready JSX code block
  loading: boolean;
}) {
  const htmlTemplate = useMemo(() => {
    if (!code) return "";

    // This HTML document creates the perfect mini-environment for our AI-generated code.
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
          body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f0f0; }
        </style>
      </head>
      <body>
        <div id="root"></div>

        <script type="text/babel">
          try {
            // AI-generated code block goes here (e.g., const App = () => { ... })
            ${code}

            // Render the component to the DOM
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(<App />);
          } catch (e) {
            // If there's an error, display it in the preview
            const root = document.getElementById('root');
            root.innerHTML = '<div style="color: red; padding: 20px;"><h3>Preview Error</h3><pre>' + e.message + '</pre></div>';
            console.error(e);
          }
        </script>
      </body>
      </html>
    `;
  }, [code]);

  if (loading && !code) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500 text-sm">
        Generating preview...
      </div>
    );
  }

  if (!code) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500 text-sm">
        No preview available.
      </div>
    );
  }

  return (
    <iframe
      srcDoc={htmlTemplate}
      title="React Native Preview"
      sandbox="allow-scripts" // allow-same-origin is not needed and can be a security risk
      style={{
        width: "100%",
        height: "100%",
        border: 0,
        backgroundColor: "#f0f0f0",
      }}
    />
  );
}

// --- UNCHANGED FlutterPreview ---
export function FlutterPreview({
  code,
  loading,
}: {
  code: string;
  loading: boolean;
}) {
  const { theme } = useTheme();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isDartPadReady, setIsDartPadReady] = useState(false);

  const fullFlutterCode = useMemo(() => {
    if (!code) return "";
    return code; // Assuming your API now provides a full main.dart
  }, [code]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin === "https://dartpad.dev" &&
        event.data?.type === "ready"
      ) {
        setIsDartPadReady(true);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  useEffect(() => {
    if (isDartPadReady && iframeRef.current && fullFlutterCode) {
      iframeRef.current.contentWindow?.postMessage(
        { type: "sourceCode", sourceCode: fullFlutterCode },
        "*"
      );
      iframeRef.current.contentWindow?.postMessage({ type: "execute" }, "*");
    }
  }, [fullFlutterCode, isDartPadReady]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-white/70 text-sm">
        Generating preview…
      </div>
    );
  }

  if (!code) {
    return (
      <div className="flex h-full items-center justify-center text-white/50 text-sm">
        No preview yet.
      </div>
    );
  }

  const dartPadTheme = theme === "dark" ? "dark" : "light";
  const dartPadUrl = `https://dartpad.dev/embed-flutter.html?theme=${dartPadTheme}&run=true&split=0`;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        backgroundColor: "#1e1e1e",
      }}
    >
      <iframe
        key={dartPadUrl}
        ref={iframeRef}
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
        sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
        allow="clipboard-write; clipboard-read; camera; microphone; accelerometer; geolocation"
      />
    </div>
  );
}
