export type TaskPriority = "low" | "medium" | "high";

export type RecurrenceFrequency = "daily" | "weekly" | "monthly";

export type TaskRecurrence = {
  frequency: RecurrenceFrequency;
  interval: number;
};

export function parseTaskRecurrence(raw: unknown): TaskRecurrence | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const f = o.frequency;
  if (f !== "daily" && f !== "weekly" && f !== "monthly") return undefined;
  const n = o.interval;
  const interval =
    typeof n === "number" && Number.isFinite(n) && n >= 1
      ? Math.min(Math.floor(n), 365)
      : 1;
  return { frequency: f, interval };
}

export type Task = {
  id: string;
  title: string;
  done: boolean;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  priority?: TaskPriority;
  category?: string;
  description?: string;
  tags?: string[];
  notes?: string;
  critical?: boolean;
  recurrence?: TaskRecurrence;
};

export type AddTaskPayload = {
  title: string;
  dueDate?: Date;
  priority?: TaskPriority;
  critical?: boolean;
  context?: "Early Morning" | "Morning" | "Afternoon" | "After School" | "Evening" | "Late Night";
  category?: string;
  description?: string;
  notes?: string;
  recurrence?: TaskRecurrence;
};
