"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  FlaskConical,
  FileText,
  BookOpen,
  LogOut,
  Sun,
  Moon,
  Monitor
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/experiments", label: "Experiments", icon: FlaskConical },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/journal-clubs", label: "Journal Clubs", icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : (user?.username?.slice(0, 2).toUpperCase() ?? "??");

  return (
    <aside className="fixed top-0 left-0 flex flex-col w-64 h-screen border-r bg-card border-border z-40">
      {/* Logo Area */}
      <div className="flex items-center gap-3 p-6 border-b border-border">
        <div className="flex items-center justify-center w-10 h-10 text-white rounded-xl bg-primary shadow-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <div className="font-bold text-foreground">Lab Workspace</div>
          <div className="text-xs text-muted-foreground">AI Platform</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
        <div className="px-2 mb-4 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Area: Theme Toggle & User Info */}
      <div className="p-4 border-t border-border space-y-4">
        {/* Theme Toggle */}
        <div className="flex items-center justify-center p-1 bg-muted rounded-lg">
          <button
            onClick={() => setTheme("light")}
            className={`flex-1 flex justify-center py-1.5 rounded-md text-muted-foreground transition-colors ${theme === 'light' ? 'bg-background shadow-sm text-foreground' : 'hover:text-foreground'}`}
          >
            <Sun size={16} />
          </button>
          <button
            onClick={() => setTheme("system")}
            className={`flex-1 flex justify-center py-1.5 rounded-md text-muted-foreground transition-colors ${theme === 'system' ? 'bg-background shadow-sm text-foreground' : 'hover:text-foreground'}`}
          >
            <Monitor size={16} />
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`flex-1 flex justify-center py-1.5 rounded-md text-muted-foreground transition-colors ${theme === 'dark' ? 'bg-background shadow-sm text-foreground' : 'hover:text-foreground'}`}
          >
            <Moon size={16} />
          </button>
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-3 p-3 border rounded-xl bg-card border-border">
          <div className="flex items-center justify-center w-10 h-10 font-bold text-white rounded-full bg-primary">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate text-foreground">
              {user?.full_name || user?.username}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {user?.system_role}
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 text-muted-foreground transition-colors rounded-lg hover:bg-destructive/10 hover:text-destructive"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
