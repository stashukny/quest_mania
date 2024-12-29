export const API_URL = process.env.NODE_ENV === 'production' 
  ? '' // Empty string for same-origin requests in production
  : '${API_URL}'; 