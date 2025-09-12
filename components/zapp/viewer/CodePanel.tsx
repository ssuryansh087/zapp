"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Clipboard, Check } from "lucide-react";

type Props = {
  code: string;
  language: "react-native" | "flutter";
};

// CSS for custom scrollbars
const customScrollbarStyle = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #1e1e1e;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #4f4f4f;
    border-radius: 20px;
    border: 2px solid #1e1e1e;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #6a6a6a;
  }
`;

export default function CodePanel({ code, language }: Props) {
  const [copied, setCopied] = useState(false);

  // Function to handle copying the code to the clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    // Reset the "Copied!" message after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // Determine the correct language for the syntax highlighter
  const syntaxLanguage = language === "react-native" ? "jsx" : "dart";

  return (
    // This parent container is crucial for positioning the copy button
    <div className="relative h-full w-full rounded-lg bg-[#1e1e1e] overflow-hidden">
      {/* Inject the custom scrollbar styles into the component */}
      <style>{customScrollbarStyle}</style>

      <button
        onClick={handleCopy}
        className="absolute top-4 right-5 z-10 p-2 rounded-md bg-white/10 text-white/70 hover:bg-white/20 transition-all duration-200"
        aria-label="Copy code"
        title="Copy code"
      >
        {copied ? (
          <Check className="h-5 w-5 text-green-400" />
        ) : (
          <Clipboard className="h-5 w-5" />
        )}
      </button>

      {/* The SyntaxHighlighter component handles formatting and scrolling */}
      <SyntaxHighlighter
        language={syntaxLanguage}
        style={vscDarkPlus}
        className="custom-scrollbar" // Apply the custom scrollbar class
        customStyle={{
          margin: 0,
          // Increased padding to give code and scrollbar breathing room
          padding: "1.5rem 2.5rem 1.5rem 1.5rem",
          backgroundColor: "transparent",
          width: "100%",
          height: "100%",
          overflow: "auto", // Enables both vertical and horizontal scrolling
        }}
        codeTagProps={{
          style: {
            fontFamily: '"Fira Code", monospace',
            fontSize: "14px",
          },
        }}
        showLineNumbers
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
