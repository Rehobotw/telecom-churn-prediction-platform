const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;
  const exposeError = err.expose || statusCode < 500 || process.env.NODE_ENV === 'development';

  const response = {
    success: false,
    message:
      !exposeError && statusCode >= 500 && process.env.NODE_ENV !== 'development'
        ? 'Internal server error'
        : err.message || 'Something went wrong',
  };

  if (exposeError && err.details) {
    response.details = err.details;
  }

  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
