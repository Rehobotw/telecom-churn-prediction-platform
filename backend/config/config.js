const PYTHON_ML_API_URL =
  process.env.PYTHON_ML_API_URL || 'http://ml-service:8000/predict';

module.exports = {
  PYTHON_ML_API_URL,
};

