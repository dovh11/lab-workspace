"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FlaskConical, Loader2, Plus, Cpu } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { experimentsApi } from "@/lib/api";
import { AIExperiment } from "@/types";
import { formatDateTime, getStatusColor, getErrorMessage } from "@/lib/utils";
import { toastError, toastSuccess } from "@/components/ui/Toaster";
import { useAuth } from "@/contexts/AuthContext";
import { projectsApi } from "@/lib/api";

export default function ExperimentDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [exp, setExp] = useState<AIExperiment | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appendEntry, setAppendEntry] = useState("");
  const [appending, setAppending] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await experimentsApi.get(Number(id));
        setExp(res.data);
        if (res.data.project_id && user) {
          const projRes = await projectsApi.get(res.data.project_id);
          const role = projRes.data.members.find((m: any) => m.user_id === user.user_id)?.role_in_project;
          setMyRole(role || null);
        }
      } catch (err) {
        toastError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, user]);

  const handleAppend = async () => {
    if (!appendEntry.trim() || !exp) return;
    try {
      const entry = JSON.parse(appendEntry);
      setAppending(true);
      const res = await experimentsApi.appendMetrics(exp.experiment_id, entry);
      setExp(res.data);
      setAppendEntry("");
      toastSuccess("Metrics appended!");
    } catch {
      toastError("Invalid JSON entry");
    } finally {
      setAppending(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="animate-spin text-primary" />
    </div>
  );

  if (!exp) return <div className="text-muted-foreground text-center py-10">Experiment not found</div>;

  const chartData = exp.metrics_log?.map((entry, idx) => ({
    epoch: entry.epoch ?? idx + 1,
    ...entry,
  })) || [];

  const metricKeys = chartData.length > 0
    ? Object.keys(chartData[0]).filter((k) => k !== "epoch")
    : [];

  const colors = ["#ef4444", "#6366f1", "#10b981", "#f59e0b", "#3b82f6", "#ec4899"];

  const isManager = user?.system_role === "Manager";
  const canContribute = isManager || myRole === "Lead" || myRole === "Contributor";

  return (
    <div className="space-y-6">
      <Link href="/dashboard/experiments" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Back to Experiments
      </Link>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">{exp.experiment_name}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(exp.status || "running")}`}>
              {exp.status}
            </span>
          </div>
          {exp.framework && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-2 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-muted text-muted-foreground border-border font-mono">
              <Cpu size={14} />{exp.framework}
            </span>
          )}
          {exp.description && <p className="text-muted-foreground text-sm mt-1 max-w-2xl">{exp.description}</p>}
          <p className="text-xs font-medium text-muted-foreground mt-2">Created {formatDateTime(exp.created_at)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hyperparameters */}
        <div className="p-5 border rounded-xl bg-card border-border shadow-sm">
          <h3 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">Hyperparameters</h3>
          {exp.hyperparameters && Object.keys(exp.hyperparameters).length > 0 ? (
            <div className="space-y-1">
              {Object.entries(exp.hyperparameters).map(([k, v]) => (
                <div key={k} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <span className="text-xs text-muted-foreground font-mono truncate mr-2">{k}</span>
                  <span className="text-xs text-foreground font-mono font-bold shrink-0">{String(v)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-muted border border-border text-center">
              <p className="text-muted-foreground text-xs font-medium">No hyperparameters</p>
            </div>
          )}
        </div>

        {/* Latest Metrics */}
        <div className="p-5 border rounded-xl bg-card border-border shadow-sm">
          <h3 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider flex items-center justify-between">
            <span>Latest Metrics</span>
            <span className="text-muted-foreground font-normal normal-case text-xs">{exp.metrics_log?.length || 0} entries</span>
          </h3>
          {exp.metrics_log && exp.metrics_log.length > 0 ? (
            <div className="space-y-1">
              {Object.entries(exp.metrics_log.at(-1) || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <span className="text-xs text-muted-foreground font-mono truncate mr-2">{k}</span>
                  <span className="text-xs text-foreground font-mono font-bold shrink-0">
                    {typeof v === "number" ? v.toFixed(4) : String(v)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-muted border border-border text-center">
              <p className="text-muted-foreground text-xs font-medium">No metrics logged yet</p>
            </div>
          )}
        </div>

        {/* Append Metrics */}
        {canContribute ? (
          <div className="p-5 border rounded-xl bg-card border-border shadow-sm flex flex-col">
            <h3 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">Append Metrics Entry</h3>
            <textarea
              className="flex-1 w-full p-3 text-xs font-mono rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none mb-3"
              rows={4}
              value={appendEntry}
              onChange={(e) => setAppendEntry(e.target.value)}
              placeholder={'{"epoch": 1, "loss": 0.5, "accuracy": 0.82}'}
            />
            <button 
              onClick={handleAppend} 
              disabled={appending || !appendEntry.trim()} 
              className="flex items-center justify-center gap-2 px-4 py-2 mt-auto text-sm font-semibold text-primary-foreground transition-colors rounded-lg bg-primary hover:opacity-90 disabled:opacity-50 w-full"
            >
              {appending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Append Metrics
            </button>
          </div>
        ) : (
          <div className="p-5 border rounded-xl bg-card border-border shadow-sm flex flex-col items-center justify-center text-center opacity-70">
            <h3 className="font-bold text-muted-foreground mb-2 text-sm uppercase tracking-wider">Read Only</h3>
            <p className="text-xs text-muted-foreground">You do not have permission to append metrics to this experiment.</p>
          </div>
        )}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="p-5 border rounded-xl bg-card border-border shadow-sm">
          <h3 className="font-bold text-foreground mb-6 text-sm uppercase tracking-wider">
            Training Curves ({chartData.length} epochs)
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" />
                <XAxis dataKey="epoch" tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground" tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    borderColor: "hsl(var(--border))", 
                    borderRadius: "8px", 
                    fontSize: "12px",
                    color: "hsl(var(--foreground))",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} />
                {metricKeys.map((key, idx) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={colors[idx % colors.length]}
                    strokeWidth={2}
                    dot={chartData.length < 20 ? { strokeWidth: 2, r: 4 } : false}
                    activeDot={{ r: 6 }}
                    strokeDasharray={key.startsWith("val_") ? "4 4" : undefined}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Metrics Log Table */}
      {exp.metrics_log && exp.metrics_log.length > 0 && (
        <div className="p-5 border rounded-xl bg-card border-border shadow-sm overflow-x-auto">
          <h3 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">Metrics Log Table</h3>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted text-muted-foreground font-mono uppercase">
                <tr>
                  {Object.keys(exp.metrics_log[0]).map((k) => (
                    <th key={k} className="py-3 px-4 font-semibold">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {exp.metrics_log.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-muted/50 transition-colors">
                    {Object.values(entry).map((v, vi) => (
                      <td key={vi} className="py-2.5 px-4 text-foreground font-mono">
                        {typeof v === "number" ? v.toFixed(4) : String(v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
