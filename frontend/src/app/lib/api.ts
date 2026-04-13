import { faker } from "@faker-js/faker";

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
  displayId: string;
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

export type CustomerListResponse = {
  data: CustomerRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

const DEFAULT_CUSTOMER_PAGINATION: CustomerListResponse["pagination"] = {
  page: 1,
  pageSize: 100,
  total: 0,
  totalPages: 1,
};

export type OverviewResponse = {
  totalCustomers: number;
  churnRate: number;
  retentionRate: number;
  predictionsToday: number;
  modelType?: string;
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
  customerName?: string;
  email?: string;
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
  customerId: string;
  displayId: string;
  probability: number;
  riskLevel: "High" | "Medium" | "Low";
  prediction: boolean;
  timestamp: string;
};

export type BatchPredictionRow = {
  id: string;
  displayId: string;
  customerName?: string;
  email?: string;
  tenure: number;
  monthlyCharges: number;
  probability: number;
  riskLevel: string;
  prediction: boolean;
  timestamp?: string;
};

export type BatchPredictionResponse = {
  rows: BatchPredictionRow[];
  csvContent: string;
  warnings: string[];
  rowWarnings: Array<{ row: number; column: string; message: string }>;
  ignoredColumns: string[];
};

const API_BASE_URL = ((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

function formatDisplayCustomerId(id: string) {
  const normalized = id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const compact = normalized.slice(-8).padStart(8, "0");
  return `CUST-${compact.slice(0, 4)}-${compact.slice(4)}`;
}

function hashSeed(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function getFakeIdentity(seedSource: string) {
  faker.seed(hashSeed(seedSource) || 1);
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  return {
    name: `${firstName} ${lastName}`,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
  };
}

function isPlaceholderIdentity(value: string | undefined) {
  if (!value?.trim()) {
    return true;
  }

  return /^batch customer \d+$/i.test(value.trim());
}

function mapCustomerRecord(customer: CustomerRecord) {
  const fallback = getFakeIdentity(customer.id);
  return {
    ...customer,
    displayId: formatDisplayCustomerId(customer.id),
    name: isPlaceholderIdentity(customer.name) ? fallback.name : customer.name,
    email: isPlaceholderIdentity(customer.email) ? fallback.email : customer.email,
  };
}

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
    (response) => ({
      ...response.data,
      recentPredictions: response.data.recentPredictions.map(mapCustomerRecord),
    }),
  );
}

export function getCustomers(params?: {
  search?: string;
  risk?: string;
  contractType?: string;
  page?: number;
  pageSize?: number;
}) {
  const searchParams = new URLSearchParams();

  if (params?.search) searchParams.set("search", params.search);
  if (params?.risk) searchParams.set("risk", params.risk);
  if (params?.contractType) searchParams.set("contractType", params.contractType);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));

  const query = searchParams.toString();
  const path = query ? `/api/customers?${query}` : "/api/customers";

  return requestJson<{
    success: boolean;
    data: CustomerRecord[];
    pagination?: Partial<CustomerListResponse["pagination"]>;
  }>(path).then((response) => ({
    data: response.data.map(mapCustomerRecord),
    pagination: {
      page: Number(response.pagination?.page ?? params?.page ?? DEFAULT_CUSTOMER_PAGINATION.page),
      pageSize: Number(
        response.pagination?.pageSize ?? params?.pageSize ?? DEFAULT_CUSTOMER_PAGINATION.pageSize,
      ),
      total: Number(response.pagination?.total ?? response.data.length ?? DEFAULT_CUSTOMER_PAGINATION.total),
      totalPages: Number(
        response.pagination?.totalPages ??
          Math.max(
            1,
            Math.ceil(
              Number(response.pagination?.total ?? response.data.length ?? 0) /
                Number(response.pagination?.pageSize ?? params?.pageSize ?? DEFAULT_CUSTOMER_PAGINATION.pageSize),
            ),
          ),
      ),
    },
  }));
}

export function getModelMetrics() {
  return requestJson<{ success: boolean; data: ModelMetricsResponse }>("/api/metrics").then(
    (response) => response.data,
  );
}

export function getModelInfo() {
  return requestJson<{ success: boolean; data: NonNullable<ModelMetricsResponse["modelInfo"]> }>("/api/model-info").then(
    (response) => response.data,
  );
}

export function createPrediction(payload: PredictionPayload) {
  return requestJson<{ success: boolean; data: { customerId: string; churnProbability: number; riskLevel: "High" | "Medium" | "Low"; churnPrediction: boolean; predictionDate: string } }>("/api/predictions", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then((response) => ({
    customerId: response.data.customerId,
    displayId: formatDisplayCustomerId(response.data.customerId),
    probability: response.data.churnProbability,
    riskLevel: response.data.riskLevel,
    prediction: response.data.churnPrediction,
    timestamp: response.data.predictionDate,
  }));
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

  const payload = (await response.json()) as {
    success: boolean;
    data: {
      csvContent?: string;
      warnings?: string[];
      rowWarnings?: Array<{ row: number; column: string; message: string }>;
      ignoredColumns?: string[];
      results: Array<{
        customerId: string;
        name?: string;
        email?: string;
        tenure: number;
        monthlyCharges: number;
        churnProbability: number;
        riskLevel: string;
        churnPrediction: boolean;
        predictionDate?: string;
      }>;
    };
  };

  return {
    rows: payload.data.results.map((row) => ({
      id: row.customerId,
      displayId: formatDisplayCustomerId(row.customerId),
      customerName: row.name,
      email: row.email,
      tenure: row.tenure,
      monthlyCharges: row.monthlyCharges,
      probability: row.churnProbability,
      riskLevel: row.riskLevel,
      prediction: row.churnPrediction,
      timestamp: row.predictionDate,
    })),
    csvContent: payload.data.csvContent ?? "",
    warnings: payload.data.warnings ?? [],
    rowWarnings: payload.data.rowWarnings ?? [],
    ignoredColumns: payload.data.ignoredColumns ?? [],
  } satisfies BatchPredictionResponse;
}
