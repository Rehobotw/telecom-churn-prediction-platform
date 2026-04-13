import { useMemo, useState } from "react";
import {
  Upload,
  Download,
  Loader2,
  X,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  ShieldEllipsis,
} from "lucide-react";
import { toast } from "sonner";
import { RiskBadge } from "../RiskBadge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import { getActionInsight, formatPercent, formatCurrency } from "../../lib/utils";
import {
  createPrediction,
  uploadBatchPredictions,
  type BatchPredictionResponse,
  type BatchPredictionRow,
  type PredictionPayload,
  type PredictionResponse,
} from "../../lib/api";

const ADD_ON_SERVICE_OPTIONS = [
  "OnlineSecurity",
  "OnlineBackup",
  "DeviceProtection",
  "TechSupport",
  "StreamingTV",
  "StreamingMovies",
] as const;

type AddOnService = (typeof ADD_ON_SERVICE_OPTIONS)[number];

type SingleEntryFormData = {
  customerName: string;
  email: string;
  gender: "Male" | "Female" | "";
  dependents: boolean;
  tenure: string;
  contractType: "Month-to-month" | "One year" | "Two year" | "";
  paperlessBilling: boolean;
  paymentMethod:
    | "Electronic check"
    | "Mailed check"
    | "Bank transfer (automatic)"
    | "Credit card (automatic)"
    | "";
  phoneService: boolean;
  internetService: "DSL" | "Fiber optic" | "No" | "";
  monthlyCharges: string;
  addOnServices: AddOnService[];
};

type ModelFeaturePayload = {
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

type PredictionResult = PredictionResponse;

type RequestStatus = "idle" | "loading" | "error" | "success";

const initialFormData: SingleEntryFormData = {
  customerName: "",
  email: "",
  gender: "",
  dependents: false,
  tenure: "",
  contractType: "",
  paperlessBilling: false,
  paymentMethod: "",
  phoneService: false,
  internetService: "",
  monthlyCharges: "",
  addOnServices: [],
};

export function PredictionsPage() {
  const [activeTab, setActiveTab] = useState<"single" | "batch">("single");
  const [formData, setFormData] = useState<SingleEntryFormData>(initialFormData);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<RequestStatus>("idle");
  const [requestError, setRequestError] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [showServiceOptions, setShowServiceOptions] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [batchResults, setBatchResults] = useState<BatchPredictionRow[]>([]);
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [batchError, setBatchError] = useState("");
  const [batchCsvContent, setBatchCsvContent] = useState("");

  const filteredServiceOptions = useMemo(
    () =>
      ADD_ON_SERVICE_OPTIONS.filter((service) =>
        service.toLowerCase().includes(serviceSearch.trim().toLowerCase())
      ),
    [serviceSearch]
  );

  const batchSummary = useMemo(() => {
    const total = batchResults.length;
    const high = batchResults.filter((result) => result.riskLevel === "High").length;
    const medium = batchResults.filter((result) => result.riskLevel === "Medium").length;
    const low = batchResults.filter((result) => result.riskLevel === "Low").length;

    return {
      total,
      high,
      medium,
      low,
      averageProbability:
        total > 0 ? batchResults.reduce((sum, row) => sum + row.probability, 0) / total : 0,
    };
  }, [batchResults]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors: string[] = [];
    if (!formData.customerName.trim()) validationErrors.push("customerName");
    if (!formData.email.trim()) validationErrors.push("email");
    if (!formData.gender) validationErrors.push("gender");
    if (!formData.tenure) validationErrors.push("tenure");
    if (!formData.contractType) validationErrors.push("contractType");
    if (!formData.paymentMethod) validationErrors.push("paymentMethod");
    if (!formData.internetService) validationErrors.push("internetService");
    if (!formData.monthlyCharges) validationErrors.push("monthlyCharges");
    if (formData.addOnServices.length === 0) validationErrors.push("addOnServices");

    setMissingFields(validationErrors);

    if (validationErrors.length > 0) {
      return;
    }

    const tenure = Number(formData.tenure);
    if (Number.isNaN(tenure) || tenure < 0 || tenure > 100) {
      setMissingFields((prev) => (prev.includes("tenure") ? prev : [...prev, "tenure"]));
      return;
    }

    const monthlyCharges = Number(formData.monthlyCharges);
    if (Number.isNaN(monthlyCharges) || monthlyCharges < 0) {
      setMissingFields((prev) => (prev.includes("monthlyCharges") ? prev : [...prev, "monthlyCharges"]));
      return;
    }

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
    if (!isEmailValid) {
      setMissingFields((prev) => (prev.includes("email") ? prev : [...prev, "email"]));
      return;
    }

    // Identity fields are intentionally excluded from the model payload.
    const modelPayload: PredictionPayload = {
      customerName: formData.customerName.trim(),
      email: formData.email.trim(),
      gender: formData.gender as ModelFeaturePayload["gender"],
      dependents: formData.dependents,
      tenure,
      contractType: formData.contractType as ModelFeaturePayload["contractType"],
      paperlessBilling: formData.paperlessBilling,
      paymentMethod: formData.paymentMethod as ModelFeaturePayload["paymentMethod"],
      phoneService: formData.phoneService,
      internetService: formData.internetService as ModelFeaturePayload["internetService"],
      monthlyCharges,
      num_services: formData.addOnServices.length,
    };

    setIsSubmitting(true);
    setRequestStatus("loading");
    setRequestError("");
    setPrediction(null);
    try {
      const result = await createPrediction(modelPayload);
      setPrediction(result);
      setRequestStatus("success");
    } catch {
      const errorMessage = "Unable to connect to the prediction service. Please try again.";
      setRequestStatus("error");
      setRequestError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPrediction = () => {
    setFormData(initialFormData);
    setMissingFields([]);
    setServiceSearch("");
    setShowServiceOptions(false);
    setPrediction(null);
    setRequestError("");
    setRequestStatus("idle");
    setUploadedFile(null);
    setBatchResults([]);
    setBatchError("");
    setBatchCsvContent("");
  };

  const fieldError = (fieldName: string) => missingFields.includes(fieldName);

  const inputBorderClass = (fieldName: string) =>
    fieldError(fieldName) ? "border-[#F87171] focus-visible:ring-[#F87171]/30" : "";

  const toggleServiceSelection = (service: AddOnService) => {
    setFormData((prev) => {
      const selected = prev.addOnServices.includes(service);
      const nextServices = selected
        ? prev.addOnServices.filter((item) => item !== service)
        : [...prev.addOnServices, service];

      return {
        ...prev,
        addOnServices: nextServices,
      };
    });

    setMissingFields((prev) => prev.filter((field) => field !== "addOnServices"));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setBatchError("");
      setIsBatchUploading(true);

      try {
        const response = (await uploadBatchPredictions(file)) as BatchPredictionResponse;
        setBatchResults(response.rows);
        setBatchCsvContent(response.csvContent);
        toast.success("Batch prediction completed. Use Download CSV when you want the file.");
      } catch {
        const message = "Unable to process batch file from backend.";
        setBatchResults([]);
        setBatchError(message);
        setBatchCsvContent("");
        toast.error(`Error: ${message}`);
      } finally {
        setIsBatchUploading(false);
      }
    }
  };

  const downloadBatchCsv = (csvContent: string, sourceName = "batch-predictions") => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${sourceName}-results.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const batchRiskGuidance = [
    {
      level: "High",
      icon: ShieldAlert,
      accent: "border-red-200 bg-red-50 text-red-900",
      description: "Prioritize immediate outreach, save offers, and manager review within 24 hours.",
      count: batchSummary.high,
    },
    {
      level: "Medium",
      icon: ShieldEllipsis,
      accent: "border-amber-200 bg-amber-50 text-amber-900",
      description: "Queue proactive engagement and monitor payment, usage, or contract-change signals.",
      count: batchSummary.medium,
    },
    {
      level: "Low",
      icon: ShieldCheck,
      accent: "border-emerald-200 bg-emerald-50 text-emerald-900",
      description: "Keep in standard retention programs and re-score during the next review cycle.",
      count: batchSummary.low,
    },
  ] as const;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Predictions</h1>
        <p className="text-sm text-gray-500 mt-1">Make single or batch predictions</p>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB]">
        <div className="border-b border-[#E5E7EB]">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab("single")}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "single"
                  ? "border-[#1A56FF] text-[#1A56FF]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Single Entry
            </button>
            <button
              onClick={() => setActiveTab("batch")}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "batch"
                  ? "border-[#1A56FF] text-[#1A56FF]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Batch Upload
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === "single" ? (
            <div className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <section className="rounded-xl border border-[#E5E7EB] p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900">Customer Details</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                      <Input
                        value={formData.customerName}
                        onChange={(e) => {
                          setFormData({ ...formData, customerName: e.target.value });
                          setMissingFields((prev) => prev.filter((field) => field !== "customerName"));
                        }}
                        className={inputBorderClass("customerName")}
                        placeholder="Jane Doe"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          setMissingFields((prev) => prev.filter((field) => field !== "email"));
                        }}
                        className={inputBorderClass("email")}
                        placeholder="jane@company.com"
                      />
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <section className="rounded-xl border border-[#E5E7EB] p-4 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900">Section A: Account &amp; Demographics</h3>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">Gender</label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value: "Male" | "Female") => {
                          setFormData({ ...formData, gender: value });
                          setMissingFields((prev) => prev.filter((field) => field !== "gender"));
                        }}
                      >
                        <SelectTrigger className={inputBorderClass("gender")}>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">Dependents</label>
                      <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
                        <span className="text-sm text-gray-600">{formData.dependents ? "Yes" : "No"}</span>
                        <Switch
                          checked={formData.dependents}
                          onCheckedChange={(checked) => setFormData({ ...formData, dependents: checked })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">Tenure (Months)</label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={formData.tenure}
                        onChange={(e) => {
                          setFormData({ ...formData, tenure: e.target.value });
                          setMissingFields((prev) => prev.filter((field) => field !== "tenure"));
                        }}
                        className={inputBorderClass("tenure")}
                        placeholder="24"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">Contract Type</label>
                      <Select
                        value={formData.contractType}
                        onValueChange={(value: "Month-to-month" | "One year" | "Two year") => {
                          setFormData({ ...formData, contractType: value });
                          setMissingFields((prev) => prev.filter((field) => field !== "contractType"));
                        }}
                      >
                        <SelectTrigger className={inputBorderClass("contractType")}>
                          <SelectValue placeholder="Select contract type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Month-to-month">Month-to-month</SelectItem>
                          <SelectItem value="One year">One year</SelectItem>
                          <SelectItem value="Two year">Two year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">Paperless Billing</label>
                      <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
                        <span className="text-sm text-gray-600">{formData.paperlessBilling ? "Yes" : "No"}</span>
                        <Switch
                          checked={formData.paperlessBilling}
                          onCheckedChange={(checked) => setFormData({ ...formData, paperlessBilling: checked })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                      <Select
                        value={formData.paymentMethod}
                        onValueChange={(
                          value:
                            | "Electronic check"
                            | "Mailed check"
                            | "Bank transfer (automatic)"
                            | "Credit card (automatic)"
                        ) => {
                          setFormData({ ...formData, paymentMethod: value });
                          setMissingFields((prev) => prev.filter((field) => field !== "paymentMethod"));
                        }}
                      >
                        <SelectTrigger className={inputBorderClass("paymentMethod")}>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Electronic check">Electronic check</SelectItem>
                          <SelectItem value="Mailed check">Mailed check</SelectItem>
                          <SelectItem value="Bank transfer (automatic)">Bank transfer (automatic)</SelectItem>
                          <SelectItem value="Credit card (automatic)">Credit card (automatic)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </section>

                  <section className="rounded-xl border border-[#E5E7EB] p-4 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900">Section B: Service Configuration</h3>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">Phone Service</label>
                      <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
                        <span className="text-sm text-gray-600">{formData.phoneService ? "Yes" : "No"}</span>
                        <Switch
                          checked={formData.phoneService}
                          onCheckedChange={(checked) => setFormData({ ...formData, phoneService: checked })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">Internet Service</label>
                      <Select
                        value={formData.internetService}
                        onValueChange={(value: "DSL" | "Fiber optic" | "No") => {
                          setFormData({ ...formData, internetService: value });
                          setMissingFields((prev) => prev.filter((field) => field !== "internetService"));
                        }}
                      >
                        <SelectTrigger className={inputBorderClass("internetService")}>
                          <SelectValue placeholder="Select internet service" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DSL">DSL</SelectItem>
                          <SelectItem value="Fiber optic">Fiber optic</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">Monthly Charges ($)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.monthlyCharges}
                        onChange={(e) => {
                          setFormData({ ...formData, monthlyCharges: e.target.value });
                          setMissingFields((prev) => prev.filter((field) => field !== "monthlyCharges"));
                        }}
                        className={inputBorderClass("monthlyCharges")}
                        placeholder="29.85"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">Add-on Services (num_services)</label>
                      <div
                        className={`rounded-md border p-2 space-y-2 ${
                          fieldError("addOnServices") ? "border-[#F87171]" : "border-gray-300"
                        }`}
                      >
                        <div className="flex flex-wrap gap-2 min-h-7">
                          {formData.addOnServices.length === 0 ? (
                            <span className="text-sm text-gray-500 px-1 py-1">Select one or more services</span>
                          ) : (
                            formData.addOnServices.map((service) => (
                              <span
                                key={service}
                                className="inline-flex items-center gap-1 rounded-full bg-[#E8F0FF] text-[#1A56FF] px-2.5 py-1 text-xs font-medium"
                              >
                                {service}
                                <button
                                  type="button"
                                  onClick={() => toggleServiceSelection(service)}
                                  className="text-[#1A56FF] hover:text-[#0f3fb8]"
                                  aria-label={`Remove ${service}`}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))
                          )}
                        </div>
                        <Input
                          value={serviceSearch}
                          onFocus={() => setShowServiceOptions(true)}
                          onChange={(e) => {
                            setServiceSearch(e.target.value);
                            setShowServiceOptions(true);
                          }}
                          placeholder="Search add-on services"
                        />
                        {showServiceOptions && (
                          <div className="max-h-32 overflow-auto rounded-md border border-gray-200 p-2">
                            {filteredServiceOptions.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {filteredServiceOptions.map((service) => {
                                  const selected = formData.addOnServices.includes(service);
                                  return (
                                    <button
                                      key={service}
                                      type="button"
                                      onClick={() => toggleServiceSelection(service)}
                                      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                                        selected
                                          ? "bg-[#1A56FF] text-white border-[#1A56FF]"
                                          : "bg-white text-gray-700 border-gray-300 hover:border-[#1A56FF] hover:text-[#1A56FF]"
                                      }`}
                                    >
                                      {service}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 px-1 py-1">No matching services</div>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-gray-500">Selected services count sent as feature: {formData.addOnServices.length}</p>
                      </div>
                    </div>
                  </section>
                </div>

                {missingFields.length > 0 && (
                  <p className="text-sm text-[#F87171]">Please complete all required fields before submission.</p>
                )}

                <section className="rounded-xl border border-[#E5E7EB] p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900">Section C: Prediction Action &amp; Output</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#1A56FF] hover:bg-[#0f3fb8] text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        "Analyze Customer Risk"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResetPrediction}
                      disabled={isSubmitting}
                      className="border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </Button>
                  </div>
                </section>
              </form>

              {requestStatus === "loading" && (
                <div className="border-t border-[#E5E7EB] pt-6">
                  <div className="relative overflow-hidden rounded-2xl border border-cyan-500/40 bg-[#020617] p-8 flex flex-col items-center justify-center gap-3">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.24),transparent_55%)]" />
                    <Loader2 className="relative w-8 h-8 text-cyan-300 animate-spin" />
                    <p className="relative text-sm text-slate-200">Analyzing customer profile...</p>
                  </div>
                </div>
              )}

              {requestStatus === "error" && (
                <div className="border-t border-[#E5E7EB] pt-6">
                  <div className="relative overflow-hidden rounded-2xl border border-rose-500/50 bg-[#0f172a] p-6">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.2),transparent_45%)]" />
                    <div className="relative flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-rose-300 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-rose-200">Prediction failed</h4>
                        <p className="mt-1 text-sm text-slate-200">{requestError}</p>
                        <p className="mt-3 text-xs text-slate-400">Check your network and run the prediction again.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {requestStatus === "success" && prediction && (
                <div className="border-t border-[#E5E7EB] pt-6">
                  <div className="relative overflow-hidden rounded-2xl border border-cyan-400/50 bg-[#020617] p-6 space-y-4 shadow-[0_0_36px_rgba(34,211,238,0.2)]">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.2),transparent_38%)]" />
                    <div className="flex items-center justify-between">
                      <div className="relative">
                        <div className="text-sm text-cyan-200/80 mb-1">Probability Score</div>
                        <div className="text-4xl font-semibold text-white tracking-tight">{formatPercent(prediction.probability)} Churn Risk</div>
                      </div>
                      <div className="relative flex items-center gap-2 rounded-full border border-emerald-300/45 bg-emerald-400/10 px-3 py-1.5 text-emerald-200">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Prediction ready</span>
                      </div>
                    </div>

                    <div className="relative">
                      <RiskBadge riskLevel={prediction.riskLevel} />
                    </div>

                    <div className="relative border-t border-cyan-500/20 pt-4">
                      <div className="text-sm text-cyan-100/80 mb-1">Prediction</div>
                      <div className="text-lg font-semibold text-white">
                        {prediction.prediction ? "Will Churn" : "Will Not Churn"}
                      </div>
                    </div>

                    <div className="relative rounded-lg border border-cyan-500/30 bg-cyan-400/10 p-4">
                      <div className="text-sm font-medium text-cyan-100 mb-1">Action Insight</div>
                      <div className="text-sm text-slate-100">{getActionInsight(prediction.riskLevel)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="mb-4">
                  <label className="cursor-pointer text-[#1A56FF] hover:text-[#0f3fb8] font-medium">
                    Click to upload
                    <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <span className="text-gray-500"> or drag and drop</span>
                </div>
                <p className="text-sm text-gray-500">CSV files only</p>
                {uploadedFile && (
                  <div className="mt-4 text-sm text-gray-700">
                    Uploaded: <span className="font-medium">{uploadedFile.name}</span>
                  </div>
                )}
                {isBatchUploading && (
                  <div className="mt-4 text-sm text-gray-600 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing batch file...
                  </div>
                )}
                {batchError && <div className="mt-4 text-sm text-red-600">{batchError}</div>}
              </div>

              {batchResults.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">Processed Results</h3>
                    <button
                      onClick={() =>
                        downloadBatchCsv(
                          batchCsvContent,
                          uploadedFile?.name?.replace(/\.csv$/i, "") || "batch-predictions",
                        )
                      }
                      disabled={!batchCsvContent}
                      className="flex items-center gap-2 px-4 py-2 bg-[#1A56FF] text-white rounded-lg hover:bg-[#0f3fb8] transition-colors disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      <Download className="w-4 h-4" />
                      Download CSV
                    </button>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-[1.3fr,1fr] gap-4 mb-4">
                    <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">Batch Summary</h4>
                          <p className="mt-1 text-sm text-gray-500">Operational distribution of predicted risk levels.</p>
                        </div>
                        <div className="rounded-full bg-[#E8F0FF] px-3 py-1 text-xs font-semibold text-[#1A56FF]">
                          Avg risk {formatPercent(batchSummary.averageProbability)}
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-4 gap-3">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <div className="text-xs uppercase tracking-[0.14em] text-gray-500">Total</div>
                          <div className="mt-2 text-2xl font-semibold text-gray-900">{batchSummary.total}</div>
                        </div>
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                          <div className="text-xs uppercase tracking-[0.14em] text-red-700">High</div>
                          <div className="mt-2 text-2xl font-semibold text-red-900">{batchSummary.high}</div>
                        </div>
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                          <div className="text-xs uppercase tracking-[0.14em] text-amber-700">Medium</div>
                          <div className="mt-2 text-2xl font-semibold text-amber-900">{batchSummary.medium}</div>
                        </div>
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                          <div className="text-xs uppercase tracking-[0.14em] text-emerald-700">Low</div>
                          <div className="mt-2 text-2xl font-semibold text-emerald-900">{batchSummary.low}</div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
                      <h4 className="text-sm font-semibold text-gray-900">Risk Action Guide</h4>
                      <p className="mt-1 text-sm text-gray-500">Professional handling guidance for the current batch.</p>
                      <div className="mt-4 space-y-3">
                        {batchRiskGuidance.map((item) => {
                          const Icon = item.icon;
                          return (
                            <div key={item.level} className={`rounded-lg border p-3 ${item.accent}`}>
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 rounded-md bg-white/60 p-2">
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold">{item.level} Risk</span>
                                    <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold">
                                      {item.count} customers
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs leading-5">{item.description}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-[#E5E7EB]">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenure</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Charges</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Probability</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Level</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB]">
                        {batchResults.map((result) => (
                          <tr key={result.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{result.id}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              <div className="font-medium text-gray-900">{result.customerName || result.displayId}</div>
                              <div className="text-xs text-gray-500">{result.email || "No email provided"}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{result.tenure} months</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{formatCurrency(result.monthlyCharges)}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{formatPercent(result.probability)}</td>
                            <td className="px-6 py-4">
                              <RiskBadge riskLevel={result.riskLevel} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
