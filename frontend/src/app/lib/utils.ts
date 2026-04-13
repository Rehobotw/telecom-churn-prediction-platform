export function getRiskLevel(probability: number): string {
  if (probability >= 0.67) return "High";
  if (probability >= 0.34) return "Medium";
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
      return "Immediate retention action is required: prioritize outreach, service recovery, and targeted commercial intervention.";
    case "Medium":
      return "Use proactive support, journey remediation, and targeted communication before issues become irreversible.";
    case "Low":
      return "Keep the customer in standard engagement and monitoring flows without consuming scarce retention capacity.";
    default:
      return "";
  }
}

export function getRiskBandRange(riskLevel: string): string {
  switch (riskLevel) {
    case "High":
      return "0.67 - 1.00";
    case "Medium":
      return "0.34 - 0.66";
    case "Low":
      return "0.00 - 0.33";
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
