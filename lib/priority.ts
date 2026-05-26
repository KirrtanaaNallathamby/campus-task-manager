export function calculatePriority(dueDate: string) {
  const today = new Date();
  const due = new Date(dueDate);

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return "Overdue";

  if (diffDays <= 3) return "Urgent";

  if (diffDays <= 14) return "High";

  if (diffDays <= 30) return "Medium";

  return "Low";
}