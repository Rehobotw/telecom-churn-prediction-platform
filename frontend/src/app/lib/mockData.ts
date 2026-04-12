export interface Customer {
  id: string;
  name: string;
  email: string;
  tenure: number;
  monthlyCharges: number;
  contractType: string;
  internetService: string;
  paymentMethod: string;
  churnProbability: number;
  riskLevel: string;
  predictionDate: string;
}

export const mockCustomers: Customer[] = [
  {
    id: "CUST-001",
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    tenure: 12,
    monthlyCharges: 89.50,
    contractType: "Month-to-month",
    internetService: "Fiber optic",
    paymentMethod: "Electronic check",
    churnProbability: 0.82,
    riskLevel: "High",
    predictionDate: "2026-04-11"
  },
  {
    id: "CUST-002",
    name: "Michael Chen",
    email: "m.chen@email.com",
    tenure: 48,
    monthlyCharges: 65.30,
    contractType: "Two year",
    internetService: "DSL",
    paymentMethod: "Credit card",
    churnProbability: 0.15,
    riskLevel: "Low",
    predictionDate: "2026-04-11"
  },
  {
    id: "CUST-003",
    name: "Emma Rodriguez",
    email: "emma.r@email.com",
    tenure: 24,
    monthlyCharges: 75.20,
    contractType: "One year",
    internetService: "Fiber optic",
    paymentMethod: "Bank transfer",
    churnProbability: 0.45,
    riskLevel: "Medium",
    predictionDate: "2026-04-10"
  },
  {
    id: "CUST-004",
    name: "James Wilson",
    email: "j.wilson@email.com",
    tenure: 6,
    monthlyCharges: 95.00,
    contractType: "Month-to-month",
    internetService: "Fiber optic",
    paymentMethod: "Electronic check",
    churnProbability: 0.78,
    riskLevel: "High",
    predictionDate: "2026-04-11"
  },
  {
    id: "CUST-005",
    name: "Lisa Anderson",
    email: "l.anderson@email.com",
    tenure: 36,
    monthlyCharges: 55.75,
    contractType: "Two year",
    internetService: "DSL",
    paymentMethod: "Credit card",
    churnProbability: 0.22,
    riskLevel: "Low",
    predictionDate: "2026-04-10"
  },
  {
    id: "CUST-006",
    name: "David Martinez",
    email: "d.martinez@email.com",
    tenure: 18,
    monthlyCharges: 82.40,
    contractType: "One year",
    internetService: "Fiber optic",
    paymentMethod: "Mailed check",
    churnProbability: 0.52,
    riskLevel: "Medium",
    predictionDate: "2026-04-09"
  },
  {
    id: "CUST-007",
    name: "Patricia Taylor",
    email: "p.taylor@email.com",
    tenure: 60,
    monthlyCharges: 70.15,
    contractType: "Two year",
    internetService: "DSL",
    paymentMethod: "Bank transfer",
    churnProbability: 0.10,
    riskLevel: "Low",
    predictionDate: "2026-04-11"
  },
  {
    id: "CUST-008",
    name: "Robert Lee",
    email: "r.lee@email.com",
    tenure: 3,
    monthlyCharges: 105.90,
    contractType: "Month-to-month",
    internetService: "Fiber optic",
    paymentMethod: "Electronic check",
    churnProbability: 0.88,
    riskLevel: "High",
    predictionDate: "2026-04-11"
  }
];

export const mockTrendData = [
  { month: "Oct", churnRate: 0.16, retentionRate: 0.84 },
  { month: "Nov", churnRate: 0.15, retentionRate: 0.85 },
  { month: "Dec", churnRate: 0.14, retentionRate: 0.86 },
  { month: "Jan", churnRate: 0.13, retentionRate: 0.87 },
  { month: "Feb", churnRate: 0.14, retentionRate: 0.86 },
  { month: "Mar", churnRate: 0.14, retentionRate: 0.86 },
];

export const mockFeatureImportance = [
  { feature: "Monthly Charges", importance: 0.28 },
  { feature: "Tenure", importance: 0.22 },
  { feature: "Contract Type", importance: 0.18 },
  { feature: "Payment Method", importance: 0.15 },
  { feature: "Internet Service", importance: 0.12 },
  { feature: "Paperless Billing", importance: 0.05 },
];

export const mockMetrics = {
  accuracy: 0.7353,
  precision: 0.50,
  recall: 0.78,
  f1Score: 0.61,
  rocAuc: 0.8409,
};

export const mockConfusionMatrix = [
  [850, 120],
  [180, 650],
];

export const mockROCData = [
  { fpr: 0, tpr: 0, baseline: 0 },
  { fpr: 0.1, tpr: 0.65, baseline: 0.1 },
  { fpr: 0.2, tpr: 0.78, baseline: 0.2 },
  { fpr: 0.3, tpr: 0.84, baseline: 0.3 },
  { fpr: 0.4, tpr: 0.88, baseline: 0.4 },
  { fpr: 0.5, tpr: 0.91, baseline: 0.5 },
  { fpr: 0.6, tpr: 0.93, baseline: 0.6 },
  { fpr: 0.7, tpr: 0.95, baseline: 0.7 },
  { fpr: 0.8, tpr: 0.97, baseline: 0.8 },
  { fpr: 0.9, tpr: 0.99, baseline: 0.9 },
  { fpr: 1, tpr: 1, baseline: 1 },
];
