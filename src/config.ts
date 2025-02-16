// Environment variables configuration
export const config = {
  masterPin: import.meta.env.VITE_MASTER_PIN || '0606', // Default for development only
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
}; 