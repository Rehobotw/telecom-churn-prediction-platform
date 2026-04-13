import { useEffect, useState } from "react";
import { Users, TrendingDown, TrendingUp, Target, ArrowUp, ArrowDown, Loader2, AlertTriangle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { RiskBadge } from "../RiskBadge";
import { formatPercent, formatCurrency } from "../../lib/utils";
import { getOverview, type OverviewResponse } from "../../lib/api";

export function OverviewPage() {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadOverview = async () => {
      try {
        const data = await getOverview();
        if (isMounted) {
          setOverview(data);
          setError("");
        }
      } catch {
        if (isMounted) {
          setError("Unable to load overview data from backend.");
          setOverview(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  const trendData = overview?.trendData ?? [];
  const featureImportance = overview?.featureImportance ?? [];
  const recentPredictions = overview?.recentPredictions ?? [];
  const featureImportanceTitle = overview?.modelType
    ? `Feature Importance (${overview.modelType})`
    : "Feature Importance";

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Customer churn activity summary</p>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 flex items-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading overview from backend...
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 text-red-700">
          <AlertTriangle className="w-5 h-5 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-gray-900">{overview ? overview.totalCustomers.toLocaleString() : "--"}</div>
          <div className="text-sm text-gray-500 mt-1">Total Customers</div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-gray-900">{overview ? formatPercent(overview.churnRate) : "--"}</div>
          <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            Churn Rate
            {typeof overview?.churnRateDelta === "number" && (
              <span className="inline-flex items-center gap-1 text-red-600 text-xs">
                <ArrowDown className="w-3 h-3" />
                {Math.abs(overview.churnRateDelta).toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-gray-900">{overview ? formatPercent(overview.retentionRate) : "--"}</div>
          <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            Retention Rate
            {typeof overview?.retentionRateDelta === "number" && (
              <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                <ArrowUp className="w-3 h-3" />
                {Math.abs(overview.retentionRateDelta).toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-gray-900">{overview ? overview.predictionsToday : "--"}</div>
          <div className="text-sm text-gray-500 mt-1">Predictions Today</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <h3 className="font-medium text-gray-900 mb-4">Churn Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
              <Tooltip
                formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                contentStyle={{ backgroundColor: "white", border: "1px solid #E5E7EB", borderRadius: "8px" }}
              />
              <Legend />
              <Line key="churn" type="monotone" dataKey="churnRate" stroke="#F87171" strokeWidth={2} name="Churn Rate" />
              <Line key="retention" type="monotone" dataKey="retentionRate" stroke="#34D399" strokeWidth={2} name="Retention Rate" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <h3 className="font-medium text-gray-900 mb-4">{featureImportanceTitle}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={featureImportance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" stroke="#6B7280" fontSize={12} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
              <YAxis type="category" dataKey="feature" stroke="#6B7280" fontSize={12} width={120} />
              <Tooltip
                formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                contentStyle={{ backgroundColor: "white", border: "1px solid #E5E7EB", borderRadius: "8px" }}
              />
              <Bar dataKey="importance" fill="#1A56FF" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Predictions Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB]">
        <div className="p-6 border-b border-[#E5E7EB]">
          <h3 className="font-medium text-gray-900">Recent Predictions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-[#E5E7EB]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenure</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Charges</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Churn Probability</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {recentPredictions.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">{customer.displayId}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{customer.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{customer.tenure} months</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatCurrency(customer.monthlyCharges)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[120px]">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${customer.churnProbability * 100}%`,
                            backgroundColor: customer.riskLevel === "High" ? "#F87171" : customer.riskLevel === "Medium" ? "#FBBF24" : "#34D399"
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-900 font-medium">{formatPercent(customer.churnProbability)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <RiskBadge riskLevel={customer.riskLevel} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
