"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText, Plus, Search, Upload, Loader2, GitCommit, Eye, GitBranch,
} from "lucide-react";
import { documentsApi, projectsApi } from "@/lib/api";
import { Document, ProjectListItem, DocumentVersion } from "@/types";
import { formatRelative, formatBytes, getErrorMessage } from "@/lib/utils";
import { toastError, toastSuccess } from "@/components/ui/Toaster";
import { Modal } from "@/components/ui/Modal";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://127.0.0.1:8000";

const createSchema = z.object({
  title: z.string().min(1, "Title required"),
  project_id: z.string().min(1, "Project required"),
  doc_type: z.string().optional(),
  description: z.string().optional(),
});
type CreateFormData = z.infer<typeof createSchema>;

const docTypeColors: Record<string, string> = {
  LaTeX: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  Word: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Script: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Dataset: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  PDF: "bg-red-500/10 text-red-500 border-red-500/20",
  Other: "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

export default function DocumentsPage() {
  const searchParams = useSearchParams();
  const defaultProjectId = searchParams.get("project_id") || "";

  const [documents, setDocuments] = useState<Document[]>([]);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [search, setSearch] = useState("");
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { project_id: defaultProjectId, doc_type: "Other" },
  });

  const fetchDocuments = async () => {
    try {
      const [docRes, projRes] = await Promise.all([documentsApi.list(), projectsApi.list()]);
      setDocuments(docRes.data);
      setProjects(projRes.data);
    } catch (err) { toastError(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchDocuments(); }, []);

  const selectDocument = useCallback(async (doc: Document) => {
    setSelectedDoc(doc);
    setLoadingVersions(true);
    try {
      const res = await documentsApi.listVersions(doc.document_id);
      setVersions(res.data);
    } catch (err) { toastError(getErrorMessage(err)); }
    finally { setLoadingVersions(false); }
  }, []);

  const onSubmit = async (data: CreateFormData) => {
    setCreating(true);
    try {
      await documentsApi.create({ title: data.title, project_id: Number(data.project_id), doc_type: data.doc_type, description: data.description });
      toastSuccess("Document created!");
      reset();
      setShowCreate(false);
      fetchDocuments();
    } catch (err) { toastError(getErrorMessage(err)); }
    finally { setCreating(false); }
  };

  const handleUpload = async () => {
    if (!fileInput || !selectedDoc) return;
    setUploading(true);
    try {
      await documentsApi.uploadVersion(selectedDoc.document_id, fileInput, commitMessage);
      toastSuccess("Version uploaded!");
      setFileInput(null);
      setCommitMessage("");
      selectDocument(selectedDoc);
      fetchDocuments();
    } catch (err) { toastError(getErrorMessage(err)); }
    finally { setUploading(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setFileInput(file);
  };

  const filtered = documents.filter((d) => d.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-foreground">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500">
              <FileText size={20} />
            </div>
            Documents
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {documents.length} total documents
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-colors rounded-lg bg-primary hover:opacity-90"
        >
          <Plus size={16} /> New Document
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* ── Document list ── */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="Search documents…"
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
                <FileText size={36} className="text-muted-foreground mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground mb-4">No documents yet</p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-white transition-colors rounded-lg bg-primary hover:opacity-90"
                >
                  <Plus size={14} /> Create one
                </button>
              </div>
            ) : (
              filtered.map((doc) => (
                <button
                  key={doc.document_id}
                  onClick={() => selectDocument(doc)}
                  className={`w-full text-left p-4 transition-all border rounded-xl bg-card hover:border-border hover:bg-muted/50 ${
                    selectedDoc?.document_id === doc.document_id
                      ? "ring-2 ring-primary border-primary/50"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-bold text-foreground text-sm truncate flex-1 leading-tight">{doc.title}</h4>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap shrink-0 ${docTypeColors[doc.doc_type] || docTypeColors.Other}`}>
                      {doc.doc_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                    <span className="flex items-center gap-1.5 text-sky-500">
                      <GitBranch size={12} />
                      {doc.version_count} version{doc.version_count !== 1 ? "s" : ""}
                    </span>
                    {doc.latest_version && <span>· v{doc.latest_version.version_number}</span>}
                    <span>· {formatRelative(doc.created_at)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Detail panel ── */}
        <div className="xl:col-span-3">
          {selectedDoc ? (
            <div className="space-y-6 animate-fade-in">
              {/* Doc header */}
              <div className="p-6 border rounded-xl bg-card border-border">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-foreground leading-none">{selectedDoc.title}</h2>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${docTypeColors[selectedDoc.doc_type] || docTypeColors.Other}`}>
                        {selectedDoc.doc_type}
                      </span>
                      {selectedDoc.description && <span className="text-sm text-muted-foreground">{selectedDoc.description}</span>}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-lg">
                    {selectedDoc.version_count} version{selectedDoc.version_count !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              {/* ── Drag & Drop upload ── */}
              <div
                className={`p-8 border-2 border-dashed rounded-xl text-center transition-colors cursor-pointer bg-card ${
                  dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input type="file" ref={fileRef} className="hidden" onChange={(e) => setFileInput(e.target.files?.[0] || null)} />
                <Upload size={32} className={`mx-auto mb-3 transition-colors ${fileInput ? "text-primary" : "text-muted-foreground"}`} />
                {fileInput ? (
                  <div>
                    <p className="text-sm font-bold text-primary">{fileInput.name}</p>
                    <p className="text-xs font-medium text-muted-foreground mt-1">{formatBytes(fileInput.size)}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Drag & drop a file, or <span className="text-primary hover:underline">click to browse</span></p>
                    <p className="text-xs text-muted-foreground/70 mt-2">Upload as version {(selectedDoc.version_count || 0) + 1}</p>
                  </div>
                )}
              </div>

              {fileInput && (
                <div className="p-4 border rounded-xl bg-card border-primary/20 ring-1 ring-primary/10">
                  <div className="space-y-3">
                    <input
                      className="w-full px-4 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      placeholder="Commit message (e.g. 'Added discussion section')"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white transition-colors rounded-lg bg-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        {uploading ? "Uploading…" : `Upload as v${(selectedDoc.version_count || 0) + 1}`}
                      </button>
                      <button
                        onClick={() => setFileInput(null)}
                        className="px-6 py-2.5 text-sm font-semibold transition-colors border rounded-lg border-border bg-card text-foreground hover:bg-muted"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Version Timeline ── */}
              <div className="p-6 border rounded-xl bg-card border-border">
                <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2">
                  <GitCommit size={18} className="text-primary" /> Version History
                </h3>
                {loadingVersions ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="p-4 rounded-lg bg-muted border border-border">
                        <div className="h-4 w-1/3 bg-background rounded mb-2 animate-pulse" />
                        <div className="h-3 w-1/4 bg-background rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : versions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed rounded-xl bg-background border-border">
                    <GitBranch size={32} className="text-muted-foreground mb-3 opacity-50" />
                    <p className="text-sm font-medium text-muted-foreground">No versions uploaded yet</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-border rounded-full" />
                    <div className="space-y-6">
                      {versions.map((v, idx) => (
                        <div key={v.version_id} className="relative flex items-start gap-5 pl-2 group">
                          <div className={`w-8 h-8 rounded-full border-2 flex shrink-0 items-center justify-center text-xs font-bold z-10 transition-colors ${
                            idx === 0
                              ? "border-primary bg-primary/10 text-primary ring-4 ring-background"
                              : "border-border bg-muted text-muted-foreground ring-4 ring-background group-hover:border-primary/50 group-hover:text-foreground"
                          }`}>
                            {v.version_number}
                          </div>
                          <div className={`flex-1 rounded-xl p-4 transition-colors border ${
                            idx === 0 ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-card border-border hover:bg-muted/50"
                          }`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground">
                                  {v.commit_message || `Version ${v.version_number}`}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-xs font-medium text-muted-foreground flex-wrap">
                                  {v.uploader && (
                                    <span className="flex items-center gap-1.5 text-foreground">
                                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary font-bold text-[10px]">
                                        {v.uploader.full_name[0]}
                                      </span>
                                      {v.uploader.username}
                                    </span>
                                  )}
                                  <span>{formatRelative(v.created_at)}</span>
                                  {v.file_size && <span>{formatBytes(v.file_size)}</span>}
                                </div>
                              </div>
                              {v.file_path && (
                                <a
                                  href={`${API_BASE}${v.file_path}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors border rounded-lg border-border bg-background text-foreground hover:bg-muted shrink-0 shadow-sm"
                                >
                                  <Eye size={14} /> Download
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] border border-dashed rounded-xl bg-card border-border">
              <FileText size={48} className="text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">Select a document to view its version history</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => { setShowCreate(false); reset(); }}
        title="Register New Document"
        subtitle="Add a document to start tracking its versions"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-1 sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title *</label>
              <input
                {...register("title")}
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Research Report v1"
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

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
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Document Type</label>
              <select
                {...register("doc_type")}
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
              >
                <option>LaTeX</option>
                <option>Word</option>
                <option>Script</option>
                <option>Dataset</option>
                <option>PDF</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
            <input
              {...register("description")}
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="Brief description…"
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
              {creating ? "Creating…" : "Create Document"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
