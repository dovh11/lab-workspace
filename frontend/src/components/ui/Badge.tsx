import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline";
}

export function Badge({ children, className, variant = "outline" }: BadgeProps) {
  return (
    <span
      className={cn(
        "badge",
        variant === "outline" ? "border" : "border-transparent",
        className
      )}
    >
      {children}
    </span>
  );
}
