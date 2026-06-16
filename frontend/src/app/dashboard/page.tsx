"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FolderKanban, FlaskConical, FileText, BookOpen, ArrowRight, Clock, Activity, Zap } from "lucide-react";
import { projectsApi, experimentsApi, documentsApi, journalClubsApi } from "@/lib/api";
import { ProjectListItem, AIExperiment, JournalClub } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime, formatRelative } from "@/lib/utils";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Active: "bg-emerald-500",
    running: "bg-purple-500",
    completed: "bg-blue-500",
    failed: "bg-red-500",
    "On Hold": "bg-amber-500",
    Archived: "bg-slate-500",
    Completed: "bg-blue-500",
  };
  return <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${colors[status] || "bg-slate-500"}`} />;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    running: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    completed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    failed: "bg-red-500/10 text-red-500 border-red-500/20",
    "On Hold": "bg-amber-500/10 text-amber-500 border-amber-500/20",
    Archived: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    Completed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };
  const style = map[status] || "bg-slate-500/10 text-slate-500 border-slate-500/20";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap shrink-0 ${style}`}>
      <StatusDot status={status} />
      {status}
    </span>
  );
}

function SectionHeader({ title, icon, href }: { title: string; icon: React.ReactNode; href: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="flex items-center gap-2 font-bold text-foreground">
        {icon} {title}
      </h2>
      <Link href={href} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
        View all <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function EmptyBox({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-xl bg-card border-border">
      <div className="mb-3 text-3xl">{icon}</div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 border rounded-xl bg-card border-border">
          <div className="h-4 mb-3 rounded w-2/3 bg-muted animate-pulse" />
          <div className="h-3 rounded w-4/5 bg-muted animate-pulse" />
        </div>
      ))}
    </>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ projects: 0, experiments: 0, documents: 0, clubs: 0 });
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [experiments, setExperiments] = useState<AIExperiment[]>([]);
  const [upcoming, setUpcoming] = useState<JournalClub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [pr, er, dr, cr, all] = await Promise.all([
          projectsApi.list({ limit: 50 }),
          experimentsApi.list({ limit: 50 }),
          documentsApi.list({ limit: 50 }),
          journalClubsApi.list({ upcoming_only: true, limit: 3 }),
          journalClubsApi.list({ limit: 100 }),
        ]);
        setProjects(pr.data.slice(0, 4));
        setExperiments(er.data.slice(0, 4));
        setUpcoming(cr.data);
        setStats({ projects: pr.data.length, experiments: er.data.length, documents: dr.data.length, clubs: all.data.length });
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  const statCards = [
    { label: "Projects", value: stats.projects, icon: FolderKanban, color: "text-blue-500", bg: "bg-blue-500/10", href: "/dashboard/projects", sub: `${experiments.filter(e => e.status === "running").length} experiments running` },
    { label: "Experiments", value: stats.experiments, icon: FlaskConical, color: "text-purple-500", bg: "bg-purple-500/10", href: "/dashboard/experiments", sub: "Tracked runs" },
    { label: "Documents", value: stats.documents, icon: FileText, color: "text-sky-500", bg: "bg-sky-500/10", href: "/dashboard/documents", sub: "With versions" },
    { label: "Journal Clubs", value: stats.clubs, icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-500/10", href: "/dashboard/journal-clubs", sub: `${upcoming.length} upcoming` },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Zap size={14} className="text-primary" />
          <span className="text-xs font-bold tracking-widest uppercase text-primary">
            {getGreeting()}
          </span>
        </div>
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-foreground">
          Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">{user?.full_name?.split(" ")[0] ?? user?.username}</span> 👋
        </h1>
        <p className="text-muted-foreground">Here&apos;s what&apos;s happening in your workspace.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href} className="block group">
              <div className="flex flex-col p-5 transition-all border rounded-xl bg-card border-border hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5">
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${s.bg}`}>
                    <Icon size={20} className={s.color} />
                  </div>
                  <ArrowRight size={16} className="transition-transform text-muted-foreground group-hover:translate-x-1 group-hover:text-foreground" />
                </div>
                <div className="mb-1 text-3xl font-extrabold text-foreground leading-none">
                  {loading ? "—" : s.value}
                </div>
                <div className="text-sm font-semibold text-muted-foreground mb-0.5">{s.label}</div>
                <div className="text-xs text-muted-foreground/70">{s.sub}</div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 3-col grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Projects */}
        <div>
          <SectionHeader title="Recent Projects" icon={<FolderKanban size={18} className="text-blue-500" />} href="/dashboard/projects" />
          <div className="flex flex-col gap-3">
            {loading ? <SkeletonList /> : projects.length === 0 ? (
              <EmptyBox icon="🗂️" text="No projects yet" />
            ) : projects.map((p) => (
              <Link key={p.project_id} href={`/dashboard/projects/${p.project_id}`} className="block">
                <div className="p-4 transition-all border rounded-xl bg-card border-border hover:border-border hover:bg-muted/50">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="font-semibold text-sm text-foreground truncate">{p.title}</div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {p.description || "No description"} · {formatRelative(p.created_at)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Experiments */}
        <div>
          <SectionHeader title="Recent Experiments" icon={<Activity size={18} className="text-purple-500" />} href="/dashboard/experiments" />
          <div className="flex flex-col gap-3">
            {loading ? <SkeletonList /> : experiments.length === 0 ? (
              <EmptyBox icon="⚗️" text="No experiments logged" />
            ) : experiments.map((e) => (
              <Link key={e.experiment_id} href={`/dashboard/experiments/${e.experiment_id}`} className="block">
                <div className="p-4 transition-all border rounded-xl bg-card border-border hover:border-border hover:bg-muted/50">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="font-semibold text-sm text-foreground truncate">{e.experiment_name}</div>
                    <StatusBadge status={e.status ?? "running"} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {e.framework ? <span className="mr-2 font-mono text-purple-400">{e.framework}</span> : null}
                    {formatRelative(e.created_at)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming sessions */}
        <div>
          <SectionHeader title="Upcoming Sessions" icon={<Clock size={18} className="text-emerald-500" />} href="/dashboard/journal-clubs" />
          <div className="flex flex-col gap-3">
            {loading ? <SkeletonList count={2} /> : upcoming.length === 0 ? (
              <EmptyBox icon="📚" text="No upcoming sessions" />
            ) : upcoming.map((c) => {
              const diff = new Date(c.meeting_time).getTime() - Date.now();
              const days = Math.ceil(diff / 86400000);
              const isUrgent = days <= 1;
              return (
                <Link key={c.club_id} href="/dashboard/journal-clubs" className="block">
                  <div className="p-4 transition-all border rounded-xl bg-card border-border hover:border-border hover:bg-muted/50">
                    <div className="mb-3 font-semibold text-sm text-foreground truncate">{c.title}</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
                        <Clock size={14} /> {formatDateTime(c.meeting_time)}
                      </div>
                      <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${isUrgent ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"}`}>
                        {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days}d`}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
