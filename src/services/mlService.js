const axios = require('axios');
const config = require('../config/config');

const predictCustomer = async (data) => {
  try {
    const response = await axios.post(`${config.ML_SERVICE_URL}/predict`, data, {
      timeout: 10000,
    });

    return {
      churnProbability: response.data.probability,
      churnPrediction: response.data.prediction === 'Yes',
    };
  } catch (err) {
    handleMLError(err);
  }
};

const predictBatch = async (data) => {
  try {
    const response = await axios.post(`${config.ML_SERVICE_URL}/batch_predict`, { data }, {
      timeout: 30000,
    });

    return response.data.results.map(result => ({
      customerData: result.customer,
      churnProbability: result.probability,
      churnPrediction: result.prediction === 'Yes',
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

const handleMLError = (err) => {
  if (err.response) {
    const error = new Error('ML service error');
    error.status = err.response.status || 502;
    error.details = err.response.data;
    throw error;
  }

  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    const error = new Error('Unable to reach ML service');
    error.status = 503;
    throw error;
  }

  throw err;
};

module.exports = {
  predictCustomer,
  predictBatch,
  getAnalytics,
  getMetrics,
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