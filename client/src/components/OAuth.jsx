// client/src/components/OAuth.jsx
// client/src/components/OAuth.jsx
import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth'
import { app } from '../firebase'
import { signInSuccess } from '../redux/user/userSlice'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { apiUrl } from '../utils/api'

export const OAuth = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleGoogleClick = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const auth = getAuth(app)

      // 🔐 1. Sign in with Google popup
      const result = await signInWithPopup(auth, provider)
      const { displayName, email, photoURL } = result.user

      // 🌐 2. Send user info to backend
      const res = await fetch(apiUrl('/api/auth/google'), {
        method: 'POST',
        credentials: 'include', // Important if using cookies/session
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: displayName, email, photoURL }),
      })

      const data = await res.json()
      console.log('🔁 Backend response:', data)

      // 🧠 3. Handle different response formats
      if (data.user && data.token) {
        dispatch(signInSuccess({ user: data.user, token: data.token }))
      } else if (data.token) {
        const { token, ...userData } = data
        dispatch(signInSuccess({ user: userData, token }))
      } else {
        dispatch(signInSuccess({ user: data, token: null }))
      }

      // ✅ 4. Navigate based on user setup completion
      if (data.user && !data.user.stripeCustomerId) {
        // New OAuth user needs to add payment method
        navigate('/setup-payment', {
          state: {
            user: data.user,
            token: data.token,
            isOAuthUser: true,
          },
        })
      } else {
        // Existing user with payment method
        navigate('/')
      }
    } catch (err) {
      console.error('❌ Google sign-in failed:', err)
      alert('Could not sign in with Google. Please try again.')
    }
  }

  return (
    <button
      onClick={handleGoogleClick}
      type='button'
      className='bg-red-700 text-white p-3 rounded-lg uppercase hover:opacity-90'
    >
      Continue with Google
    </button>
  )
}
