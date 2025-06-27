//client/src/utils/errorHandler.js

export const handleApiError = async (response, context = 'API call') => {
  console.log(`${context} - Response status:`, response.status)
  console.log(`${context} - Response headers:`, response.headers)

  if (!response.ok) {
    let errorMessage
    try {
      const errorData = await response.text() // Use text() first to see raw response
      console.log(`${context} - Raw response:`, errorData)

      // Try to parse as JSON
      try {
        const jsonData = JSON.parse(errorData)
        errorMessage =
          jsonData.message || `HTTP error! status: ${response.status}`
      } catch {
        // If not JSON, use the raw text
        errorMessage = errorData || `HTTP error! status: ${response.status}`
      }
    } catch {
      errorMessage = `Failed to read response: ${response.status}`
    }

    throw new Error(errorMessage)
  }

  // For successful responses, try to parse JSON
  try {
    const data = await response.json()
    return data
  } catch (parseError) {
    console.error(`${context} - Failed to parse JSON:`, parseError)
    const text = await response.text()
    console.log(`${context} - Response text:`, text)
    throw new Error('Invalid JSON response from server')
  }
}

export const logApiCall = (url, options = {}) => {
  console.log('Making API call to:', url)
  console.log('API call options:', options)
  console.log('Environment:', import.meta.env.MODE)
  console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL)
}
