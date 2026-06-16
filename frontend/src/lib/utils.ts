import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), "MMM d, yyyy");
}

export function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), "MMM d, yyyy 'at' h:mm a");
}

export function formatRelative(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as { response?: { data?: { detail?: string | Array<{ msg: string }> } } };
    const detail = axiosError.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "Active": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "Completed": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "Archived": return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    case "On Hold": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "running": return "bg-violet-500/20 text-violet-400 border-violet-500/30";
    case "completed": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "failed": return "bg-rose-500/20 text-rose-400 border-rose-500/30";
    case "Attending": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "Declined": return "bg-rose-500/20 text-rose-400 border-rose-500/30";
    case "Maybe": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "Pending": return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

export function getRoleColor(role: string): string {
  switch (role) {
    case "Manager": return "bg-violet-500/20 text-violet-400";
    case "Researcher": return "bg-blue-500/20 text-blue-400";
    case "Intern": return "bg-teal-500/20 text-teal-400";
    case "Lead": return "bg-amber-500/20 text-amber-400";
    case "Contributor": return "bg-sky-500/20 text-sky-400";
    case "Reviewer": return "bg-purple-500/20 text-purple-400";
    default: return "bg-slate-500/20 text-slate-400";
  }
}
