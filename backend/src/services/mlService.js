const axios = require('axios');
const fs = require('fs').promises;
const config = require('../config/config');

const yesNo = (value) => (value ? 'Yes' : 'No');

const toMlPredictionPayload = (data) => ({
  gender: data.gender,
  Dependents: yesNo(data.dependents),
  tenure: Number(data.tenure),
  PhoneService: yesNo(data.phoneService),
  InternetService: data.internetService,
  Contract: data.contractType,
  PaperlessBilling: yesNo(data.paperlessBilling),
  PaymentMethod: data.paymentMethod,
  MonthlyCharges: Number(data.monthlyCharges),
  TotalCharges:
    data.totalCharges !== undefined
      ? Number(data.totalCharges)
      : Number(data.monthlyCharges) * Number(data.tenure),
  num_services: Number(data.num_services ?? 0),
});

const predictCustomer = async (data) => {
  try {
    const response = await axios.post(`${config.ML_SERVICE_URL}/predict`, toMlPredictionPayload(data), {
      timeout: 10000,
    });

    return {
      churnProbability: Number(response.data.probability),
      churnPrediction: Boolean(response.data.prediction),
      riskLevel: response.data.risk,
    };
  } catch (err) {
    handleMLError(err);
  }
};

const predictBatch = async (file) => {
  try {
    const buffer = await fs.readFile(file.path);
    const formData = new FormData();
    formData.append(
      'file',
      new Blob([buffer], { type: file.mimetype || 'text/csv' }),
      file.originalname || 'batch.csv'
    );

    const response = await fetch(`${config.ML_SERVICE_URL}/batch_predict`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const details = await response.text();
      const error = new Error('ML service error');
      error.status = response.status || 502;
      error.details = details;
      throw error;
    }

    const payload = await response.json();
    if (!payload || !Array.isArray(payload.results)) {
      const error = new Error('Invalid response from ML service');
      error.status = 502;
      error.details = payload;
      throw error;
    }

    return {
      results: payload.results.map((result) => ({
        customerData: result,
        churnProbability: Number(result.probability),
        churnPrediction: Boolean(result.prediction),
        riskLevel: result.risk,
      })),
      warnings: Array.isArray(payload.warnings) ? payload.warnings : [],
      rowWarnings: Array.isArray(payload.row_warnings) ? payload.row_warnings : [],
      ignoredColumns: Array.isArray(payload.ignored_columns) ? payload.ignored_columns : [],
    };
  } catch (err) {
    handleMLError(err);
  }
};

const getAnalytics = async () => {
  try {
    const response = await axios.get(`${config.ML_SERVICE_URL}/analytics`, {
      timeout: 10000,
    });

    return response.data;
  } catch (err) {
    handleMLError(err);
  }
};

const getMetrics = async () => {
  try {
    const response = await axios.get(`${config.ML_SERVICE_URL}/metrics`, {
      timeout: 10000,
    });

    return response.data;
  } catch (err) {
    handleMLError(err);
  }
};

const getModelInfo = async () => {
  try {
    const response = await axios.get(`${config.ML_SERVICE_URL}/model-info`, {
      timeout: 10000,
    });

    return response.data;
  } catch (err) {
    handleMLError(err);
  }
};

const parsePossibleJson = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const handleMLError = (err) => {
  if (err.response) {
    const error = new Error('ML service error');
    error.status = err.response.status || 502;
    error.details = err.response.data;
    throw error;
  }

  if (err.status) {
    const error = new Error(err.message || 'ML service error');
    error.status = err.status;
    error.details = parsePossibleJson(err.details);
    throw error;
  }

  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'EPERM') {
    const error = new Error('Unable to reach ML service');
    error.status = 503;
    throw error;
  }

  if (
    err.cause &&
    (err.cause.code === 'ECONNREFUSED' || err.cause.code === 'ETIMEDOUT' || err.cause.code === 'EPERM')
  ) {
    const error = new Error('Unable to reach ML service');
    error.status = 503;
    throw error;
  }

  if (err.name === 'TimeoutError' || err.name === 'AbortError') {
    const error = new Error('ML service request timed out');
    error.status = 504;
    throw error;
  }

  throw err;
};

module.exports = {
  predictCustomer,
  predictBatch,
  getAnalytics,
  getMetrics,
  getModelInfo,
};
