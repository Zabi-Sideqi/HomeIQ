//client/src/utils/api.js

// Use proxy in development, full URL in production
const isDevelopment = import.meta.env.DEV

export const apiUrl = (path) => {
  if (isDevelopment) {
    // Use Vite proxy in development
    return path
  } else {
    // Use full URL in production
    const API_BASE = import.meta.env.VITE_API_BASE_URL
    return `${API_BASE}${path}`
  }
}

// Export API_BASE for files that need the base URL directly
export const API_BASE = isDevelopment ? '' : import.meta.env.VITE_API_BASE_URL 



