// client/src/pages/ResetPassword.jsx
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/reset-password', { token, password });
      setMsg("Password has been reset.");
    } catch {
      setMsg("Invalid or expired token.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-4">Reset Password</h2>
        <form onSubmit={handleReset} className="flex flex-col gap-4">
          <input
            type="password"
            className="p-3 border border-gray-300 rounded"
            placeholder="Enter new password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
          >
            Reset
          </button>
        </form>
        {msg && <p className="mt-4 text-center text-blue-600">{msg}</p>}
      </div>
    </div>
  );
}
