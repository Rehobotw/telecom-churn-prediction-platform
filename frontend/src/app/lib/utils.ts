export function getRiskLevel(probability: number, threshold: number = 0.5): string {
  if (probability >= threshold) return "High";
  if (probability >= threshold - 0.2) return "Medium";
  return "Low";
}

export function getRiskColor(riskLevel: string): string {
  switch (riskLevel) {
    case "High":
      return "text-white bg-[#F87171] border-[#F87171]";
    case "Medium":
      return "text-[#854D0E] bg-[#FBBF24]/25 border-[#FBBF24]";
    case "Low":
      return "text-[#065F46] bg-[#34D399]/20 border-[#34D399]";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

export function getActionInsight(riskLevel: string): string {
  switch (riskLevel) {
    case "High":
      return "Consider immediate retention outreach.";
    case "Medium":
      return "Monitor closely and consider retention strategy.";
    case "Low":
      return "Customer is low risk, continue monitoring.";
    default:
      return "";
  }
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}
