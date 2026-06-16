"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usersApi } from "@/lib/api";
import { toastError, toastSuccess } from "@/components/ui/Toaster";
import { getErrorMessage } from "@/lib/utils";
import { Settings as SettingsIcon, Save, Trash2, Loader2, User } from "lucide-react";

export default function SettingsPage() {
  const { user, login } = useAuth(); // We can re-fetch me if needed, but we will just use state
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    username: user?.username || "",
    full_name: user?.full_name || "",
    email: user?.email || "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const dataToUpdate: Record<string, string> = {};
      if (formData.username && formData.username !== user.username) dataToUpdate.username = formData.username;
      if (formData.full_name && formData.full_name !== user.full_name) dataToUpdate.full_name = formData.full_name;
      if (formData.email && formData.email !== user.email) dataToUpdate.email = formData.email;
      if (formData.password) dataToUpdate.password = formData.password;

      if (Object.keys(dataToUpdate).length === 0) {
        toastSuccess("No changes made");
        setLoading(false);
        return;
      }

      await usersApi.update(user.user_id, dataToUpdate);
      toastSuccess("Profile updated successfully!");
      if (formData.password) {
        setFormData((prev) => ({ ...prev, password: "" }));
      }
      
      // Update context or force re-login/fetch
      window.location.reload();
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete your account? This action cannot be undone."
    );
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      await usersApi.delete(user.user_id);
      toastSuccess("Account deleted. Redirecting...");
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your profile and account preferences</p>
        </div>
      </div>

      {/* Profile Info Form */}
      <div className="p-6 border rounded-xl bg-card border-border shadow-sm">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <User size={18} className="text-primary" /> Profile Information
        </h2>
        
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</label>
              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Username"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</label>
              <input
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Full Name"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="Email address"
            />
          </div>

          <div className="space-y-1.5 pt-4 border-t border-border mt-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Password (Optional)</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="Leave blank to keep current password"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white transition-colors rounded-lg bg-primary hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="p-6 border rounded-xl bg-destructive/5 border-destructive/20 shadow-sm">
        <h2 className="text-lg font-bold text-destructive mb-2 flex items-center gap-2">
          <Trash2 size={18} /> Danger Zone
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete your account and all associated data. This action cannot be undone. 
          Resources you created (projects, documents) will remain but your authorship will be unlinked.
        </p>
        
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-destructive transition-colors rounded-lg border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 disabled:opacity-50"
        >
          {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          {deleting ? "Deleting..." : "Delete Account"}
        </button>
      </div>
    </div>
  );
}
