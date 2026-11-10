import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { evaluatePassword, passwordRules } from "@/lib/password";

export function PasswordChecklist({ password }: { password: string }) {
  if (!password) return null;
  const strength = evaluatePassword(password);

  return (
    <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
      {passwordRules.map(({ key, label }) => {
        const met = strength[key];
        return (
          <li
            key={key}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium transition-colors",
              met ? "text-success" : "text-ink-faint",
            )}
          >
            <Check
              size={14}
              className={cn(
                "shrink-0 rounded-full p-0.5",
                met ? "bg-success-soft text-success" : "bg-surface-soft text-ink-faint",
              )}
            />
            {label}
          </li>
        );
      })}
    </ul>
  );
}