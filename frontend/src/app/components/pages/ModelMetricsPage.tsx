import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, Target, TrendingUp, Award, BarChart3, Loader2, AlertTriangle } from "lucide-react";
import { getModelInfo, getModelMetrics, type ModelMetricsResponse } from "../../lib/api";

function formatModelType(modelType?: string) {
  if (!modelType) return "--";
  return modelType
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatLastTrained(value?: string) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function ModelMetricsPage() {
  const [modelMetrics, setModelMetrics] = useState<ModelMetricsResponse | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelMetricsResponse["modelInfo"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadMetrics = async () => {
      try {
        const metricsData = await getModelMetrics();
        const modelInfoResult = await getModelInfo()
          .then((data) => ({ ok: true as const, data }))
          .catch(() => ({ ok: false as const, data: null }));
        if (isMounted) {
          setModelMetrics(metricsData);
          setModelInfo(modelInfoResult.ok ? modelInfoResult.data : null);
          setError("");
        }
      } catch {
        if (isMounted) {
          setError("Unable to load model metrics from backend.");
          setModelMetrics(null);
          setModelInfo(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadMetrics();

    return () => {
      isMounted = false;
    };
  }, []);

  const metrics = modelMetrics?.metrics;
  const confusionMatrix = modelMetrics?.confusionMatrix;
  const rocData = modelMetrics?.rocData ?? [];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Model Metrics</h1>
        <p className="text-sm text-gray-500 mt-1">Current model performance indicators</p>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 flex items-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading model metrics from backend...
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 text-red-700">
          <AlertTriangle className="w-5 h-5 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-5 gap-6">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-gray-900">{typeof metrics?.accuracy === "number" ? metrics.accuracy.toFixed(4) : "--"}</div>
          <div className="text-sm text-gray-500 mt-1">Accuracy</div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-gray-900">{typeof metrics?.precision === "number" ? metrics.precision.toFixed(4) : "--"}</div>
          <div className="text-sm text-gray-500 mt-1">Precision</div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-gray-900">{typeof metrics?.recall === "number" ? metrics.recall.toFixed(4) : "--"}</div>
          <div className="text-sm text-gray-500 mt-1">Recall</div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-gray-900">{typeof metrics?.f1Score === "number" ? metrics.f1Score.toFixed(4) : "--"}</div>
          <div className="text-sm text-gray-500 mt-1">F1-Score</div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-gray-900">{typeof metrics?.rocAuc === "number" ? metrics.rocAuc.toFixed(4) : "--"}</div>
          <div className="text-sm text-gray-500 mt-1">ROC-AUC</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Confusion Matrix */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <h3 className="font-medium text-gray-900 mb-6">Confusion Matrix</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div></div>
              <div className="text-center font-medium text-gray-700">Predicted: No</div>
              <div className="text-center font-medium text-gray-700">Predicted: Yes</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center font-medium text-gray-700 text-sm">Actual: No</div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="text-2xl font-semibold text-gray-900">{confusionMatrix ? confusionMatrix[0][0] : "--"}</div>
                <div className="text-xs text-gray-500 mt-1">True Negative</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <div className="text-2xl font-semibold text-gray-900">{confusionMatrix ? confusionMatrix[0][1] : "--"}</div>
                <div className="text-xs text-gray-500 mt-1">False Positive</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center font-medium text-gray-700 text-sm">Actual: Yes</div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <div className="text-2xl font-semibold text-gray-900">{confusionMatrix ? confusionMatrix[1][0] : "--"}</div>
                <div className="text-xs text-gray-500 mt-1">False Negative</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="text-2xl font-semibold text-gray-900">{confusionMatrix ? confusionMatrix[1][1] : "--"}</div>
                <div className="text-xs text-gray-500 mt-1">True Positive</div>
              </div>
            </div>
          </div>
        </div>

        {/* ROC Curve */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-medium text-gray-900">ROC Curve</h3>
            <span className="text-sm text-gray-600">AUC = {typeof metrics?.rocAuc === "number" ? metrics.rocAuc.toFixed(4) : "--"}</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={rocData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                type="number"
                dataKey="fpr"
                domain={[0, 1]}
                stroke="#6B7280"
                fontSize={12}
                tickFormatter={(value) => Number(value).toFixed(1)}
                label={{ value: "False Positive Rate", position: "insideBottom", offset: -5 }}
              />
              <YAxis
                type="number"
                domain={[0, 1]}
                stroke="#6B7280"
                fontSize={12}
                tickFormatter={(value) => Number(value).toFixed(1)}
                label={{ value: "True Positive Rate", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                formatter={(value: number, name: string) => [value.toFixed(4), name]}
                labelFormatter={(value) => `FPR: ${Number(value).toFixed(4)}`}
                contentStyle={{ backgroundColor: "white", border: "1px solid #E5E7EB", borderRadius: "8px" }}
              />
              <Line type="stepAfter" dataKey="tpr" stroke="#1A56FF" strokeWidth={2} dot={false} name="ROC Curve" isAnimationActive={false} />
              <Line type="linear" dataKey="baseline" stroke="#9CA3AF" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Random Baseline" isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <div className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Model Information</h3>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <div className="text-gray-500">Model Type</div>
            <div className="text-gray-900 font-medium">{formatModelType(modelInfo?.modelType ?? modelMetrics?.modelInfo?.modelType)}</div>

            <div className="text-gray-500">Last Trained</div>
            <div className="text-gray-900 font-medium">{formatLastTrained(modelInfo?.lastTrained ?? modelMetrics?.modelInfo?.lastTrained)}</div>

            <div className="text-gray-500">Training Samples</div>
            <div className="text-gray-900 font-medium">
              {typeof (modelInfo?.trainingSamples ?? modelMetrics?.modelInfo?.trainingSamples) === "number"
                ? (modelInfo?.trainingSamples ?? modelMetrics?.modelInfo?.trainingSamples)?.toLocaleString()
                : "--"}
            </div>

            <div className="text-gray-500">Features Used</div>
            <div className="text-gray-900 font-medium">
              {typeof (modelInfo?.featuresUsed ?? modelMetrics?.modelInfo?.featuresUsed) === "number"
                ? (modelInfo?.featuresUsed ?? modelMetrics?.modelInfo?.featuresUsed)?.toLocaleString()
                : "--"}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
