"use client";

import React, { useEffect, useState } from "react";
import {
  BookOpen, Plus, Calendar, MapPin, Link2, ExternalLink,
  Loader2, Users, Clock, Check, X, HelpCircle, Timer,
} from "lucide-react";
import { journalClubsApi } from "@/lib/api";
import { JournalClub, RSVPStatus } from "@/types";
import { formatDateTime, formatRelative, getErrorMessage } from "@/lib/utils";
import { toastError, toastSuccess } from "@/components/ui/Toaster";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  title: z.string().min(1, "Title required"),
  topic: z.string().optional(),
  meeting_time: z.string().min(1, "Meeting time required"),
  location_or_link: z.string().optional(),
  paper_reference: z.string().optional(),
  paper_pdf_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const rsvpOptions: { status: RSVPStatus; label: string; icon: React.ReactNode; style: string; activeStyle: string }[] = [
  { status: "Attending", label: "Attending", icon: <Check size={14} />, style: "text-emerald-500 hover:bg-emerald-500/10 border-border", activeStyle: "bg-emerald-500/10 text-emerald-500 border-emerald-500/50 ring-1 ring-emerald-500/50" },
  { status: "Maybe", label: "Maybe", icon: <HelpCircle size={14} />, style: "text-amber-500 hover:bg-amber-500/10 border-border", activeStyle: "bg-amber-500/10 text-amber-500 border-amber-500/50 ring-1 ring-amber-500/50" },
  { status: "Declined", label: "Decline", icon: <X size={14} />, style: "text-red-500 hover:bg-red-500/10 border-border", activeStyle: "bg-red-500/10 text-red-500 border-red-500/50 ring-1 ring-red-500/50" },
];

const rsvpColors: Record<RSVPStatus, string> = {
  Attending: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Declined: "bg-red-500/10 text-red-500 border-red-500/20",
  Maybe: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Pending: "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

function getCountdown(meeting: string) {
  const diff = new Date(meeting).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return { label: `${days}d ${hours}h`, urgent: days <= 1 };
  if (hours > 0) return { label: `${hours}h ${mins}m`, urgent: true };
  return { label: `${mins}m`, urgent: true };
}

export default function JournalClubsPage() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<JournalClub[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [rsvping, setRsvping] = useState<number | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const fetchClubs = async () => {
    try {
      const res = await journalClubsApi.list({ limit: 50 });
      setClubs(res.data);
    } catch (err) { toastError(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchClubs(); }, []);

  const onSubmit = async (data: FormData) => {
    setCreating(true);
    try {
      await journalClubsApi.create({
        ...data,
        meeting_time: new Date(data.meeting_time).toISOString(),
        paper_pdf_url: data.paper_pdf_url || undefined,
      });
      toastSuccess("Journal club scheduled!");
      reset();
      setShowCreate(false);
      fetchClubs();
    } catch (err) { toastError(getErrorMessage(err)); }
    finally { setCreating(false); }
  };

  const handleRSVP = async (clubId: number, status: RSVPStatus) => {
    setRsvping(clubId);
    try {
      await journalClubsApi.rsvp(clubId, status);
      toastSuccess(`RSVP: ${status}`);
      fetchClubs();
    } catch (err) { toastError(getErrorMessage(err)); }
    finally { setRsvping(null); }
  };

  const getUserRSVP = (club: JournalClub): RSVPStatus | null =>
    club.attendees.find((a) => a.user_id === user?.user_id)?.rsvp_status || null;

  const upcoming = clubs.filter((c) => new Date(c.meeting_time) > new Date());
  const past = clubs.filter((c) => new Date(c.meeting_time) <= new Date());

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-foreground">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500">
              <BookOpen size={20} />
            </div>
            Journal Clubs
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {clubs.length} sessions · {upcoming.length} upcoming
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-colors rounded-lg bg-primary hover:opacity-90"
        >
          <Plus size={16} /> Schedule Session
        </button>
      </div>

      {/* ── Upcoming sessions ── */}
      {!isLoading && upcoming.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Upcoming Sessions</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {upcoming.map((club) => {
              const countdown = getCountdown(club.meeting_time);
              const attendingCount = club.attendees.filter((a) => a.rsvp_status === "Attending").length;
              const userRSVP = getUserRSVP(club);

              return (
                <div
                  key={club.club_id}
                  className="flex flex-col p-5 transition-all border rounded-xl bg-card border-border hover:border-emerald-500/50 hover:shadow-lg animate-fade-in"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-lg leading-tight mb-1 truncate">{club.title}</h3>
                      {club.topic && <p className="text-sm text-muted-foreground truncate">{club.topic}</p>}
                    </div>
                    {countdown && (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shrink-0 border ${
                        countdown.urgent 
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                          : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      }`}>
                        <Timer size={12} /> {countdown.label}
                      </span>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="space-y-2.5 mb-5">
                    <div className="flex items-center gap-2.5 text-sm font-medium text-emerald-500">
                      <Calendar size={16} />
                      <span>{formatDateTime(club.meeting_time)}</span>
                    </div>
                    {club.location_or_link && (
                      <div className="flex items-center gap-2.5 text-sm text-muted-foreground truncate">
                        {club.location_or_link.startsWith("http") ? (
                          <>
                            <Link2 size={16} />
                            <a href={club.location_or_link} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors truncate">
                              {club.location_or_link}
                            </a>
                          </>
                        ) : (
                          <>
                            <MapPin size={16} />
                            <span className="truncate">{club.location_or_link}</span>
                          </>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Users size={16} />
                      <span>{attendingCount} attending</span>
                      {userRSVP && (
                        <span className={`ml-auto inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${rsvpColors[userRSVP]}`}>
                          {userRSVP}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Paper reference */}
                  {club.paper_reference && (
                    <div className="px-4 py-3 rounded-lg mb-5 bg-muted border border-border border-l-4 border-l-primary">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Paper</p>
                      <p className="text-sm font-medium text-foreground leading-snug">{club.paper_reference}</p>
                      {club.paper_pdf_url && (
                        <a href={club.paper_pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mt-2">
                          <ExternalLink size={12} /> Open PDF
                        </a>
                      )}
                    </div>
                  )}

                  {/* RSVP buttons */}
                  <div className="mt-auto pt-4 border-t border-border flex gap-2">
                    {rsvpOptions.map(({ status, label, icon, style, activeStyle }) => {
                      const isActive = userRSVP === status;
                      return (
                        <button
                          key={status}
                          onClick={() => handleRSVP(club.club_id, status)}
                          disabled={rsvping === club.club_id}
                          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-all duration-200 flex-1 ${
                            isActive ? activeStyle : `bg-card text-muted-foreground ${style}`
                          }`}
                        >
                          {rsvping === club.club_id ? <Loader2 size={14} className="animate-spin" /> : icon}
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Past sessions ── */}
      {!isLoading && past.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Past Sessions</p>
          <div className="flex flex-col gap-3">
            {past.map((club) => {
              const attendingCount = club.attendees.filter((a) => a.rsvp_status === "Attending").length;
              return (
                <div key={club.club_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors opacity-75 hover:opacity-100">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-sm mb-1 truncate">{club.title}</h3>
                    {club.topic && <p className="text-sm text-muted-foreground truncate">{club.topic}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs font-medium text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1.5"><Clock size={14} /> {formatDateTime(club.meeting_time)}</span>
                      <span className="flex items-center gap-1.5"><Users size={14} /> {attendingCount} attended</span>
                    </div>
                  </div>
                  {club.paper_reference && (
                    <div className="text-xs font-medium text-muted-foreground max-w-[250px] truncate sm:text-right shrink-0 bg-muted px-3 py-1.5 rounded-lg border border-border">
                      {club.paper_reference}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading / empty */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 border rounded-xl bg-card border-border">
              <div className="h-5 mb-4 rounded w-3/4 bg-muted animate-pulse" />
              <div className="h-4 mb-2 rounded w-full bg-muted animate-pulse" />
              <div className="h-4 mb-6 rounded w-1/2 bg-muted animate-pulse" />
              <div className="h-10 rounded w-full bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      )}
      {!isLoading && clubs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-xl bg-card border-border">
          <BookOpen size={48} className="text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground mb-4">No journal clubs scheduled yet</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-colors rounded-lg bg-primary hover:opacity-90"
          >
            <Plus size={16} /> Schedule first session
          </button>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => { setShowCreate(false); reset(); }}
        title="Schedule Journal Club"
        subtitle="Organize a paper review session for the team"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title *</label>
              <input
                {...register("title")}
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Weekly Paper Review"
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Topic</label>
              <input
                {...register("topic")}
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Attention mechanisms in LLMs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Meeting Time *</label>
              <input
                {...register("meeting_time")}
                type="datetime-local"
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              {errors.meeting_time && <p className="text-xs text-destructive">{errors.meeting_time.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location or Link</label>
              <input
                {...register("location_or_link")}
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Room 4B or https://meet.google.com/…"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paper Reference</label>
              <input
                {...register("paper_reference")}
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Attention Is All You Need (2017)"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paper PDF URL</label>
              <input
                {...register("paper_pdf_url")}
                type="url"
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="https://arxiv.org/pdf/…"
              />
              {errors.paper_pdf_url && <p className="text-xs text-destructive">{errors.paper_pdf_url.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</label>
            <textarea
              {...register("notes")}
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
              rows={2}
              placeholder="Discussion points, reading assignments…"
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
              {creating ? "Scheduling…" : "Schedule Session"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
