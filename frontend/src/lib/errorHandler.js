/**
 * Format error messages from API responses
 * Handles both string and array (validation error) formats
 */
export const formatErrorMessage = (error, defaultMessage = 'Operation failed') => {
  const errorDetail = error?.response?.data?.detail;
  
  if (typeof errorDetail === 'string') {
    return errorDetail;
  }
  
  if (Array.isArray(errorDetail)) {
    // Handle Pydantic validation errors
    return errorDetail
      .map(err => {
        if (typeof err === 'string') return err;
        if (err.msg) return err.msg;
        return JSON.stringify(err);
      })
      .join(', ');
  }
  
  return defaultMessage;
};
