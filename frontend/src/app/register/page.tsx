"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/utils";
import { toastError, toastSuccess } from "@/components/ui/Toaster";

const schema = z.object({
  username: z.string().min(3, "Min. 3 characters").regex(/^[a-zA-Z0-9_-]+$/, "Letters, numbers, _ or - only"),
  email: z.string().email("Invalid email"),
  full_name: z.string().min(2, "Name required"),
  password: z.string().min(8, "Min. 8 characters").max(72, "Max 72 characters"),
  system_role: z.enum(["Manager", "Researcher", "Intern"]),
});
type FormData = z.infer<typeof schema>;

const ROLES = [
  { value: "Researcher", emoji: "🔬", desc: "Run experiments, upload documents" },
  { value: "Manager", emoji: "📋", desc: "Oversee projects and team access" },
  { value: "Intern", emoji: "🎓", desc: "View and contribute to research" },
] as const;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const { register: registerUser } = useAuth();
  const router = useRouter();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { system_role: "Researcher" },
  });
  const selectedRole = watch("system_role");

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await registerUser(data);
      toastSuccess("Account created! Welcome 🎉");
      router.push("/dashboard");
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background relative overflow-hidden p-6 py-12">
      {/* Background Orbs */}
      <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[10%] w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[560px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="flex items-center justify-center w-10 h-10 text-white rounded-lg bg-primary shadow-lg shadow-primary/30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div className="text-xl font-bold text-foreground leading-none">Lab Workspace</div>
            <div className="text-xs text-muted-foreground mt-1">Create your account</div>
          </div>
        </div>

        <div className="p-8 sm:p-10 rounded-2xl border border-border bg-card shadow-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Join the platform</h2>
            <p className="text-sm text-muted-foreground">Fill in the details to get started</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</label>
                <input
                  {...register("full_name")}
                  className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Jane Doe"
                  disabled={loading}
                />
                {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</label>
                <input
                  {...register("username")}
                  className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="jane_doe"
                  disabled={loading}
                />
                {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
              <input
                {...register("email")}
                type="email"
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="jane@lab.ai"
                disabled={loading}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPwd ? "text" : "password"}
                  className="w-full px-4 py-2.5 pr-10 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Min. 8 characters"
                  maxLength={72}
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

            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Role</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setValue("system_role", r.value)}
                    className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border text-center transition-all ${
                      selectedRole === r.value
                        ? "bg-primary/10 border-primary ring-2 ring-primary/20"
                        : "bg-background border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="text-2xl mb-2">{r.emoji}</div>
                    <div className={`text-sm font-semibold mb-1 ${selectedRole === r.value ? "text-primary" : "text-foreground"}`}>
                      {r.value}
                    </div>
                    <div className="text-[10px] text-muted-foreground leading-tight px-1 hidden sm:block">
                      {r.desc}
                    </div>
                  </button>
                ))}
              </div>
              <input type="hidden" {...register("system_role")} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 mt-6 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
