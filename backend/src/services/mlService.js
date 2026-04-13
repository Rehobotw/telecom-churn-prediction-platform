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
    return payload.results.map((result) => ({
      customerData: result,
      churnProbability: Number(result.probability),
      churnPrediction: Boolean(result.prediction),
      riskLevel: result.risk,
    }));
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

const handleMLError = (err) => {
  if (err.response) {
    const error = new Error('ML service error');
    error.status = err.response.status || 502;
    error.details = err.response.data;
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
/*const predictCustomer = async (data) => {
  return {
    churnProbability: 0.82,
    churnPrediction: true
  };
};

const predictBatch = async () => {
  return [];
};

const getAnalytics = async () => {
  return {};
};

const getMetrics = async () => {
  return {};
};

module.exports = {
  predictCustomer,
  predictBatch,
  getAnalytics,
  getMetrics
};*/
