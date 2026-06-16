"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FolderKanban, Users, Search, Loader2, Trash2, Calendar } from "lucide-react";
import { projectsApi } from "@/lib/api";
import { ProjectListItem } from "@/types";
import { formatRelative, getErrorMessage } from "@/lib/utils";
import { toastError, toastSuccess } from "@/components/ui/Toaster";
import { Modal } from "@/components/ui/Modal";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  title: z.string().min(1, "Title required"),
  description: z.string().optional(),
  status: z.enum(["Active", "Archived", "Completed", "On Hold"]).optional(),
});
type FormData = z.infer<typeof schema>;

const statusConfig: Record<string, { dot: string; ring: string }> = {
  Active: { dot: "bg-emerald-500", ring: "ring-emerald-500/30" },
  "On Hold": { dot: "bg-amber-500", ring: "ring-amber-500/30" },
  Completed: { dot: "bg-blue-500", ring: "ring-blue-500/30" },
  Archived: { dot: "bg-slate-500", ring: "ring-slate-500/30" },
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    "On Hold": "bg-amber-500/10 text-amber-500 border-amber-500/20",
    Completed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    Archived: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  };
  const style = map[status] || "bg-slate-500/10 text-slate-500 border-slate-500/20";
  const dot = statusConfig[status]?.dot || "bg-slate-500";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap shrink-0 ${style}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "Active" },
  });

  const fetchProjects = async () => {
    try {
      const res = await projectsApi.list();
      setProjects(res.data);
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const onSubmit = async (data: FormData) => {
    setCreating(true);
    try {
      await projectsApi.create(data);
      toastSuccess("Project created!");
      reset();
      setShowCreate(false);
      fetchProjects();
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this project and all its data?")) return;
    try {
      await projectsApi.delete(id);
      setProjects((prev) => prev.filter((p) => p.project_id !== id));
      toastSuccess("Project deleted");
    } catch (err) {
      toastError(getErrorMessage(err));
    }
  };

  const filtered = projects.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = projects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-foreground">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500">
              <FolderKanban size={20} />
            </div>
            Projects
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {projects.length} total · {statusCounts["Active"] || 0} active
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-colors rounded-lg bg-primary hover:opacity-90"
        >
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Filter */}
        {!isLoading && projects.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(["all", "Active", "On Hold", "Completed", "Archived"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                  statusFilter === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-muted-foreground hover:text-foreground"
                }`}
              >
                {s !== "all" && (
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[s]?.dot || "bg-slate-500"}`} />
                )}
                {s === "all" ? `All (${projects.length})` : `${s} (${statusCounts[s] || 0})`}
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            placeholder="Search projects…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-5 border rounded-xl bg-card border-border">
              <div className="h-5 mb-4 rounded w-3/4 bg-muted animate-pulse" />
              <div className="h-4 mb-6 rounded w-full bg-muted animate-pulse" />
              <div className="flex justify-between mt-auto">
                <div className="w-16 h-4 rounded bg-muted animate-pulse" />
                <div className="w-16 h-4 rounded bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-xl bg-card border-border">
          <FolderKanban size={48} className="text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground mb-4">No projects found</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-colors rounded-lg bg-primary hover:opacity-90"
          >
            <Plus size={16} /> Create first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <Link
              key={project.project_id}
              href={`/dashboard/projects/${project.project_id}`}
              className="group relative flex flex-col p-5 transition-all border rounded-xl bg-card border-border hover:border-primary/50 hover:shadow-lg animate-fade-in hover:-translate-y-0.5"
            >
              {/* Delete button */}
              <button
                onClick={(e) => handleDelete(project.project_id, e)}
                className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                title="Delete project"
              >
                <Trash2 size={16} />
              </button>

              {/* Title & Icon */}
              <div className="flex items-start gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                  <FolderKanban size={20} />
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <h3 className="font-bold text-foreground truncate mb-1">{project.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description || "No description provided."}
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-4 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Users size={14} /> {project.member_count}</span>
                  <span className="flex items-center gap-1.5"><Calendar size={14} /> {formatRelative(project.created_at)}</span>
                </div>
                <StatusBadge status={project.status} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => { setShowCreate(false); reset(); }}
        title="Create New Project"
        subtitle="Start a new research project for your team"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project Title *</label>
            <input
              {...register("title")}
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="e.g. ViT-Based Anomaly Detection"
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
            <select
              {...register("status")}
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
            >
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
            <textarea
              {...register("description")}
              rows={4}
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
              placeholder="Brief description of the project goals…"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-border mt-6">
            <button
              type="button"
              onClick={() => { setShowCreate(false); reset(); }}
              className="flex-1 px-4 py-2.5 text-sm font-semibold transition-colors border rounded-lg border-border bg-card text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {creating ? "Creating…" : "Create Project"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
