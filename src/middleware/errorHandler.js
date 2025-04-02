// Error handling middleware
const errorHandler = {
  // Not Found Error Handler
  notFound: (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
  },

  // General Error Handler
  general: (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
      error: {
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
      }
    });
  }
};

module.exports = errorHandler;
