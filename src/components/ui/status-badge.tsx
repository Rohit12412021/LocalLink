import { CheckCircle2, Clock, XCircle, Ban, CheckCheck } from "lucide-react";

import type { RequestStatus } from "@/types";

const STATUS_META: Record<
  RequestStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  Pending: {
    label: "Pending",
    className: "badge-accent",
    icon: <Clock size={12} />,
  },
  Accepted: {
    label: "Accepted",
    className: "badge-info",
    icon: <CheckCheck size={12} />,
  },
  Rejected: {
    label: "Rejected",
    className: "badge-danger",
    icon: <XCircle size={12} />,
  },
  Completed: {
    label: "Completed",
    className: "badge-success",
    icon: <CheckCircle2 size={12} />,
  },
  Cancelled: {
    label: "Cancelled",
    className: "badge-muted",
    icon: <Ban size={12} />,
  },
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`badge ${meta?.className ?? "badge-muted"}`}>
      {meta?.icon ?? null}
      {meta?.label ?? status}
    </span>
  );
}