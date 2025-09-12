"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatBubble({
  role,
  text,
}: {
  role: "user" | "assistant";
  text: string;
}) {
  const isUser = role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed transition",
          isUser
            ? "bg-white/10 border-white/50 border-1 text-white shadow-[0_0_24px_rgba(255,255,255,0.25)]"
            : "bg-white/5 text-white/90 shadow-[0_0_16px_rgba(255,255,255,0.15)]"
        )}
      >
        {text}
      </div>
    </div>
  );
}

export function GlowingMiniComposer({
  onSend,
}: {
  onSend: (v: string) => void;
}) {
  const [v, setV] = useState("");
  return (
    <div className="rounded-xl border border-white/10">
      {/* removed animated-border; now a calm static outline */}
      <div className="glass flex items-center gap-2 rounded-xl px-3 py-2">
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          placeholder="Describe your next change…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
        />
        <button
          onClick={() => onSend(v)}
          className="inline-flex h-8 items-center justify-center rounded-full bg-white/10 px-3 text-xs hover:scale-[1.03]"
        >
          <Send className="mr-1 h-4 w-4" />
          Send
        </button>
      </div>
    </div>
  );
}

export function PreviewPanel() {
  return (
    <div className="glass relative rounded-2xl p-6">
      <div className="mb-4 text-sm text-white/70">Preview</div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="h-40 rounded-lg bg-white/10" />
          <p className="mt-3 text-sm text-white/80">
            Hero with glass card and CTA
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="h-40 rounded-lg bg-white/10" />
          <p className="mt-3 text-sm text-white/80">
            Features grid with subtle glow
          </p>
        </div>
      </div>
    </div>
  );
}

export function CodePanel() {
  const code = `import { View, Text } from 'react-native';

export function Screen() {
  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#000' }}>
      <Text style={{ color: 'white' }}>Hello, Zapp!</Text>
    </View>
  )
}`;
  return (
    <div className="glass relative rounded-2xl p-6">
      <div className="mb-4 text-sm text-white/70">Code</div>
      <pre className="max-h-[50vh] overflow-auto rounded-lg border border-white/10 bg-black/40 p-4 text-xs leading-6 text-cyan-100">
        {code}
      </pre>
    </div>
  );
}
