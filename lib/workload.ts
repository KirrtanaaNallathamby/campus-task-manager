export function estimateWorkload(instruction: string, actionPlan: string[]) {
  const text = instruction.toLowerCase();
  let hours = 4;

  hours += actionPlan.length * 2;

  if (text.includes("report")) hours += 4;
  if (text.includes("presentation")) hours += 3;
  if (text.includes("model") || text.includes("train")) hours += 8;
  if (text.includes("dataset") || text.includes("preprocessing")) hours += 5;
  if (text.includes("testing") || text.includes("evaluate")) hours += 4;
  if (text.includes("interface") || text.includes("ui")) hours += 4;
  if (text.includes("database") || text.includes("sql")) hours += 5;
  if (text.includes("rules") || text.includes("expert system")) hours += 5;

  if (hours <= 10) return 10;
  if (hours > 40) return 40;

  return hours;
}

export function calculateDifficulty(hours: number) {
  if (hours <= 12) return "Low";
  if (hours <= 25) return "Medium";
  return "High";
}