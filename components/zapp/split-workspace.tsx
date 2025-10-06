// components/zapp/split-workspace.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Code2,
  LoaderCircle,
  FolderOpen,
  MessageSquare,
  Wifi, // Added from your old code
  Signal, // Added from your old code
} from "lucide-react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { cn } from "@/lib/utils";
import { ChatBubble } from "./components";
import { GlowingMiniComposer } from "./glowing-mini-composer";
import CodePanel from "./viewer/CodePanel";
import { ReactNativePreview, FlutterPreview } from "./viewer/LivePreviews";
import FileExplorer from "./file-explorer";

type Stack = "react-native" | "flutter";
type VirtualFilesystem = {
  [path: string]: { path: string; content: string; type: "file" };
};

type Message = {
  role: "user" | "assistant";
  text: string;
};

type ComposerPayload = {
  message: string;
  images: string[];
};

type Props = {
  sidebarOpen: boolean;
  prompt: string;
  stack: Stack;
  images: string[];
};

// This is the exact PhoneStatusBar from your old implementation
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
  const [virtualFilesystem, setVirtualFilesystem] =
    useState<VirtualFilesystem | null>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [activeFilePreviewCode, setActiveFilePreviewCode] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [messages, setMessages] = useState<Message[]>([]);

  // All your state management and API logic remains the same
  useEffect(() => {
    let ignore = false;
    async function runInitialGeneration() {
      setLoading(true);
      setVirtualFilesystem(null);
      setActiveFile(null);
      setActiveFilePreviewCode(null);
      setMessages([{ role: "user", text: prompt }]);

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, stack, images }),
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data?.error || "Failed to generate project");

        if (!ignore) {
          setVirtualFilesystem(data.virtualFilesystem);
          setActiveFile(data.activeFile);
          setActiveFilePreviewCode(data.activeFilePreviewCode);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              text: "I've created your project structure. What's next?",
            },
          ]);
        }
      } catch (e: any) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: `Error: ${e.message}` },
        ]);
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

    if (
      (!trimmedPrompt && changeImages.length === 0) ||
      !virtualFilesystem ||
      loading
    )
      return;

    setMessages((prev) => [
      ...prev,
      { role: "user", text: trimmedPrompt || "Image prompt" },
    ]);
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmedPrompt,
          stack,
          virtualFilesystem,
          activeFile,
          images: changeImages,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to modify code");

      setVirtualFilesystem(data.virtualFilesystem);
      setActiveFile(data.activeFile);
      setActiveFilePreviewCode(data.activeFilePreviewCode);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Here are the changes." },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Error: ${e.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (path: string) => {
    if (path === activeFile) return;

    // This part is correct: always update the active file for the code editor.
    setActiveFile(path);

    // --- THIS IS THE FIX ---
    // For Flutter, the preview is for the whole project. Changing the active
    // file should NOT affect the preview, so we simply do nothing else.
    if (stack === "flutter") {
      return;
    }

    // The rest of this logic will now ONLY run for React Native projects.
    if (!path.includes("/screens/")) {
      setActiveFilePreviewCode(null);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate preview for ${path}`,
          stack,
          virtualFilesystem,
          activeFile: path,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);

      setVirtualFilesystem(data.virtualFilesystem);
      setActiveFilePreviewCode(data.activeFilePreviewCode);
    } catch (e) {
      console.error("Failed to generate preview for selected file", e);
      setActiveFilePreviewCode(null);
    } finally {
      setLoading(false);
    }
  };

  const activeFileContent = useMemo(() => {
    if (!activeFile || !virtualFilesystem) return "";
    return virtualFilesystem[activeFile]?.content || "";
  }, [activeFile, virtualFilesystem]);

  // This is the preview block from your old implementation,
  // adapted to use your current state and components.
  const preview = useMemo(() => {
    const codeForPreview =
      stack === "react-native" ? activeFilePreviewCode : activeFileContent;

    const innerPreviewComponent =
      stack === "react-native" ? (
        <ReactNativePreview code={codeForPreview || ""} loading={loading} />
      ) : (
        <FlutterPreview code={activeFilePreviewCode || ""} loading={loading} />
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

            {/* Dynamic Island Notch */}
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

            {/* Side Buttons */}
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

            {/* Inner Screen */}
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
              <p className="text-white/80 text-sm mt-3">Updating project...</p>
            </div>
          )}
        </div>
      </div>
    );
  }, [
    stack,
    activeFilePreviewCode,
    activeFileContent,
    loading,
    virtualFilesystem,
  ]);

  // The rest of the component remains the same, with your current panel layout.
  return (
    <div className="h-dvh w-full">
      <PanelGroup direction="horizontal" className="h-full">
        <Panel defaultSize={sidebarOpen ? 30 : 25} minSize={20}>
          <PanelGroup direction="vertical">
            <Panel defaultSize={50} minSize={25}>
              <div className="flex flex-col h-full ml-2">
                <header className="glass flex-none flex items-center gap-2 px-4 py-[20px]">
                  <FolderOpen className="w-5 h-5 text-white/80" />
                  <h2 className="text-sm font-medium text-white/80">
                    Project Files
                  </h2>
                </header>
                <div className="flex-1 overflow-auto border-b border-white/10">
                  <FileExplorer
                    files={virtualFilesystem}
                    activeFile={activeFile}
                    onFileSelect={handleFileSelect}
                  />
                </div>
              </div>
            </Panel>
            <PanelResizeHandle className="group flex h-2 items-center justify-center">
              <div className="w-20 h-[2px] rounded-full bg-white/10 transition group-hover:bg-white/20" />
            </PanelResizeHandle>
            <Panel defaultSize={50} minSize={30}>
              <div className="flex flex-col h-full ml-2">
                <header className="glass flex-none flex items-center gap-2 px-4 py-3">
                  <MessageSquare className="w-5 h-5 text-white/80" />
                  <h2 className="text-sm font-medium text-white/80">Chat</h2>
                </header>
                <div className="flex-1 overflow-auto py-4 px-4 space-y-6">
                  {messages.map((msg, index) => (
                    <ChatBubble key={index} role={msg.role} text={msg.text} />
                  ))}
                  {loading && messages.length > 0 && (
                    <ChatBubble role="assistant" text="Working on it... ✨" />
                  )}
                </div>
                <div className="flex-none border-t border-white/10 px-4 py-5">
                  <GlowingMiniComposer onSend={handleIterativeChange} />
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
        <PanelResizeHandle className="group flex w-2 items-center justify-center">
          <div className="h-20 w-[2px] rounded-full bg-white/10 transition group-hover:bg-white/20" />
        </PanelResizeHandle>
        <Panel defaultSize={70} minSize={36}>
          <div className="relative flex h-full flex-col">
            <div className="glass sticky top-0 z-10 flex items-center gap-2 px-3 py-3">
              <button
                className={cn(
                  "icon-tab",
                  mode === "preview" && "icon-tab-active"
                )}
                onClick={() => setMode("preview")}
                aria-label="Preview"
              >
                <Eye className="h-5 w-5" />
              </button>
              <button
                className={cn("icon-tab", mode === "code" && "icon-tab-active")}
                onClick={() => setMode("code")}
                aria-label="Code"
              >
                <Code2 className="h-5 w-5" />
              </button>
              <div className="ml-auto text-sm text-white/50 px-2 truncate">
                {activeFile || "No file selected"}
              </div>
            </div>
            <div className="relative flex-1 overflow-auto">
              <div
                className="absolute inset-3 -z-10 rounded-2xl border border-white/10"
                aria-hidden
              >
                <div className="glass h-full rounded-2xl" />
              </div>
              <div
                className={cn("h-full w-full", mode !== "preview" && "hidden")}
              >
                {preview}
              </div>
              <div className={cn("h-full w-full", mode !== "code" && "hidden")}>
                <CodePanel code={activeFileContent || ""} language={stack} />
              </div>
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
