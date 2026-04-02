const axios = require('axios');
const { PYTHON_ML_API_URL } = require('../config/config');

async function getChurnPrediction(payload) {
  try {
    const response = await axios.post(PYTHON_ML_API_URL, payload, {
      timeout: 5000,
    });

    const { prediction, probability } = response.data || {};

    if (typeof prediction === 'undefined' || typeof probability === 'undefined') {
      const error = new Error('Invalid response from ML service');
      error.status = 502;
      throw error;
    }

    return { prediction, probability };
  } catch (err) {
    if (err.response) {
      const error = new Error('ML service returned an error');
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
  }
}

module.exports = {
  getChurnPrediction,
};

