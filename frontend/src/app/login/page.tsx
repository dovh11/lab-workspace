"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LogIn, Loader2, FolderKanban, FlaskConical, FileText, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/utils";
import { toastError, toastSuccess } from "@/components/ui/Toaster";

const schema = z.object({
  username: z.string().min(1, "Username required"),
  password: z.string().min(1, "Password required"),
});
type FormData = z.infer<typeof schema>;

const FEATURES = [
  { icon: FolderKanban, label: "Project Management", desc: "Track projects and team progress" },
  { icon: FlaskConical, label: "Experiment Tracking", desc: "Log runs, hyperparams & metrics" },
  { icon: FileText, label: "Document Versioning", desc: "Git-style file version control" },
  { icon: BookOpen, label: "Journal Club Scheduler", desc: "RSVP & paper discussion board" },
];

export default function LoginPage() {
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await login(data.username, data.password);
      toastSuccess("Welcome back!");
      router.push("/dashboard");
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background relative overflow-hidden p-6">
      {/* Background Orbs */}
      <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[1000px] grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left: Branding & Features */}
        <div className="hidden lg:block">
          <div className="flex items-center gap-4 mb-12">
            <div className="flex items-center justify-center w-12 h-12 text-white rounded-xl bg-primary shadow-lg shadow-primary/30">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <div className="text-xl font-bold text-foreground leading-tight">Lab Workspace</div>
              <div className="text-sm text-muted-foreground">AI Research Management</div>
            </div>
          </div>

          <h1 className="text-5xl font-extrabold text-foreground leading-[1.15] tracking-tight mb-6">
            Manage your<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-purple-500">AI research</span><br />
            in one place.
          </h1>

          <p className="text-lg text-muted-foreground mb-12 max-w-md">
            A unified workspace for tracking experiments, versioning documents, and scheduling journal clubs — built for research teams.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((f) => (
              <div key={f.label} className="p-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm flex items-start gap-4">
                <f.icon className="w-6 h-6 text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">{f.label}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Login Form */}
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-10">
            <div className="flex items-center justify-center w-10 h-10 text-white rounded-lg bg-primary shadow-lg shadow-primary/30">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="text-xl font-bold text-foreground">Lab Workspace</div>
          </div>

          <div className="p-8 sm:p-10 rounded-2xl border border-border bg-card shadow-2xl">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Sign in</h2>
              <p className="text-sm text-muted-foreground">Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Username</label>
                <input
                  {...register("username")}
                  className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="your_username"
                  autoComplete="username"
                  autoFocus
                  disabled={loading}
                />
                {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPwd ? "text" : "password"}
                    className="w-full px-4 py-2.5 pr-10 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                Create one
              </Link>
            </div>
          </div>
          
          <p className="text-center text-xs text-muted-foreground mt-8">
            FastAPI · Next.js · PostgreSQL
          </p>
        </div>
      </div>
    </div>
  );
}
