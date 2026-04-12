const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;

  const response = {
    success: false,
    message: err.message || 'Something went wrong',
  };

  if (err.details) {
    response.details = err.details;
  }

  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;