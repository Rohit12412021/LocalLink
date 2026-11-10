import { AlertCircle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

type FormMessageProps = {
  variant?: "error" | "success" | "info";
  children: React.ReactNode;
  className?: string;
};

export function FormMessage({
  variant = "error",
  children,
  className,
}: FormMessageProps) {
  const Icon = variant === "success" ? CheckCircle2 : AlertCircle;
  const styles = {
    error: "border-danger/30 bg-danger-soft text-danger",
    success: "border-success/30 bg-success-soft text-success",
    info: "border-info/30 bg-info-soft text-info",
  }[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-xl border px-3.5 py-3 text-sm font-medium",
        styles,
        className,
      )}
    >
      <Icon size={17} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}