"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, MapPin, Link2, ExternalLink, Users, Loader2, Calendar, UserCheck, Check, X, HelpCircle } from "lucide-react";
import { journalClubsApi } from "@/lib/api";
import { JournalClub } from "@/types";
import { formatDateTime, getErrorMessage } from "@/lib/utils";
import { toastError, toastSuccess } from "@/components/ui/Toaster";
import { useAuth } from "@/contexts/AuthContext";

export default function JournalClubDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [club, setClub] = useState<JournalClub | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  const fetchClub = async () => {
    try {
      const res = await journalClubsApi.get(Number(id));
      setClub(res.data);
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClub();
  }, [id]);

  const handleRSVP = async (status: "Attending" | "Declined" | "Maybe") => {
    setRsvpLoading(true);
    try {
      await journalClubsApi.rsvp(Number(id), status);
      toastSuccess(`RSVP updated to ${status}`);
      await fetchClub();
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setRsvpLoading(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="animate-spin text-primary" />
    </div>
  );

  if (!club) return <div className="text-muted-foreground text-center py-10">Journal Club not found</div>;

  const isUpcoming = new Date(club.meeting_time).getTime() > Date.now();
  const myRsvp = club.attendees.find((a) => a.user_id === user?.user_id)?.rsvp_status;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/journal-clubs" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Back to Journal Clubs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 border rounded-xl bg-card border-border shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                <BookOpen size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{club.title}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border inline-block mt-1 ${isUpcoming ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-slate-500/10 text-slate-500 border-slate-500/20"}`}>
                  {isUpcoming ? "Upcoming" : "Past Session"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="flex items-start gap-3">
                <Clock className="text-muted-foreground shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Meeting Time</p>
                  <p className="text-sm font-medium text-foreground">{formatDateTime(club.meeting_time)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="text-muted-foreground shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hosted By</p>
                  <p className="text-sm font-medium text-foreground">{club.host?.full_name || "Unknown"}</p>
                </div>
              </div>
              {club.location_or_link && (
                <div className="flex items-start gap-3 sm:col-span-2">
                  {club.location_or_link.startsWith("http") ? (
                    <Link2 className="text-muted-foreground shrink-0 mt-0.5" size={18} />
                  ) : (
                    <MapPin className="text-muted-foreground shrink-0 mt-0.5" size={18} />
                  )}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location / Link</p>
                    {club.location_or_link.startsWith("http") ? (
                      <a href={club.location_or_link} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                        {club.location_or_link} <ExternalLink size={12} />
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-foreground">{club.location_or_link}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8">
              <h3 className="font-bold text-foreground mb-3 text-sm uppercase tracking-wider">Topic / Abstract</h3>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap p-4 rounded-lg bg-muted border border-border">
                {club.topic || "No abstract provided."}
              </p>
            </div>

            {club.paper_reference && (
              <div className="mt-6">
                <h3 className="font-bold text-foreground mb-3 text-sm uppercase tracking-wider">Paper Reference</h3>
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm text-foreground font-mono">{club.paper_reference}</p>
                  {club.paper_pdf_url && (
                    <a href={club.paper_pdf_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-primary hover:underline">
                      <ExternalLink size={14} /> Read Paper
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: RSVP & Attendees */}
        <div className="space-y-6">
          {isUpcoming && (
            <div className="p-5 border rounded-xl bg-card border-border shadow-sm">
              <h3 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                <UserCheck size={16} className="text-primary" /> Your RSVP
              </h3>
              
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => handleRSVP("Attending")}
                  disabled={rsvpLoading}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${myRsvp === "Attending" ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : "border-border hover:border-emerald-500/50 hover:bg-muted text-foreground"}`}
                >
                  <span className="font-semibold text-sm flex items-center gap-2"><Check size={16} /> Attending</span>
                  {myRsvp === "Attending" && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                </button>
                <button 
                  onClick={() => handleRSVP("Maybe")}
                  disabled={rsvpLoading}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${myRsvp === "Maybe" ? "border-amber-500 bg-amber-500/10 text-amber-500" : "border-border hover:border-amber-500/50 hover:bg-muted text-foreground"}`}
                >
                  <span className="font-semibold text-sm flex items-center gap-2"><HelpCircle size={16} /> Maybe</span>
                  {myRsvp === "Maybe" && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                </button>
                <button 
                  onClick={() => handleRSVP("Declined")}
                  disabled={rsvpLoading}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${myRsvp === "Declined" ? "border-red-500 bg-red-500/10 text-red-500" : "border-border hover:border-red-500/50 hover:bg-muted text-foreground"}`}
                >
                  <span className="font-semibold text-sm flex items-center gap-2"><X size={16} /> Declined</span>
                  {myRsvp === "Declined" && <div className="w-2 h-2 rounded-full bg-red-500" />}
                </button>
              </div>
            </div>
          )}

          <div className="p-5 border rounded-xl bg-card border-border shadow-sm">
            <h3 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider flex items-center justify-between">
              <span>Attendees</span>
              <span className="text-xs font-normal normal-case text-muted-foreground">{club.attendees.length} total</span>
            </h3>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {club.attendees.map((attendee) => (
                <div key={attendee.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {attendee.user.full_name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{attendee.user.full_name}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    attendee.rsvp_status === "Attending" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                    attendee.rsvp_status === "Declined" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                    "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  }`}>
                    {attendee.rsvp_status}
                  </span>
                </div>
              ))}
              {club.attendees.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">No attendees yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
