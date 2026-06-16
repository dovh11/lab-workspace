"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FlaskConical, Plus, Search, Loader2, Cpu, ArrowRight, TrendingDown, TrendingUp,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { experimentsApi, projectsApi } from "@/lib/api";
import { AIExperiment, ProjectListItem } from "@/types";
import { formatRelative, getErrorMessage } from "@/lib/utils";
import { toastError, toastSuccess } from "@/components/ui/Toaster";
import { Modal } from "@/components/ui/Modal";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  experiment_name: z.string().min(1, "Name required"),
  project_id: z.string().min(1, "Project required"),
  framework: z.string().optional(),
  description: z.string().optional(),
  hyperparameters: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const statusIcons: Record<string, React.ReactNode> = {
  running: <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shrink-0" />,
  completed: <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />,
  failed: <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />,
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    running: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    failed: "bg-red-500/10 text-red-500 border-red-500/20",
  };
  const style = map[status] || "bg-slate-500/10 text-slate-500 border-slate-500/20";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap shrink-0 ${style}`}>
      {status}
    </span>
  );
}

export default function ExperimentsPage() {
  const searchParams = useSearchParams();
  const defaultProjectId = searchParams.get("project_id") || "";

  const [experiments, setExperiments] = useState<AIExperiment[]>([]);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedExp, setSelectedExp] = useState<AIExperiment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [metricsEntry, setMetricsEntry] = useState("");
  const [appendingMetrics, setAppendingMetrics] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { project_id: defaultProjectId },
  });

  const fetchAll = async () => {
    try {
      const [expRes, projRes] = await Promise.all([
        experimentsApi.list(),
        projectsApi.list(),
      ]);
      setExperiments(expRes.data);
      setProjects(projRes.data);
      if (expRes.data.length > 0 && !selectedExp) setSelectedExp(expRes.data[0]);
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const onSubmit = async (data: FormData) => {
    setCreating(true);
    try {
      let hyperparameters = {};
      if (data.hyperparameters?.trim()) {
        try { hyperparameters = JSON.parse(data.hyperparameters); }
        catch { toastError("Hyperparameters must be valid JSON"); setCreating(false); return; }
      }
      await experimentsApi.create({
        experiment_name: data.experiment_name,
        project_id: Number(data.project_id),
        framework: data.framework,
        description: data.description,
        hyperparameters,
      });
      toastSuccess("Experiment logged!");
      reset();
      setShowCreate(false);
      fetchAll();
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleAppendMetrics = async () => {
    if (!metricsEntry.trim() || !selectedExp) return;
    try {
      const entry = JSON.parse(metricsEntry);
      setAppendingMetrics(true);
      const res = await experimentsApi.appendMetrics(selectedExp.experiment_id, entry);
      setSelectedExp(res.data);
      setExperiments(prev => prev.map(e => e.experiment_id === res.data.experiment_id ? res.data : e));
      setMetricsEntry("");
      toastSuccess("Metrics appended!");
    } catch {
      toastError("Invalid JSON — use format: {\"loss\": 0.5, \"accuracy\": 0.82}");
    } finally {
      setAppendingMetrics(false);
    }
  };

  const filtered = experiments.filter((e) =>
    e.experiment_name.toLowerCase().includes(search.toLowerCase())
  );

  const chartData = selectedExp?.metrics_log?.map((entry, idx) => ({
    epoch: entry.epoch ?? idx + 1,
    loss: entry.loss,
    val_loss: entry.val_loss,
    accuracy: entry.accuracy,
    val_accuracy: entry.val_accuracy,
  })) || [];

  const latestMetrics = selectedExp?.metrics_log?.at(-1);
  const prevMetrics = selectedExp?.metrics_log?.at(-2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-foreground">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500">
              <FlaskConical size={20} />
            </div>
            Experiments
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {experiments.length} total · {experiments.filter(e => e.status === "running").length} running
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-colors rounded-lg bg-primary hover:opacity-90"
        >
          <Plus size={16} /> Log Experiment
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Left: Experiment list ── */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="Search experiments…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-3">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="p-4 border rounded-xl bg-card border-border">
                  <div className="h-4 mb-3 rounded w-3/4 bg-muted animate-pulse" />
                  <div className="h-3 rounded w-1/2 bg-muted animate-pulse" />
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-xl bg-card border-border">
                <FlaskConical size={36} className="text-muted-foreground mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">No experiments yet</p>
              </div>
            ) : (
              filtered.map((exp) => (
                <button
                  key={exp.experiment_id}
                  onClick={() => setSelectedExp(exp)}
                  className={`w-full text-left p-4 transition-all border rounded-xl bg-card hover:border-border hover:bg-muted/50 ${
                    selectedExp?.experiment_id === exp.experiment_id
                      ? "ring-2 ring-primary border-primary/50"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {statusIcons[exp.status || "running"]}
                      <h4 className="font-semibold text-foreground text-sm truncate">{exp.experiment_name}</h4>
                    </div>
                    <StatusBadge status={exp.status || "running"} />
                  </div>
                  <div className="flex items-center gap-2">
                    {exp.framework && <span className="text-xs text-purple-500 font-mono">{exp.framework}</span>}
                    <p className="text-xs text-muted-foreground">{formatRelative(exp.created_at)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Right: Detail / Charts ── */}
        <div className="xl:col-span-2">
          {selectedExp ? (
            <div className="space-y-6 animate-fade-in">
              {/* Experiment header card */}
              <div className="p-6 border rounded-xl bg-card border-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h2 className="text-xl font-bold text-foreground">{selectedExp.experiment_name}</h2>
                      <StatusBadge status={selectedExp.status || "running"} />
                      {selectedExp.framework && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap bg-purple-500/10 text-purple-500 border-purple-500/20 font-mono">
                          <Cpu size={12} />{selectedExp.framework}
                        </span>
                      )}
                    </div>
                    {selectedExp.description && <p className="text-sm text-muted-foreground mb-2">{selectedExp.description}</p>}
                    <p className="text-xs text-muted-foreground">{formatRelative(selectedExp.created_at)}</p>
                  </div>
                  <Link href={`/dashboard/experiments/${selectedExp.experiment_id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline flex-shrink-0">
                    Full view <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Latest metric highlights */}
              {latestMetrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(latestMetrics).map(([k, v]) => {
                    if (k === "epoch") return null;
                    const prev = prevMetrics?.[k as keyof typeof prevMetrics];
                    const improved = typeof v === "number" && typeof prev === "number"
                      ? (k.includes("loss") ? v < prev : v > prev)
                      : null;
                    return (
                      <div key={k} className="p-4 border rounded-xl bg-card border-border text-center">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{k}</p>
                        <p className="text-2xl font-bold text-foreground font-mono">
                          {typeof v === "number" ? v.toFixed(4) : String(v)}
                        </p>
                        {improved !== null && (
                          <div className={`flex items-center justify-center gap-1 mt-2 text-xs font-medium ${improved ? "text-emerald-500" : "text-red-500"}`}>
                            {improved ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            <span>{improved ? "Improving" : "Degrading"}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Hyperparameters */}
              {selectedExp.hyperparameters && Object.keys(selectedExp.hyperparameters).length > 0 && (
                <div className="p-6 border rounded-xl bg-card border-border">
                  <h3 className="font-semibold text-foreground mb-4">Hyperparameters</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(selectedExp.hyperparameters).map(([k, v]) => (
                      <div key={k} className="px-3 py-2 rounded-lg bg-muted border border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{k}</p>
                        <p className="text-sm font-bold text-foreground font-mono">{String(v)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Training chart */}
              {chartData.length > 0 && (
                <div className="p-6 border rounded-xl bg-card border-border">
                  <h3 className="font-semibold text-foreground mb-6">
                    Training Curves <span className="text-muted-foreground font-normal ml-2">({chartData.length} epochs)</span>
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="epoch" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <Tooltip
                        contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px", color: "var(--foreground)" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                      {chartData[0]?.loss !== undefined && <Line type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={2} dot={false} />}
                      {chartData[0]?.val_loss !== undefined && <Line type="monotone" dataKey="val_loss" stroke="#f97316" strokeWidth={2} dot={false} strokeDasharray="4 2" />}
                      {chartData[0]?.accuracy !== undefined && <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} dot={false} />}
                      {chartData[0]?.val_accuracy !== undefined && <Line type="monotone" dataKey="val_accuracy" stroke="#8b5cf6" strokeWidth={2} dot={false} strokeDasharray="4 2" />}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Append Metrics inline */}
              <div className="p-6 border rounded-xl bg-card border-primary/20 ring-1 ring-primary/10">
                <h3 className="font-semibold text-foreground mb-4">Log Metrics Entry</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    className="flex-1 px-4 py-2 text-sm font-mono rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={metricsEntry}
                    onChange={(e) => setMetricsEntry(e.target.value)}
                    placeholder='{"epoch": 1, "loss": 0.45, "accuracy": 0.87}'
                    onKeyDown={(e) => { if (e.key === "Enter") handleAppendMetrics(); }}
                  />
                  <button
                    onClick={handleAppendMetrics}
                    disabled={appendingMetrics || !metricsEntry.trim()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-colors rounded-lg bg-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    {appendingMetrics ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    Append
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">Press Enter or click Append to log a new metrics row</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] border border-dashed rounded-xl bg-card border-border">
              <FlaskConical size={48} className="text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">Select an experiment to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => { setShowCreate(false); reset(); }}
        title="Log New Experiment"
        subtitle="Record a new AI experiment run with its configuration"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Experiment Name *</label>
            <input
              {...register("experiment_name")}
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="ResNet-50 v3 Baseline"
            />
            {errors.experiment_name && <p className="text-xs text-destructive">{errors.experiment_name.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project *</label>
              <select
                {...register("project_id")}
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
              >
                <option value="">— Select project —</option>
                {projects.map((p) => <option key={p.project_id} value={p.project_id}>{p.title}</option>)}
              </select>
              {errors.project_id && <p className="text-xs text-destructive">{errors.project_id.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Framework</label>
              <input
                {...register("framework")}
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="PyTorch, TensorFlow, JAX…"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
            <textarea
              {...register("description")}
              rows={2}
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
              placeholder="Brief description of the run…"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hyperparameters (JSON)</label>
            <textarea
              {...register("hyperparameters")}
              className="w-full px-4 py-2.5 text-sm font-mono rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
              rows={3}
              placeholder={'{\n  "lr": 0.001,\n  "batch_size": 32,\n  "epochs": 100\n}'}
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
              {creating ? "Logging…" : "Log Experiment"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
