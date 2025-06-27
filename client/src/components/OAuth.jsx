
// client/src/components/OAuth.jsx

import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth';
import { app } from '../firebase';
import { signInSuccess } from '../redux/user/userSlice';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../utils/api';

export const OAuth = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleGoogleClick = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const auth = getAuth(app);

      const result = await signInWithPopup(auth, provider);

      const res = await fetch(apiUrl('/api/auth/google'), {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
        }),
      });

      const data = await res.json();
      console.log("Login response from backend:", data);

      if (!data.token || !data.user) {
        console.warn('Token eller user saknas i Google-login-svaret!');
        return;
      }

      dispatch(signInSuccess({ user: data.user, token: data.token }));
      navigate('/dashboard');
    } catch (err) {
      console.error('Could not sign in with Google:', err);
    }
  };

  return (
    <button
      onClick={handleGoogleClick}
      type="button"
      className="bg-red-700 text-white p-3 rounded-lg uppercase hover:opacity-85"
    >
      Continue with Google
    </button>
  );
};
