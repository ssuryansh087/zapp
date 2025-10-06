"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { LoaderCircle, Mail, Lock, User, Chrome } from "lucide-react";
import Image from "next/image";

export default function AuthPage() {
  const router = useRouter();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(formData.email, formData.password, formData.fullName);
      } else {
        await signIn(formData.email, formData.password);
      }
      router.push("/");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-[-20%] h-[60vh] w-[60vw] -translate-x-1/2 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[50vh] w-[50vw] rounded-full bg-[color:var(--zapp-accent)/0.15] blur-3xl" />
      </div>

      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Image
              src="/logo.png"
              alt="Zapp logo"
              width={64}
              height={64}
              className="mx-auto mb-4 h-16 w-16"
            />
            <h1 className="text-3xl font-semibold">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isSignUp
                ? "Sign up to start building amazing apps"
                : "Sign in to continue building"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-8 backdrop-blur-xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignUp && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-white placeholder-white/40 transition focus:border-white/30 focus:outline-none"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-white placeholder-white/40 transition focus:border-white/30 focus:outline-none"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-white placeholder-white/40 transition focus:border-white/30 focus:outline-none"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full rounded-lg bg-white/10 py-3 font-medium text-white shadow-[0_0_24px_rgba(255,255,255,0.25)] transition",
                  "hover:scale-[1.02] hover:bg-white/15",
                  loading && "opacity-50 cursor-not-allowed"
                )}
              >
                {loading ? (
                  <LoaderCircle className="mx-auto h-5 w-5 animate-spin" />
                ) : isSignUp ? (
                  "Sign Up"
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-white/40">OR</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className={cn(
                "w-full rounded-lg border border-white/10 bg-white/5 py-3 font-medium text-white transition",
                "hover:bg-white/10",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              <span className="flex items-center justify-center gap-2">
                <Chrome className="h-5 w-5" />
                Continue with Google
              </span>
            </button>

            <div className="mt-6 text-center text-sm">
              <span className="text-white/60">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}
              </span>
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="ml-2 font-medium text-white hover:underline"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
