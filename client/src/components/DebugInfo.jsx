//client/src/components/DebugInfo.jsx
import { apiUrl } from '../utils/api'

export const DebugInfo = () => {
  const isDev = import.meta.env.DEV

  if (!isDev) return null // 🔒 Dölj i produktion

  const apiBase = import.meta.env.VITE_API_BASE_URL

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        fontSize: '12px',
        zIndex: 9999,
        maxWidth: '300px',
      }}
    >
      <strong>Debug Info:</strong>
      <br />
      Environment: {isDev ? 'Development' : 'Production'}
      <br />
      API Base: {apiBase || 'undefined'}
      <br />
      Test URL: {apiUrl('/api/auth/signin')}
      <br />
      User Agent: {navigator.userAgent.substring(0, 50)}...
    </div>
  )
}

export default DebugInfo

