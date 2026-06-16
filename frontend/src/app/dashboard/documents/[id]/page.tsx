"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2, Download, UploadCloud, Clock, FolderKanban, Plus } from "lucide-react";
import { documentsApi, projectsApi } from "@/lib/api";
import { Document, DocumentVersion } from "@/types";
import { formatDateTime, getErrorMessage } from "@/lib/utils";
import { toastError, toastSuccess } from "@/components/ui/Toaster";
import { useAuth } from "@/contexts/AuthContext";

export default function DocumentDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [doc, setDoc] = useState<Document | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [file, setFile] = useState<File | null>(null);
  const [commitMessage, setCommitMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    try {
      const docRes = await documentsApi.get(Number(id));
      setDoc(docRes.data);
      
      const verRes = await documentsApi.listVersions(Number(id));
      setVersions(verRes.data);

      if (docRes.data.project_id && user) {
        const projRes = await projectsApi.get(docRes.data.project_id);
        const role = projRes.data.members.find((m: any) => m.user_id === user.user_id)?.role_in_project;
        setMyRole(role || null);
      }
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, user]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      await documentsApi.uploadVersion(Number(id), file, commitMessage);
      toastSuccess("New version uploaded successfully!");
      setFile(null);
      setCommitMessage("");
      await fetchData();
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="animate-spin text-primary" />
    </div>
  );

  if (!doc) return <div className="text-muted-foreground text-center py-10">Document not found</div>;

  const isManager = user?.system_role === "Manager";
  const canContribute = isManager || myRole === "Lead" || myRole === "Contributor";

  return (
    <div className="space-y-6">
      <Link href={doc.project_id ? `/dashboard/projects/${doc.project_id}` : "/dashboard/documents"} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Back
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 border rounded-xl bg-card border-border shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500/10 text-sky-500 shrink-0">
                <FileText size={24} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-foreground">{doc.title}</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-muted text-muted-foreground border-border">
                    {doc.doc_type}
                  </span>
                </div>
                {doc.project_title && (
                  <Link href={`/dashboard/projects/${doc.project_id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mt-1">
                    <FolderKanban size={14} /> {doc.project_title}
                  </Link>
                )}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-bold text-foreground mb-3 text-sm uppercase tracking-wider">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {doc.description || "No description provided."}
              </p>
            </div>
            
            <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mt-6 pt-4 border-t border-border flex-wrap">
              <span className="flex items-center gap-1.5"><Clock size={14} /> Created {formatDateTime(doc.created_at)}</span>
              <span>•</span>
              <span>By {doc.creator?.full_name || "Unknown"}</span>
            </div>
          </div>

          {/* Versions History */}
          <div className="p-6 border rounded-xl bg-card border-border shadow-sm">
            <h3 className="font-bold text-foreground mb-6 text-sm uppercase tracking-wider">Version History</h3>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {versions.map((v, idx) => (
                <div key={v.version_id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-muted text-muted-foreground font-bold text-xs shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                    v{v.version_number}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-background shadow-sm hover:border-primary/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="text-sm font-bold text-foreground">{v.commit_message || `Version ${v.version_number} uploaded`}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">By {v.uploader?.full_name || "Unknown"} on {formatDateTime(v.created_at)}</p>
                      </div>
                      {v.file_path && (
                        <a 
                          href={`http://127.0.0.1:8000${v.file_path}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary transition-colors rounded-md bg-primary/10 hover:bg-primary/20 shrink-0"
                        >
                          <Download size={14} /> Download
                        </a>
                      )}
                    </div>
                    {v.file_size && (
                      <p className="text-[10px] font-mono text-muted-foreground uppercase mt-2 pt-2 border-t border-border">
                        {(v.file_size / 1024).toFixed(1)} KB
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {versions.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-10 relative z-10 bg-card">No versions uploaded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="p-5 border rounded-xl bg-card border-border shadow-sm">
            <h3 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider flex items-center justify-between">
              <span>Current Status</span>
              <span className="text-xs font-normal normal-case text-muted-foreground">v{doc.latest_version?.version_number || 0}</span>
            </h3>
            {doc.latest_version?.file_path ? (
              <a 
                href={`http://127.0.0.1:8000${doc.latest_version.file_path}`} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors rounded-lg bg-primary hover:opacity-90 w-full"
              >
                <Download size={16} /> Download Latest
              </a>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">No file uploaded</p>
            )}
          </div>

          {canContribute ? (
            <div className="p-5 border rounded-xl bg-card border-border shadow-sm">
              <h3 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                <UploadCloud size={16} className="text-primary" /> Upload New Version
              </h3>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">File</label>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Commit Message</label>
                  <input
                    type="text"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="E.g. Updated methodology section"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={uploading || !file} 
                  className="flex items-center justify-center gap-2 px-4 py-2 mt-2 text-sm font-semibold text-primary-foreground transition-colors rounded-lg bg-primary hover:opacity-90 disabled:opacity-50 w-full"
                >
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                  Upload
                </button>
              </form>
            </div>
          ) : (
            <div className="p-5 border rounded-xl bg-card border-border shadow-sm flex flex-col items-center justify-center text-center opacity-70">
              <h3 className="font-bold text-muted-foreground mb-2 text-sm uppercase tracking-wider">Read Only</h3>
              <p className="text-xs text-muted-foreground">You do not have permission to upload new versions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
