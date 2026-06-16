"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Users, FlaskConical, FileText, UserPlus, Loader2, Trash2,
  FolderKanban, Calendar, Shield, Plus
} from "lucide-react";
import { projectsApi, usersApi, experimentsApi, documentsApi } from "@/lib/api";
import { Project, User, AIExperiment, Document } from "@/types";
import { formatDate, getStatusColor, getRoleColor, getErrorMessage } from "@/lib/utils";
import { toastError, toastSuccess } from "@/components/ui/Toaster";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const projectId = Number(id);

  const [project, setProject] = useState<Project | null>(null);
  const [experiments, setExperiments] = useState<AIExperiment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingMember, setAddingMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("Contributor");
  const [activeTab, setActiveTab] = useState<"overview" | "experiments" | "documents">("overview");

  const fetchAll = async () => {
    try {
      const [projRes, expRes, docRes] = await Promise.all([
        projectsApi.get(projectId),
        experimentsApi.list({ project_id: projectId }),
        documentsApi.list({ project_id: projectId }),
      ]);
      setProject(projRes.data);
      setExperiments(expRes.data);
      setDocuments(docRes.data);
    } catch (err) { toastError(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    fetchAll();
    usersApi.list().then((res) => setUsers(res.data)).catch(() => {});
  }, [projectId]);

  const handleAddMember = async () => {
    if (!selectedUserId) return;
    setAddingMember(true);
    try {
      await projectsApi.addMember(projectId, { user_id: Number(selectedUserId), role_in_project: selectedRole });
      toastSuccess("Member added!");
      const res = await projectsApi.get(projectId);
      setProject(res.data);
      setSelectedUserId("");
    } catch (err) { toastError(getErrorMessage(err)); }
    finally { setAddingMember(false); }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm("Remove this member?")) return;
    try {
      await projectsApi.removeMember(projectId, userId);
      const res = await projectsApi.get(projectId);
      setProject(res.data);
      toastSuccess("Member removed");
    } catch (err) { toastError(getErrorMessage(err)); }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="animate-spin text-primary" />
    </div>
  );

  if (!project) return <div className="text-muted-foreground text-center py-10">Project not found</div>;

  const memberUserIds = new Set(project.members.map((m) => m.user_id));
  const nonMembers = users.filter((u) => !memberUserIds.has(u.user_id));

  const tabs = [
    { key: "overview",    label: "Overview",                    icon: FolderKanban },
    { key: "experiments", label: `Experiments (${experiments.length})`, icon: FlaskConical },
    { key: "documents",   label: `Documents (${documents.length})`,     icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/dashboard/projects" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Back to Projects
      </Link>

      {/* Project header */}
      <div className="p-6 border rounded-xl bg-card border-border shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary shrink-0">
              <FolderKanban size={24} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">{project.title}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>
              <p className="text-muted-foreground text-sm mb-3 max-w-2xl">{project.description || "No description provided."}</p>
              <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5"><Calendar size={14} /> Created {formatDate(project.created_at)}</span>
                <span className="flex items-center gap-1.5"><Users size={14} /> {project.members.length} member{project.members.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 md:flex shrink-0">
            {[
              { label: "Members",     value: project.members.length },
              { label: "Experiments", value: experiments.length },
              { label: "Documents",   value: documents.length },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center justify-center p-3 rounded-lg border border-border bg-muted/50 min-w-[100px]">
                <p className="text-2xl font-bold text-foreground mb-0.5">{s.value}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                isActive 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
              }`}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="pt-2 animate-fade-in">
        {/* Tab: Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Members */}
            <div className="p-5 border rounded-xl bg-card border-border shadow-sm">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Users size={18} className="text-primary" /> Team Members ({project.members.length})
              </h3>
              
              <div className="space-y-2 mb-6 max-h-[300px] overflow-y-auto pr-2">
                {project.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:bg-muted hover:border-border transition-all group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                        {member.user.full_name[0]}
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-semibold text-foreground truncate">{member.user.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">@{member.user.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getRoleColor(member.role_in_project)}`}>
                        <Shield size={10} /> {member.role_in_project}
                      </span>
                      <button
                        onClick={() => handleRemoveMember(member.user_id)}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {project.members.length === 0 && (
                  <div className="text-center py-6 border border-dashed rounded-xl border-border">
                    <p className="text-sm text-muted-foreground">No members yet</p>
                  </div>
                )}
              </div>

              {/* Add member */}
              {nonMembers.length > 0 && (
                <div className="pt-5 border-t border-border">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Add Member</h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select 
                      value={selectedUserId} 
                      onChange={(e) => setSelectedUserId(e.target.value)} 
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">Select user…</option>
                      {nonMembers.map((u) => <option key={u.user_id} value={u.user_id}>{u.full_name} (@{u.username})</option>)}
                    </select>
                    <select 
                      value={selectedRole} 
                      onChange={(e) => setSelectedRole(e.target.value)} 
                      className="px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-full sm:w-32"
                    >
                      <option>Contributor</option>
                      <option>Lead</option>
                      <option>Reviewer</option>
                    </select>
                    <button 
                      onClick={handleAddMember} 
                      disabled={addingMember || !selectedUserId} 
                      className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors rounded-lg bg-primary hover:opacity-90 disabled:opacity-50"
                    >
                      {addingMember ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                      <span className="sm:hidden">Add</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Project Details */}
            <div className="p-5 border rounded-xl bg-card border-border shadow-sm h-fit">
              <h3 className="font-bold text-foreground mb-4">Project Overview</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted border border-border">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Description</p>
                  <p className="text-sm font-medium text-foreground leading-relaxed">{project.description || "No description provided."}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted border border-border">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Created By</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                      {project.creator?.full_name?.[0] || "?"}
                    </div>
                    <p className="text-sm font-medium text-foreground">{project.creator?.full_name ?? "Unknown"}</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted border border-border">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Created On</p>
                  <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Calendar size={14} className="text-muted-foreground" />
                    {formatDate(project.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Experiments */}
        {activeTab === "experiments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">Active Experiments</h3>
              <Link 
                href={`/dashboard/experiments?project_id=${projectId}`} 
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors rounded-md bg-primary hover:opacity-90"
              >
                <Plus size={14} /> Log Experiment
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {experiments.map((exp) => (
                <Link 
                  key={exp.experiment_id} 
                  href={`/dashboard/experiments/${exp.experiment_id}`}
                  className="flex flex-col p-4 transition-all border rounded-xl bg-card border-border hover:border-primary/50 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h4 className="font-bold text-foreground text-base truncate">{exp.experiment_name}</h4>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(exp.status || "running")}`}>
                      {exp.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border">
                    {exp.framework && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-muted text-muted-foreground border-border font-mono">
                        {exp.framework}
                      </span>
                    )}
                    <span className="text-xs font-medium text-muted-foreground ml-auto">
                      {exp.metrics_log?.length || 0} metrics
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {experiments.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-xl bg-card border-border">
                <FlaskConical size={48} className="text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4 font-medium">No experiments tracked yet</p>
                <Link 
                  href={`/dashboard/experiments?project_id=${projectId}`} 
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors rounded-lg bg-primary hover:opacity-90"
                >
                  <Plus size={16} /> Log first experiment
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab: Documents */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">Project Documents</h3>
              <Link 
                href={`/dashboard/documents?project_id=${projectId}`} 
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors rounded-md bg-primary hover:opacity-90"
              >
                <Plus size={14} /> Add Document
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div key={doc.document_id} className="flex items-center justify-between p-4 border rounded-xl bg-card border-border">
                  <div className="min-w-0">
                    <h4 className="font-bold text-foreground text-sm truncate mb-1">{doc.title}</h4>
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <span>v{doc.latest_version?.version_number || 0}</span>
                      <span>&bull;</span>
                      <span>{doc.version_count} version{doc.version_count !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <span className="shrink-0 ml-4 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-muted text-foreground border-border">
                    {doc.doc_type}
                  </span>
                </div>
              ))}
            </div>

            {documents.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-xl bg-card border-border">
                <FileText size={48} className="text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4 font-medium">No documents uploaded yet</p>
                <Link 
                  href={`/dashboard/documents?project_id=${projectId}`} 
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors rounded-lg bg-primary hover:opacity-90"
                >
                  <Plus size={16} /> Add first document
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
