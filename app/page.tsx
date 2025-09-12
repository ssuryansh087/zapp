// app/page.tsx
"use client";

import { useCallback, useState } from "react";
import Sidebar from "@/components/zapp/sidebar";
import GlowingComposer from "@/components/zapp/glowing-composer";
import SplitWorkspace from "@/components/zapp/split-workspace";
import Image from "next/image";
import logo from "@/assets/logo.png";

export default function Page() {
  const [submitted, setSubmitted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stack, setStack] = useState<"react-native" | "flutter">(
    "react-native"
  );
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const handleSubmit = useCallback(
    (payload: { prompt: string; images: string[] }) => {
      if (!payload.prompt.trim()) return;
      setPrompt(payload.prompt);
      setImages(payload.images);
      setSubmitted(true);
    },
    []
  );

  return (
    <div className="relative min-h-dvh bg-background text-foreground">
      {/* Background glow effects */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-[-20%] h-[60vh] w-[60vw] -translate-x-1/2 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[50vh] w-[50vw] rounded-full bg-[color:var(--zapp-accent)/0.15] blur-3xl" />
      </div>

      <div className="flex min-h-dvh">
        {/* Sidebar */}
        <Sidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen((v) => !v)}
        />

        {/* Main */}
        <main className="flex-1">
          {!submitted ? (
            <section className="flex min-h-dvh flex-col items-center justify-center gap-10 px-4 py-10">
              {/* Logo + tagline */}
              <div className="text-center">
                <Image
                  src={logo}
                  alt="Zapp logo"
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
              stack={stack} // ✅ added
              images={images} // ✅ added
            />
          )}
        </main>
      </div>
    </div>
  );
}
