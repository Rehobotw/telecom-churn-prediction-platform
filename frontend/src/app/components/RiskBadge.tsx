import { getRiskColor } from "../lib/utils";

interface RiskBadgeProps {
  riskLevel: string;
}

export function RiskBadge({ riskLevel }: RiskBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getRiskColor(
        riskLevel
      )}`}
    >
      {riskLevel}
    </span>
  );
}
