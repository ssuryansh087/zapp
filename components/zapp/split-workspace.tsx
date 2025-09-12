// components/zapp/split-workspace.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Code2, LoaderCircle, Wifi, Signal } from "lucide-react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { cn } from "@/lib/utils";
import { ChatBubble } from "./components";
import { GlowingMiniComposer } from "./glowing-mini-composer";
import CodePanel from "./viewer/CodePanel";
import { ReactNativePreview, FlutterPreview } from "./viewer/LivePreviews";

type Stack = "react-native" | "flutter";

type Message = {
  role: "user" | "assistant";
  text: string;
};

// Define a type for the payload from the composer
type ComposerPayload = {
  message: string;
  images: string[];
};

type Props = {
  sidebarOpen: boolean;
  prompt: string;
  stack: Stack;
  images: string[];
  // These props might not be needed if all logic is self-contained
  // onSend: (v: string) => void;
  // onResubmit: (v: string) => void;
};

const PhoneStatusBar = () => (
  <div
    className="absolute top-0 left-0 right-0 h-[54px] px-8 pt-4 flex items-center justify-between text-black font-semibold text-sm z-20"
    style={{
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    }}
  >
    <div className="flex items-center gap-1 font-bold">9:41</div>
    <div className="flex items-center gap-2">
      <Signal size={16} strokeWidth={2.5} />
      <Wifi size={16} strokeWidth={2.5} />
      <div className="w-7 h-[13px] border-2 border-black/70 rounded-[4px] p-0.5 flex items-center">
        <div className="w-full h-full bg-black/70 rounded-[2px]"></div>
      </div>
    </div>
  </div>
);

export default function SplitWorkspace({
  sidebarOpen,
  prompt,
  stack,
  images,
}: Props) {
  const [mode, setMode] = useState<"code" | "preview">("preview");
  // The 'code' state now holds a string for Flutter or an object { rn, next } for React Native
  const [code, setCode] = useState<any>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    let ignore = false;
    async function runInitialGeneration() {
      setLoading(true);
      setError(null);
      setCode("");
      setMessages([{ role: "user", text: prompt }]);

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, stack, images }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to generate");

        if (!ignore) {
          setCode(data.code); // Store the entire response (string or object)
          setMessages((prev) => [
            ...prev,
            { role: "assistant", text: "Done! Describe your next change." },
          ]);
        }
      } catch (e: any) {
        if (!ignore) {
          setError(e.message);
          setMessages((prev) => [
            ...prev,
            { role: "assistant", text: `Error: ${e.message}` },
          ]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    runInitialGeneration();
    return () => {
      ignore = true;
    };
  }, [prompt, stack, images]);

  const handleIterativeChange = async (payload: ComposerPayload) => {
    const { message: changePrompt, images: changeImages } = payload;
    const trimmedPrompt = changePrompt.trim();

    if ((!trimmedPrompt && changeImages.length === 0) || !code || loading)
      return;

    setMessages((prev) => [
      ...prev,
      { role: "user", text: trimmedPrompt || "Image prompt" },
    ]);

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmedPrompt,
          stack,
          code, // Send the entire code object/string back for context
          images: changeImages,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to modify code");

      setCode(data.code);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Here are your changes." },
      ]);
    } catch (e: any) {
      setError(e.message);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Error: ${e.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const preview = useMemo(() => {
    // Determine which code to pass to the preview component
    const previewCode = stack === "react-native" ? code?.next : code;

    const innerPreviewComponent =
      stack === "react-native" ? (
        <ReactNativePreview code={previewCode || ""} loading={loading} />
      ) : (
        <FlutterPreview code={previewCode || ""} loading={loading} />
      );

    return (
      <div className="flex items-center justify-center w-full h-full p-4 md:p-6">
        <div className="relative">
          <div
            className="relative rounded-[54px] bg-black transition-transform duration-300"
            style={{
              width: 393,
              height: 852,
              padding: 12,
              boxSizing: "content-box",
              border: "5px solid #1c1c1c",
              boxShadow: "0px 20px 50px -10px rgba(0, 0, 0, 0.6)",
              filter: "drop-shadow(0 0 15px rgba(255, 255, 255, 0.06))",
            }}
          >
            <PhoneStatusBar />
            <div
              className="absolute left-1/2 -translate-x-1/2 bg-black rounded-full flex items-center justify-center"
              style={{ top: 16, width: 125, height: 36, zIndex: 30 }}
            >
              <div
                className="absolute bg-gray-800 rounded-full"
                style={{
                  left: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 10,
                  height: 10,
                }}
              />
              <div
                className="absolute bg-gray-800 rounded-full"
                style={{
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 50,
                  height: 7,
                }}
              />
            </div>
            <div
              className="absolute bg-gray-800/90 rounded-l-md"
              style={{ right: -5, top: 120, width: 3, height: 35, zIndex: 5 }}
            />
            <div
              className="absolute bg-gray-800/90 rounded-r-md"
              style={{ left: -5, top: 180, width: 3, height: 70, zIndex: 5 }}
            />
            <div
              className="absolute bg-gray-800/90 rounded-r-md"
              style={{ left: -5, top: 260, width: 3, height: 70, zIndex: 5 }}
            />
            <div
              className="absolute overflow-hidden rounded-[42px] bg-white"
              style={{
                top: 12,
                bottom: 12,
                left: 12,
                right: 12,
              }}
            >
              <div className="w-full h-full pt-[44px] box-border">
                {innerPreviewComponent}
              </div>
            </div>
          </div>
          {loading && (
            <div className="absolute inset-0 bg-black/50 rounded-[60px] flex flex-col items-center justify-center z-50">
              <LoaderCircle className="w-8 h-8 text-white animate-spin" />
              <p className="text-white/80 text-sm mt-3">Updating preview...</p>
            </div>
          )}
        </div>
      </div>
    );
  }, [stack, code, loading]);

  // Determine which code to show in the code panel
  const displayCode = stack === "react-native" ? code?.rn : code;

  return (
    <div className="h-dvh w-full">
      <PanelGroup direction="horizontal" className="h-full">
        <Panel defaultSize={sidebarOpen ? 42 : 48} minSize={28}>
          <div className="flex h-full flex-col ml-2">
            <header className="glass sticky top-0 z-10 flex items-center justify-between px-4 py-[20px]">
              <h2 className="text-sm font-medium text-white/80">Chat</h2>
            </header>
            <div className="flex-1 space-y-6 overflow-auto px-4 py-6">
              {messages.map((msg, index) => (
                <ChatBubble key={index} role={msg.role} text={msg.text} />
              ))}
              {loading && messages.length > 0 && (
                <ChatBubble role="assistant" text="Generating… ✨" />
              )}
            </div>
            <div className="border-t border-white/10 px-4 py-5">
              <GlowingMiniComposer onSend={handleIterativeChange} />
            </div>
          </div>
        </Panel>
        <PanelResizeHandle className="group flex w-2 items-center justify-center">
          <div className="h-20 w-[2px] rounded-full bg-white/10 transition group-hover:bg-white/20" />
        </PanelResizeHandle>
        <Panel defaultSize={52} minSize={36}>
          <div className="relative flex h-full flex-col">
            <div className="glass sticky top-0 z-10 flex items-center gap-2 px-3 py-3">
              <button
                className={cn(
                  "icon-tab",
                  mode === "preview" && "icon-tab-active"
                )}
                onClick={() => setMode("preview")}
                aria-label="Preview"
                title="Preview"
              >
                <Eye className="h-5 w-5" />
              </button>
              <button
                className={cn("icon-tab", mode === "code" && "icon-tab-active")}
                onClick={() => setMode("code")}
                aria-label="Code"
                title="Code"
              >
                <Code2 className="h-5 w-5" />
              </button>
            </div>
            <div className="relative flex-1 overflow-auto">
              <div
                className="absolute inset-3 -z-10 rounded-2xl border border-white/10"
                aria-hidden
              >
                <div className="glass h-full rounded-2xl" />
              </div>
              {mode === "preview" ? (
                preview
              ) : (
                <CodePanel code={displayCode || ""} language={stack} />
              )}
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
