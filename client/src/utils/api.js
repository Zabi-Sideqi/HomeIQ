//client/src/utils/api.js

// Use proxy in development, full URL in production
const isDevelopment = import.meta.env.DEV

export const apiUrl = (path) => {
  if (isDevelopment) {
    // Use Vite proxy in development
    console.log('Development API URL:', path)
    return path
  } else {
    // Use full URL in production - with fallback
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://homeiq-backend.onrender.com'
    const fullUrl = `${API_BASE}${path}`
    console.log('Production API URL:', fullUrl)
    console.log('Environment variables:', {
      DEV: import.meta.env.DEV,
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      MODE: import.meta.env.MODE
    })
    return fullUrl
  }
}

// Export API_BASE for files that need the base URL directly
export const API_BASE = isDevelopment ? '' : (import.meta.env.VITE_API_BASE_URL || 'https://homeiq-backend.onrender.com') 



