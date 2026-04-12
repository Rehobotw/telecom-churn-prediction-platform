import { useEffect, useState } from "react";
import { Search, Filter, Loader2, AlertTriangle } from "lucide-react";
import { RiskBadge } from "../RiskBadge";
import { formatPercent, formatCurrency } from "../../lib/utils";
import { getCustomers, type CustomerRecord } from "../../lib/api";

export function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [contractFilter, setContractFilter] = useState("");
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadCustomers = async () => {
      try {
        const data = await getCustomers();
        if (isMounted) {
          setCustomers(data);
          setError("");
        }
      } catch {
        if (isMounted) {
          setError("Unable to load customers from backend.");
          setCustomers([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCustomers();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCustomers = (Array.isArray(customers) ? customers : []).filter((customer) => {
    const matchesSearch =
      customer.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = !riskFilter || customer.riskLevel === riskFilter;
    const matchesContract = !contractFilter || customer.contractType === contractFilter;
    return matchesSearch && matchesRisk && matchesContract;
  });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
        <p className="text-sm text-gray-500 mt-1">Manage customer records and predictions</p>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 flex items-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading customers from backend...
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 text-red-700">
          <AlertTriangle className="w-5 h-5 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {!isLoading && (
        <div className="bg-white rounded-xl border border-[#E5E7EB]">
        <div className="p-6 border-b border-[#E5E7EB] space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56FF] focus:border-transparent"
                placeholder="Search by ID, name, or email"
              />
            </div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56FF] focus:border-transparent"
            >
              <option value="">All Risk Levels</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select
              value={contractFilter}
              onChange={(e) => setContractFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56FF] focus:border-transparent"
            >
              <option value="">All Contracts</option>
              <option value="Month-to-month">Month-to-month</option>
              <option value="One year">One year</option>
              <option value="Two year">Two year</option>
            </select>
            {(searchQuery || riskFilter || contractFilter) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setRiskFilter("");
                  setContractFilter("");
                }}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-[#E5E7EB]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenure</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Charges</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Churn Probability</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prediction Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{customer.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{customer.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{customer.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{customer.tenure} months</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatCurrency(customer.monthlyCharges)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{customer.contractType}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{formatPercent(customer.churnProbability)}</td>
                  <td className="px-6 py-4">
                    <RiskBadge riskLevel={customer.riskLevel} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{customer.predictionDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No customers found matching your filters</p>
          </div>
        )}
        </div>
      )}
    </div>
  );
}
