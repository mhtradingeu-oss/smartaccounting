
const sendResponse = (res, statusCode, status, message, data = null, pagination = null) => {
  const response = {
    status,
    message,
    timestamp: new Date().toISOString(),
    ...(data && { data }),
    ...(pagination && { pagination })
  };

  res.status(statusCode).json(response);
};

const sendSuccess = (res, message, data = null, statusCode = 200) => {
  sendResponse(res, statusCode, 'success', message, data);
};

const sendError = (res, message, statusCode = 500, errors = null) => {
  const response = {
    status: 'error',
    message,
    timestamp: new Date().toISOString(),
    ...(errors && { errors })
  };

  res.status(statusCode).json(response);
};

const sendPaginatedResponse = (res, message, data, pagination) => {
  sendResponse(res, 200, 'success', message, data, pagination);
};

const sendCreated = (res, message, data) => {
  sendResponse(res, 201, 'success', message, data);
};

const sendNoContent = (res, message = 'Resource deleted successfully') => {
  res.status(204).json({
    status: 'success',
    message,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  sendResponse,
  sendSuccess,
  sendError,
  sendPaginatedResponse,
  sendCreated,
  sendNoContent
};
