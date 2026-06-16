"use client";

import React, { useEffect, useState } from "react";
import { usersApi } from "@/lib/api";
import { User } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { toastError, toastSuccess } from "@/components/ui/Toaster";
import { getErrorMessage, formatDate } from "@/lib/utils";
import { Users, Trash2, Edit2, Shield, Search, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

export default function UsersManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    username: "",
    full_name: "",
    email: "",
    system_role: "Researcher",
  });
  const [updating, setUpdating] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await usersApi.list();
      setUsers(res.data);
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.system_role === "Manager") {
      fetchUsers();
    } else {
      setIsLoading(false);
    }
  }, [currentUser]);

  if (currentUser?.system_role !== "Manager") {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <Shield size={48} className="text-muted-foreground opacity-50 mb-4" />
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-muted-foreground mt-2">Only Managers can access user management.</p>
      </div>
    );
  }

  const handleDelete = async (userId: number) => {
    if (userId === currentUser.user_id) {
      toastError("You cannot delete yourself from the admin panel. Go to Settings.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await usersApi.delete(userId);
      toastSuccess("User deleted");
      setUsers((prev) => prev.filter((u) => u.user_id !== userId));
    } catch (err) {
      toastError(getErrorMessage(err));
    }
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      system_role: user.system_role,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setUpdating(true);
    try {
      const dataToUpdate: Record<string, string> = {};
      if (editForm.username !== editingUser.username) dataToUpdate.username = editForm.username;
      if (editForm.full_name !== editingUser.full_name) dataToUpdate.full_name = editForm.full_name;
      if (editForm.email !== editingUser.email) dataToUpdate.email = editForm.email;
      if (editForm.system_role !== editingUser.system_role) dataToUpdate.system_role = editForm.system_role;

      if (Object.keys(dataToUpdate).length > 0) {
        await usersApi.update(editingUser.user_id, dataToUpdate);
        toastSuccess("User updated");
        fetchUsers();
      }
      setEditingUser(null);
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-foreground">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500">
              <Shield size={20} />
            </div>
            User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {users.length} total users in the system
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          placeholder="Search by name, username, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted border-b border-border text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">User</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Contact</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">System Role</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Joined</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <Loader2 size={24} className="animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No users found matching "{search}"
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.user_id} className="hover:bg-muted/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {u.full_name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{u.full_name}</p>
                          <p className="text-xs text-muted-foreground">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        u.system_role === "Manager" 
                          ? "bg-orange-500/10 text-orange-500 border-orange-500/20" 
                          : u.system_role === "Researcher"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                      }`}>
                        {u.system_role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{formatDate(u.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(u)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
                          title="Edit User"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(u.user_id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-card border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/10 transition-all"
                          title="Delete User"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit User"
        subtitle={`Modify account details for @${editingUser?.username}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</label>
            <input
              value={editForm.full_name}
              onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</label>
            <input
              value={editForm.username}
              onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">System Role</label>
            <select
              value={editForm.system_role}
              onChange={(e) => setEditForm(prev => ({ ...prev, system_role: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
            >
              <option>Manager</option>
              <option>Researcher</option>
              <option>Intern</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border mt-6">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="flex-1 px-4 py-2.5 text-sm font-semibold transition-colors border rounded-lg border-border bg-card text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {updating ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
              {updating ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
