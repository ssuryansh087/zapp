// components/zapp/glowing-composer.tsx
"use client";

import { useState } from "react";
import { Send, Upload } from "lucide-react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (payload: { prompt: string; images: string[] }) => void; // modified
  stack: "react-native" | "flutter" | null;
  onStackChange: (s: "react-native" | "flutter") => void;
};

export default function GlowingComposer({
  value,
  onChange,
  onSubmit,
  stack,
  onStackChange,
}: Props) {
  const [files, setFiles] = useState<File[]>([]);

  const toDataURL = (f: File) =>
    new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(f);
    });

  async function handleSubmit() {
    const images = await Promise.all(files.map(toDataURL));
    onSubmit({ prompt: value, images });
  }

  return (
    <div className="w-full max-w-3xl">
      {/* Prompt Input */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe the app screen you want to build..."
        className="w-full resize-none rounded-xl border border-white/10 bg-black/40 p-4 text-white placeholder-white/40 focus:border-white/30 focus:outline-none"
        rows={5}
      />

      {/* Controls */}
      <div className="mt-4 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        {/* Attach button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-full cursor-pointer border border-white/10 px-3 text-xs text-white/80 transition hover:bg-white/5 hover:shadow-[0_0_16px_rgba(255,255,255,0.2)]"
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Attach</span>
          </button>
          <input
            id="file-input"
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
          />
        </div>

        {/* Stack pills + Build button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onStackChange("react-native")}
            className={`h-9 rounded-full px-4 text-sm ${
              stack === "react-native"
                ? "bg-white/20 text-white"
                : "bg-transparent text-white/60 hover:bg-white/10"
            }`}
          >
            React Native
          </button>
          <button
            onClick={() => onStackChange("flutter")}
            className={`h-9 rounded-full px-4 text-sm ${
              stack === "flutter"
                ? "bg-white/20 text-white"
                : "bg-transparent text-white/60 hover:bg-white/10"
            }`}
          >
            Flutter
          </button>

          <button
            onClick={handleSubmit}
            className="ml-1 inline-flex h-10 border-white/50 cursor-pointer border-1 items-center justify-center rounded-full bg-white/10 px-4 text-sm font-medium text-white shadow-[0_0_24px_rgba(255,255,255,0.25)] transition hover:scale-[1.02] hover:bg-white/15"
            aria-label="Submit prompt"
            disabled={!stack}
            title={!stack ? "Select a stack" : "Build"}
          >
            <Send className="mr-2 h-4 w-4" />
            Build
          </button>
        </div>
      </div>

      {/* Preview attached files */}
      {files.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <span
              key={i}
              className="rounded-md bg-white/10 px-2 py-1 text-xs text-white/70"
            >
              {f.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
