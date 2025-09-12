"use client";

import React, { useState, useRef, KeyboardEvent } from "react";
import { Send, Paperclip, X } from "lucide-react";

interface GlowingMiniComposerProps {
  // The onSend prop now sends a payload with a message and optional images
  onSend: (payload: { message: string; images: string[] }) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function GlowingMiniComposer({
  onSend,
  placeholder = "Describe your changes...",
  disabled = false,
}: GlowingMiniComposerProps) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  // State to hold the selected image files
  const [files, setFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to convert a File object to a Base64 Data URL
  const toDataURL = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async () => {
    const trimmedInput = input.trim();
    if ((!trimmedInput && files.length === 0) || disabled) return;

    // Convert all attached files to Data URLs
    const imagePromises = files.map(toDataURL);
    const images = await Promise.all(imagePromises);

    // Send the complete payload
    onSend({ message: trimmedInput, images });

    // Reset state
    setInput("");
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // You can add limits here if needed (e.g., max 5 files)
      setFiles(Array.from(e.target.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div>
      {/* Preview attached files */}
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md bg-white/10 px-2 py-1 text-xs text-white/70"
            >
              <span>{file.name}</span>
              <button
                onClick={() =>
                  setFiles(files.filter((_, index) => index !== i))
                }
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        className={`relative rounded-xl transition-all duration-300 ${
          isFocused ? "ring-2 ring-blue-500/50" : ""
        }`}
        style={{
          background: isFocused
            ? "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))"
            : "rgba(255, 255, 255, 0.05)",
          boxShadow: isFocused
            ? "0 0 30px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(59, 130, 246, 0.1)"
            : "none",
        }}
      >
        <div className="flex items-end gap-2 p-3">
          {/* Attach Button */}
          <button
            type="button"
            className="p-2 rounded-lg transition-colors duration-200 hover:bg-white/10 text-white/60 hover:text-white"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            id="file-input-chat"
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 resize-none bg-transparent text-white placeholder-white/40 outline-none text-sm min-h-[24px] max-h-[120px]"
            style={{ lineHeight: "1.5" }}
            rows={1}
          />

          <button
            onClick={handleSubmit}
            disabled={(!input.trim() && files.length === 0) || disabled}
            className={`p-2 rounded-lg transition-all duration-200 ${
              (input.trim() || files.length > 0) && !disabled
                ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-105"
                : "bg-white/10 text-white/30 cursor-not-allowed"
            }`}
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default GlowingMiniComposer;
