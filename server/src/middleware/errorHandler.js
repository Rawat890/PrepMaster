/** Centralized Express error handler. Keep internal stack traces out of production responses. */
const errorHandler = (error, req, res, next) => {
  // Delegate if the response has already started; Express can handle the remaining error.
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || error.status || 500;

  if (process.env.NODE_ENV !== 'production') {
    console.error(error);
  }

  return res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
  });
};

export default errorHandler;
