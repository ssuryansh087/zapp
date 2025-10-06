// app/page.tsx
"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/zapp/sidebar";
import GlowingComposer from "@/components/zapp/glowing-composer";
import SplitWorkspace from "@/components/zapp/split-workspace";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Page() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stack, setStack] = useState<"react-native" | "flutter">(
    "react-native"
  );
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [virtualFilesystem, setVirtualFilesystem] = useState<any>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [activeFilePreviewCode, setActiveFilePreviewCode] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (payload: { prompt: string; images: string[] }) => {
      if (!payload.prompt.trim()) return;

      if (!user) {
        setShowAuthDialog(true);
        return;
      }

      setCurrentProjectId(null);
      setPrompt(payload.prompt);
      setImages(payload.images);
      setSubmitted(true);
    },
    [user]
  );

  const handleProjectSelect = useCallback((project: any) => {
    setCurrentProjectId(project.id);
    setPrompt(project.prompt);
    setStack(project.stack);
    setImages([]);
    setVirtualFilesystem(project.virtual_filesystem);
    setActiveFile(project.active_file);
    setActiveFilePreviewCode(project.active_file_preview_code);
    setSubmitted(true);
  }, []);

  const handleNewProject = useCallback(() => {
    setCurrentProjectId(null);
    setPrompt("");
    setImages([]);
    setVirtualFilesystem(null);
    setActiveFile(null);
    setActiveFilePreviewCode(null);
    setSubmitted(false);
  }, []);

  return (
    <div className="relative min-h-dvh bg-background text-foreground">
      {/* Background glow effects */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-[-20%] h-[60vh] w-[60vw] -translate-x-1/2 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[50vh] w-[50vw] rounded-full bg-[color:var(--zapp-accent)/0.15] blur-3xl" />
      </div>

      <div className="flex min-h-dvh">
        {/* Auth Button */}
        {!authLoading && !user && !submitted && (
          <div className="fixed top-6 right-6 z-50">
            <button
              onClick={() => router.push("/auth")}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm font-medium text-white backdrop-blur-xl transition hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </button>
          </div>
        )}

        {/* Sidebar */}
        <Sidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen((v) => !v)}
          currentProjectId={currentProjectId}
          onProjectSelect={handleProjectSelect}
          onNewProject={handleNewProject}
        />

        {/* Main */}
        <main className="flex-1">
          {!submitted ? (
            <section className="flex min-h-dvh flex-col items-center justify-center gap-10 px-4 py-10">
              {/* Logo + tagline */}
              <div className="text-center">
                <Image
                  src="/logo.png"
                  alt="Zapp logo"
                  width={96}
                  height={96}
                  className="mx-auto mb-4 h-20 w-20 md:h-24 md:w-24"
                />
                <h1 className="text-pretty text-4xl font-semibold md:text-5xl lg:text-6xl">
                  Zapp
                </h1>
                <p className="mx-auto mt-3 max-w-xl text-balance text-sm text-muted-foreground md:text-base">
                  Describe any screen and Zapp builds it. Ultra-minimal, glassy,
                  Vision-OS inspired.
                </p>
              </div>

              {/* Composer */}
              <GlowingComposer
                value={prompt}
                onChange={setPrompt}
                onSubmit={handleSubmit}
                stack={stack}
                onStackChange={setStack as any}
              />

              <div className="h-8" />
            </section>
          ) : (
            <SplitWorkspace
              sidebarOpen={sidebarOpen}
              prompt={prompt}
              stack={stack}
              images={images}
              currentProjectId={currentProjectId}
              onProjectIdChange={setCurrentProjectId}
              initialVirtualFilesystem={virtualFilesystem}
              initialActiveFile={activeFile}
              initialActiveFilePreviewCode={activeFilePreviewCode}
            />
          )}
        </main>
      </div>

      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md border-white/10 bg-black/90 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-white">Sign in Required</DialogTitle>
            <DialogDescription className="text-white/60">
              You need to be signed in to start building. Sign in or create an account to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => {
                setShowAuthDialog(false);
                router.push("/auth");
              }}
              className="flex-1 rounded-lg bg-white/10 py-2.5 font-medium text-white transition hover:bg-white/15"
            >
              Go to Sign In
            </button>
            <button
              onClick={() => setShowAuthDialog(false)}
              className="flex-1 rounded-lg border border-white/10 py-2.5 font-medium text-white transition hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
