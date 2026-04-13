const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;
  const exposeDetails = statusCode < 500 || process.env.NODE_ENV === 'development';

  const response = {
    success: false,
    message:
      statusCode >= 500 && process.env.NODE_ENV !== 'development'
        ? 'Internal server error'
        : err.message || 'Something went wrong',
  };

  if (exposeDetails && err.details) {
    response.details = err.details;
  }

  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
