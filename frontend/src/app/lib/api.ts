export type TrendPoint = {
  month: string;
  churnRate: number;
  retentionRate: number;
};

export type FeatureImportancePoint = {
  feature: string;
  importance: number;
};

export type CustomerRecord = {
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
};

export type OverviewResponse = {
  totalCustomers: number;
  churnRate: number;
  retentionRate: number;
  predictionsToday: number;
  churnRateDelta?: number;
  retentionRateDelta?: number;
  trendData: TrendPoint[];
  featureImportance: FeatureImportancePoint[];
  recentPredictions: CustomerRecord[];
};

export type ModelMetricsResponse = {
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    rocAuc: number;
  };
  confusionMatrix: [[number, number], [number, number]];
  rocData: Array<{ fpr: number; tpr: number; baseline: number }>;
  modelInfo?: {
    modelType?: string;
    lastTrained?: string;
    trainingSamples?: number;
    featuresUsed?: number;
  };
};

export type PredictionPayload = {
  gender: "Male" | "Female";
  dependents: boolean;
  tenure: number;
  contractType: "Month-to-month" | "One year" | "Two year";
  paperlessBilling: boolean;
  paymentMethod:
    | "Electronic check"
    | "Mailed check"
    | "Bank transfer (automatic)"
    | "Credit card (automatic)";
  phoneService: boolean;
  internetService: "DSL" | "Fiber optic" | "No";
  monthlyCharges: number;
  num_services: number;
};

export type PredictionResponse = {
  probability: number;
  riskLevel: "High" | "Medium" | "Low";
  prediction: boolean;
};

export type BatchPredictionRow = {
  id: string;
  tenure: number;
  monthlyCharges: number;
  probability: number;
  riskLevel: string;
};

const API_BASE_URL = ((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export function getOverview() {
  return requestJson<{ success: boolean; data: OverviewResponse }>("/api/analytics").then(
    (response) => response.data,
  );
}

export function getCustomers() {
  return requestJson<{ success: boolean; data: CustomerRecord[] }>("/api/customers").then(
    (response) => response.data,
  );
}

export function getModelMetrics() {
  return requestJson<ModelMetricsResponse>("/api/metrics");
}

export function createPrediction(payload: PredictionPayload) {
  return requestJson<PredictionResponse>("/api/predictions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function uploadBatchPredictions(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/batch`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Upload failed with status ${response.status}`);
  }

  return (await response.json()) as BatchPredictionRow[];
}
